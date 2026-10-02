/**
 * Double-Entry Append-Only Ledger Engine for OSUN-TSA
 * 
 * Non-Negotiable Invariants:
 * 1. Money stored strictly in integer kobo.
 * 2. Invariant: Sum of Debits == Sum of Credits per transaction.
 * 3. Append-only: No transaction or entry is ever updated or deleted.
 * 4. Corrections and refunds are recorded as explicit reversing transactions.
 */

import { LedgerAccount, LedgerEntry, LedgerTransaction, SplitRule, Invoice } from '../types';

export class LedgerInvariantError extends Error {
  constructor(message: string) {
    super(`[LEDGER INVARIANT VIOLATION] ${message}`);
    this.name = 'LedgerInvariantError';
  }
}

/**
 * Standard Chart of Accounts for Osun State TSA
 */
export const INITIAL_LEDGER_ACCOUNTS: LedgerAccount[] = [
  // Assets (1000 - 1999)
  {
    id: 'acc-1001',
    code: '1001',
    name: 'TSA Central Reserve (CBN / Zenith / Wema)',
    type: 'ASSET',
    description: 'Main Consolidated Revenue Account for Osun State Treasury Single Account',
    balanceKobo: 0,
  },
  {
    id: 'acc-1010',
    code: '1010',
    name: 'Gateway Clearing Account (In-Transit Collections)',
    type: 'ASSET',
    description: 'Funds collected by Remita/Paystack/Interswitch/NIBSS awaiting T+1 settlement sweep',
    balanceKobo: 0,
  },
  {
    id: 'acc-1020',
    code: '1020',
    name: 'Bank Branch Cash Collection Transit',
    type: 'ASSET',
    description: 'Teller collections at designated commercial bank branches across Osun',
    balanceKobo: 0,
  },
  
  // Liabilities (2000 - 2999)
  {
    id: 'acc-2010',
    code: '2010',
    name: 'Local Government Councils Statutory Share Payable',
    type: 'LIABILITY',
    description: 'Portion of joint tenement/market fees owed to 30 LGAs and Area Office',
    balanceKobo: 0,
  },
  {
    id: 'acc-2020',
    code: '2020',
    name: 'Payment Gateway / Switch Processing Fees Payable',
    type: 'LIABILITY',
    description: 'Aggregated switch and gateway processing charges to be remitted to payment providers',
    balanceKobo: 0,
  },
  {
    id: 'acc-2030',
    code: '2030',
    name: 'Unallocated Citizen Overpayments & Escrow',
    type: 'LIABILITY',
    description: 'Suspense account for unresolved payments and disputes',
    balanceKobo: 0,
  },

  // Revenue (4000 - 4999)
  {
    id: 'acc-4001',
    code: '4001',
    name: 'Osun Consolidated Revenue Fund (CRF)',
    type: 'REVENUE',
    description: 'State treasury general fund for governance, education, healthcare, and infrastructure',
    balanceKobo: 0,
  },
  {
    id: 'acc-4010',
    code: '4010',
    name: 'MDA Internally Generated Revenue (IGR) Retention',
    type: 'REVENUE',
    description: 'Statutory MDA operational retention account for universities, hospitals, and boards',
    balanceKobo: 0,
  },
  {
    id: 'acc-4020',
    code: '4020',
    name: 'Osun State Health Insurance Agency (OSHIA) Fund',
    type: 'REVENUE',
    description: 'Dedicated healthcare pool for state universal health coverage',
    balanceKobo: 0,
  },

  // Expenses (5000 - 5999)
  {
    id: 'acc-5010',
    code: '5010',
    name: 'Collection Service & Gateway Surcharge Expense',
    type: 'EXPENSE',
    description: 'Government-borne processing fees and digital collection costs',
    balanceKobo: 0,
  },
];

/**
 * Validates that debits equal credits for a proposed transaction
 */
export function validateTransactionEntries(entries: Omit<LedgerEntry, 'id' | 'transactionId'>[]): {
  isValid: boolean;
  totalDebitKobo: number;
  totalCreditKobo: number;
  differenceKobo: number;
} {
  let totalDebitKobo = 0;
  let totalCreditKobo = 0;

  for (const entry of entries) {
    if (!Number.isInteger(entry.amountKobo) || entry.amountKobo <= 0) {
      throw new LedgerInvariantError(`Entry amount must be a positive integer kobo. Received: ${entry.amountKobo}`);
    }

    if (entry.direction === 'DEBIT') {
      totalDebitKobo += entry.amountKobo;
    } else if (entry.direction === 'CREDIT') {
      totalCreditKobo += entry.amountKobo;
    } else {
      throw new LedgerInvariantError(`Invalid entry direction: ${(entry as any).direction}`);
    }
  }

  const differenceKobo = totalDebitKobo - totalCreditKobo;
  return {
    isValid: differenceKobo === 0,
    totalDebitKobo,
    totalCreditKobo,
    differenceKobo,
  };
}

/**
 * Creates an immutable, balanced ledger transaction
 */
export function createLedgerTransaction(params: {
  reference: string;
  type: LedgerTransaction['type'];
  narrative: string;
  entries: Omit<LedgerEntry, 'id' | 'transactionId'>[];
  isReversal?: boolean;
  reversedTransactionId?: string;
}): LedgerTransaction {
  const validation = validateTransactionEntries(params.entries);
  if (!validation.isValid) {
    throw new LedgerInvariantError(
      `Transaction out of balance! Debits (${validation.totalDebitKobo}) must equal Credits (${validation.totalCreditKobo}). Discrepancy: ${validation.differenceKobo} kobo.`
    );
  }

  const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  const finalEntries: LedgerEntry[] = params.entries.map((entry, index) => ({
    id: `entry-${transactionId}-${index + 1}`,
    transactionId,
    accountId: entry.accountId,
    accountCode: entry.accountCode,
    accountName: entry.accountName,
    direction: entry.direction,
    amountKobo: entry.amountKobo,
    description: entry.description,
  }));

  return {
    id: transactionId,
    reference: params.reference,
    type: params.type,
    narrative: params.narrative,
    timestamp: now,
    entries: finalEntries,
    totalDebitKobo: validation.totalDebitKobo,
    totalCreditKobo: validation.totalCreditKobo,
    balanced: true,
    isReversal: params.isReversal || false,
    reversedTransactionId: params.reversedTransactionId,
  };
}

/**
 * Generates the ledger entries for a verified payment based on the revenue head's split rule
 */
export function buildPaymentLedgerEntries(
  invoice: Invoice,
  splitRule: SplitRule,
  accounts: LedgerAccount[]
): Omit<LedgerEntry, 'id' | 'transactionId'>[] {
  const clearingAcc = accounts.find((a) => a.code === '1010') || accounts[1];
  const crfAcc = accounts.find((a) => a.code === '4001') || accounts[6];
  const mdaAcc = accounts.find((a) => a.code === '4010') || accounts[7];
  const lgaAcc = accounts.find((a) => a.code === '2010') || accounts[3];
  const feeAcc = accounts.find((a) => a.code === '2020') || accounts[4];

  const totalAmountKobo = invoice.totalAmountKobo;
  const entries: Omit<LedgerEntry, 'id' | 'transactionId'>[] = [];

  // 1. Debit Clearing Account with the gross collected funds
  entries.push({
    accountId: clearingAcc.id,
    accountCode: clearingAcc.code,
    accountName: clearingAcc.name,
    direction: 'DEBIT',
    amountKobo: totalAmountKobo,
    description: `Gross settlement in-transit for PRN: ${invoice.prn} (${invoice.revenueHeadName})`,
  });

  // 2. Credits according to statutory split rule
  let allocatedKobo = 0;
  const splits = splitRule.splits;

  for (let i = 0; i < splits.length; i++) {
    const split = splits[i];
    const isLast = i === splits.length - 1;
    
    // For the last split, allocate the exact remainder to eliminate any rounding rounding kobo
    const splitKobo = isLast
      ? totalAmountKobo - allocatedKobo
      : Math.floor((totalAmountKobo * split.percentage) / 100);

    allocatedKobo += splitKobo;

    let targetAccount = crfAcc;
    if (split.recipient === 'MDA_RETENTION') targetAccount = mdaAcc;
    else if (split.recipient === 'LGA_SHARE') targetAccount = lgaAcc;
    else if (split.recipient === 'GATEWAY_FEE') targetAccount = feeAcc;

    entries.push({
      accountId: targetAccount.id,
      accountCode: targetAccount.code,
      accountName: targetAccount.name,
      direction: 'CREDIT',
      amountKobo: splitKobo,
      description: `${split.recipient.replace('_', ' ')} (${split.percentage}%) for PRN ${invoice.prn}`,
    });
  }

  return entries;
}

/**
 * Creates an exact reversing transaction for a refund or disputed transaction.
 * Appends a mirror-opposite entry set. Never modifies original records.
 */
export function buildReversalTransaction(
  originalTx: LedgerTransaction,
  reason: string
): LedgerTransaction {
  const reversedEntries: Omit<LedgerEntry, 'id' | 'transactionId'>[] = originalTx.entries.map((entry) => ({
    accountId: entry.accountId,
    accountCode: entry.accountCode,
    accountName: entry.accountName,
    direction: entry.direction === 'DEBIT' ? 'CREDIT' : 'DEBIT',
    amountKobo: entry.amountKobo,
    description: `[REVERSAL] Mirror opposite of ${entry.id}: ${entry.description}`,
  }));

  return createLedgerTransaction({
    reference: `REV-${originalTx.reference}`,
    type: 'REVERSAL',
    narrative: `Authorized Reversal of Tx ${originalTx.id}. Reason: ${reason}`,
    entries: reversedEntries,
    isReversal: true,
    reversedTransactionId: originalTx.id,
  });
}

/**
 * Calculate Trial Balance across all ledger accounts based on append-only transactions
 */
export function calculateTrialBalance(
  accounts: LedgerAccount[],
  transactions: LedgerTransaction[]
): {
  balances: {
    accountId: string;
    code: string;
    name: string;
    type: string;
    debitKobo: number;
    creditKobo: number;
    netBalanceKobo: number;
  }[];
  totalDebitKobo: number;
  totalCreditKobo: number;
  isBalanced: boolean;
} {
  const accountMap = new Map<
    string,
    {
      accountId: string;
      code: string;
      name: string;
      type: string;
      totalDebits: number;
      totalCredits: number;
    }
  >();

  for (const acc of accounts) {
    accountMap.set(acc.id, {
      accountId: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      totalDebits: 0,
      totalCredits: 0,
    });
  }

  for (const tx of transactions) {
    for (const entry of tx.entries) {
      const acc = accountMap.get(entry.accountId);
      if (acc) {
        if (entry.direction === 'DEBIT') {
          acc.totalDebits += entry.amountKobo;
        } else {
          acc.totalCredits += entry.amountKobo;
        }
      }
    }
  }

  let totalDebitKobo = 0;
  let totalCreditKobo = 0;
  const balances = [];

  for (const acc of accountMap.values()) {
    totalDebitKobo += acc.totalDebits;
    totalCreditKobo += acc.totalCredits;

    // Normal debit balance for Assets & Expenses: Debits - Credits
    // Normal credit balance for Liabilities, Equity, Revenue: Credits - Debits
    let netBalanceKobo = 0;
    if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
      netBalanceKobo = acc.totalDebits - acc.totalCredits;
    } else {
      netBalanceKobo = acc.totalCredits - acc.totalDebits;
    }

    balances.push({
      accountId: acc.accountId,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      debitKobo: acc.totalDebits,
      creditKobo: acc.totalCredits,
      netBalanceKobo,
    });
  }

  return {
    balances: balances.sort((a, b) => a.code.localeCompare(b.code)),
    totalDebitKobo,
    totalCreditKobo,
    isBalanced: totalDebitKobo === totalCreditKobo,
  };
}
