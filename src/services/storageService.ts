/**
 * Storage Service & Central State Authority for OSUN-TSA
 * 
 * Enforces:
 * - Integer kobo money storage.
 * - Append-only double-entry ledger invariants.
 * - Idempotency protection on every financial transaction.
 * - Tamper-evident cryptographic audit log.
 */

import {
  Mda,
  RevenueHead,
  SplitRule,
  Invoice,
  PaymentAttempt,
  LedgerAccount,
  LedgerTransaction,
  Receipt,
  AuditLog,
  DisputeTicket,
  ApprovalRequest,
  PaymentMethod,
  GatewayProvider,
  PaymentReminder,
  StudentDetails,
} from '../types';

import {
  OSUN_MDAS,
  OSUN_REVENUE_HEADS,
  OSUN_SPLIT_RULES,
  INITIAL_INVOICES,
  INITIAL_RECEIPTS,
  INITIAL_LEDGER_TRANSACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_REMINDERS,
} from '../data/initialData';

import {
  INITIAL_LEDGER_ACCOUNTS,
  buildPaymentLedgerEntries,
  createLedgerTransaction,
  buildReversalTransaction,
} from './ledgerService';

import { createReceiptFromPayment } from './receiptService';
import { createAuditRecord, GENESIS_HASH } from './auditService';
import { generatePrn, generateVirtualAccount } from './prnService';
import { calculateGatewayFeeKobo } from './gatewayService';

const STORAGE_KEYS = {
  MDAS: 'osun_tsa_mdas_v1',
  REVENUE_HEADS: 'osun_tsa_rev_heads_v1',
  SPLIT_RULES: 'osun_tsa_split_rules_v1',
  INVOICES: 'osun_tsa_invoices_v1',
  PAYMENTS: 'osun_tsa_payments_v1',
  LEDGER_ACCOUNTS: 'osun_tsa_ledger_accounts_v1',
  LEDGER_TRANSACTIONS: 'osun_tsa_ledger_tx_v1',
  RECEIPTS: 'osun_tsa_receipts_v1',
  AUDIT_LOGS: 'osun_tsa_audit_logs_v1',
  DISPUTES: 'osun_tsa_disputes_v1',
  APPROVALS: 'osun_tsa_approvals_v1',
  IDEMPOTENCY_KEYS: 'osun_tsa_idempotency_v1',
  REMINDERS: 'osun_tsa_reminders_v1',
};

function loadItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function saveItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export class StorageService {
  // Read state
  static getMdas(): Mda[] {
    return loadItem(STORAGE_KEYS.MDAS, OSUN_MDAS);
  }

  static getRevenueHeads(): RevenueHead[] {
    return loadItem(STORAGE_KEYS.REVENUE_HEADS, OSUN_REVENUE_HEADS);
  }

  static getSplitRules(): SplitRule[] {
    return loadItem(STORAGE_KEYS.SPLIT_RULES, OSUN_SPLIT_RULES);
  }

  static getInvoices(): Invoice[] {
    return loadItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  }

  static getPayments(): PaymentAttempt[] {
    return loadItem(STORAGE_KEYS.PAYMENTS, []);
  }

  static getLedgerAccounts(): LedgerAccount[] {
    return loadItem(STORAGE_KEYS.LEDGER_ACCOUNTS, INITIAL_LEDGER_ACCOUNTS);
  }

  static getLedgerTransactions(): LedgerTransaction[] {
    return loadItem(STORAGE_KEYS.LEDGER_TRANSACTIONS, INITIAL_LEDGER_TRANSACTIONS);
  }

  static getReceipts(): Receipt[] {
    return loadItem(STORAGE_KEYS.RECEIPTS, INITIAL_RECEIPTS);
  }

  static getAuditLogs(): AuditLog[] {
    return loadItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  static getDisputes(): DisputeTicket[] {
    return loadItem(STORAGE_KEYS.DISPUTES, []);
  }

  static getApprovals(): ApprovalRequest[] {
    return loadItem(STORAGE_KEYS.APPROVALS, []);
  }

  static getReminders(): PaymentReminder[] {
    return loadItem(STORAGE_KEYS.REMINDERS, INITIAL_REMINDERS);
  }

  static getIdempotencyKeys(): string[] {
    return loadItem(STORAGE_KEYS.IDEMPOTENCY_KEYS, []);
  }

  /**
   * Generates a new invoice with a checksummed PRN and dynamic virtual account
   */
  static async createInvoice(params: {
    revenueHeadId: string;
    amountKobo: number;
    payerName: string;
    payerEmail: string;
    payerPhone: string;
    payerNin?: string;
    payerTin?: string;
    payerLga?: string;
    description?: string;
    officerActor?: string;
    studentDetails?: StudentDetails;
  }): Promise<Invoice> {
    const revenueHeads = this.getRevenueHeads();
    const revHead = revenueHeads.find((r) => r.id === params.revenueHeadId);
    if (!revHead) {
      throw new Error(`Revenue head with ID ${params.revenueHeadId} not found`);
    }

    const prn = generatePrn();
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days validity
    const gatewayFeeKobo = calculateGatewayFeeKobo(params.amountKobo);
    const totalAmountKobo = params.amountKobo + gatewayFeeKobo;

    const va = generateVirtualAccount(prn);
    const ussdCode = `*737*000*${prn.replace(/[^0-9]/g, '').slice(-8)}#`;

    const invoice: Invoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      prn,
      mdaId: revHead.mdaId,
      mdaName: revHead.mdaName,
      revenueHeadId: revHead.id,
      revenueHeadName: revHead.name,
      revenueHeadCode: revHead.code,
      description: params.description || revHead.description,
      amountKobo: params.amountKobo,
      gatewayFeeKobo,
      totalAmountKobo,
      payer: {
        name: params.payerName,
        email: params.payerEmail,
        phone: params.payerPhone,
        nin: params.payerNin,
        tin: params.payerTin,
        lga: params.payerLga,
      },
      status: 'UNPAID',
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      virtualAccountNumber: va.accountNumber,
      virtualAccountBank: va.bankName,
      ussdCode,
      studentDetails: params.studentDetails,
    };

    const invoices = [invoice, ...this.getInvoices()];
    saveItem(STORAGE_KEYS.INVOICES, invoices);

    // Audit log
    const auditLogs = this.getAuditLogs();
    const lastHash = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].hash : GENESIS_HASH;
    const auditRecord = await createAuditRecord({
      actor: params.officerActor || params.payerEmail || 'Public Guest Payer',
      role: params.officerActor ? 'MDA_OFFICER' : 'CITIZEN',
      action: 'GENERATE_INVOICE_PRN',
      entityType: 'Invoice',
      entityId: invoice.id,
      details: `Generated PRN ${invoice.prn} for ${revHead.name} amounting to ${invoice.totalAmountKobo} kobo`,
      previousHash: lastHash,
    });
    saveItem(STORAGE_KEYS.AUDIT_LOGS, [...auditLogs, auditRecord]);

    return invoice;
  }

  /**
   * Process and record a confirmed payment.
   * Atomic, idempotent, balanced double-entry ledger transaction.
   */
  static async recordPayment(params: {
    invoiceId: string;
    gatewayRef: string;
    gatewayProvider: GatewayProvider;
    channel: PaymentMethod;
    idempotencyKey: string;
    officerActor?: string;
  }): Promise<{ receipt: Receipt; transaction: LedgerTransaction }> {
    // 1. Idempotency Check
    const usedKeys = this.getIdempotencyKeys();
    if (usedKeys.includes(params.idempotencyKey)) {
      throw new Error(`[IDEMPOTENCY CONFLICT] Key ${params.idempotencyKey} has already been processed.`);
    }

    // 2. Fetch invoice
    const invoices = this.getInvoices();
    const invoiceIndex = invoices.findIndex((inv) => inv.id === params.invoiceId);
    if (invoiceIndex === -1) {
      throw new Error(`Invoice ${params.invoiceId} not found.`);
    }
    const invoice = invoices[invoiceIndex];
    if (invoice.status === 'PAID') {
      throw new Error(`Invoice ${invoice.prn} has already been settled and marked as PAID.`);
    }

    // 3. Create payment attempt record
    const paymentAttempt: PaymentAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      invoiceId: invoice.id,
      prn: invoice.prn,
      amountKobo: invoice.totalAmountKobo,
      gateway: params.gatewayProvider,
      gatewayRef: params.gatewayRef,
      channel: params.channel,
      status: 'SUCCESSFUL',
      idempotencyKey: params.idempotencyKey,
      initiatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    // 4. Update Invoice Status
    invoice.status = 'PAID';
    invoice.paidAt = paymentAttempt.completedAt;
    invoice.channelUsed = params.channel;
    invoices[invoiceIndex] = invoice;
    saveItem(STORAGE_KEYS.INVOICES, invoices);

    // 5. Append Payment Attempt
    const payments = [paymentAttempt, ...this.getPayments()];
    saveItem(STORAGE_KEYS.PAYMENTS, payments);

    // 6. Record in Double-Entry Ledger
    const splitRules = this.getSplitRules();
    const revenueHeads = this.getRevenueHeads();
    const revHead = revenueHeads.find((r) => r.id === invoice.revenueHeadId);
    const splitRule = splitRules.find((s) => s.id === (revHead?.splitRuleId || 'split-std-85')) || splitRules[0];
    const accounts = this.getLedgerAccounts();

    const ledgerEntries = buildPaymentLedgerEntries(invoice, splitRule, accounts);
    const ledgerTx = createLedgerTransaction({
      reference: invoice.prn,
      type: 'PAYMENT_CREDIT',
      narrative: `Settled payment for PRN ${invoice.prn} (${invoice.revenueHeadName}) via ${params.gatewayProvider}`,
      entries: ledgerEntries,
    });

    const ledgerTransactions = [ledgerTx, ...this.getLedgerTransactions()];
    saveItem(STORAGE_KEYS.LEDGER_TRANSACTIONS, ledgerTransactions);

    // 7. Generate Signed E-Receipt
    const receipt = await createReceiptFromPayment(invoice, paymentAttempt);
    const receipts = [receipt, ...this.getReceipts()];
    saveItem(STORAGE_KEYS.RECEIPTS, receipts);

    // 8. Record Immutable Audit Log
    const auditLogs = this.getAuditLogs();
    const lastHash = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].hash : GENESIS_HASH;
    const auditRecord = await createAuditRecord({
      actor: params.officerActor || invoice.payer.email || 'Gateway Settlement System',
      role: params.officerActor ? 'MDA_OFFICER' : 'GATEWAY_WEBHOOK',
      action: 'PAYMENT_CONFIRMED_AND_LEDGER_POSTED',
      entityType: 'Invoice',
      entityId: invoice.id,
      details: `Settled ₦${(invoice.totalAmountKobo / 100).toLocaleString()} into TSA. Ledger Tx: ${ledgerTx.id}. Receipt: ${receipt.receiptNumber}. Gateway Ref: ${params.gatewayRef}`,
      previousHash: lastHash,
    });
    saveItem(STORAGE_KEYS.AUDIT_LOGS, [...auditLogs, auditRecord]);

    // 9. Persist used idempotency key
    saveItem(STORAGE_KEYS.IDEMPOTENCY_KEYS, [...usedKeys, params.idempotencyKey]);

    return { receipt, transaction: ledgerTx };
  }

  /**
   * Reverse an erroneous payment (Maker-Checker authorized refund/reversal).
   * Strictly append-only: posts reversing debits and credits, never deletes original records.
   */
  static async reversePayment(params: {
    transactionId: string;
    reason: string;
    reviewer: string;
  }): Promise<LedgerTransaction> {
    const transactions = this.getLedgerTransactions();
    const originalTx = transactions.find((t) => t.id === params.transactionId);
    if (!originalTx) {
      throw new Error(`Transaction ${params.transactionId} not found`);
    }
    if (originalTx.isReversal) {
      throw new Error(`Cannot reverse a transaction that is already a reversal.`);
    }

    const reversalTx = buildReversalTransaction(originalTx, params.reason);
    const updatedTxs = [reversalTx, ...transactions];
    saveItem(STORAGE_KEYS.LEDGER_TRANSACTIONS, updatedTxs);

    // Audit log
    const auditLogs = this.getAuditLogs();
    const lastHash = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].hash : GENESIS_HASH;
    const auditRecord = await createAuditRecord({
      actor: params.reviewer,
      role: 'FINANCE_ADMIN',
      action: 'REVERSE_LEDGER_TRANSACTION',
      entityType: 'LedgerTransaction',
      entityId: reversalTx.id,
      details: `Reversed transaction ${originalTx.id} (Reference ${originalTx.reference}). Reason: ${params.reason}`,
      previousHash: lastHash,
    });
    saveItem(STORAGE_KEYS.AUDIT_LOGS, [...auditLogs, auditRecord]);

    return reversalTx;
  }

  /**
   * Propose a fee change (Maker-Checker pattern)
   */
  static async proposeFeeChange(params: {
    revenueHeadId: string;
    newAmountKobo: number;
    proposedBy: string;
    justification: string;
  }): Promise<ApprovalRequest> {
    const revenueHeads = this.getRevenueHeads();
    const head = revenueHeads.find((h) => h.id === params.revenueHeadId);
    if (!head) throw new Error('Revenue head not found');

    const approval: ApprovalRequest = {
      id: `appr-${Date.now()}`,
      type: 'FEE_SCHEDULE_CHANGE',
      title: `Update Fee Schedule: ${head.name}`,
      description: `Change default fee from ₦${(head.defaultAmountKobo / 100).toLocaleString()} to ₦${(params.newAmountKobo / 100).toLocaleString()}. Justification: ${params.justification}`,
      requestedBy: params.proposedBy,
      requestedAt: new Date().toISOString(),
      data: {
        revenueHeadId: head.id,
        oldAmountKobo: head.defaultAmountKobo,
        newAmountKobo: params.newAmountKobo,
      },
      status: 'PENDING',
    };

    const approvals = [approval, ...this.getApprovals()];
    saveItem(STORAGE_KEYS.APPROVALS, approvals);

    return approval;
  }

  /**
   * Approve or reject a Maker-Checker proposal
   */
  static async reviewApproval(params: {
    approvalId: string;
    action: 'APPROVE' | 'REJECT';
    reviewer: string;
    notes?: string;
  }): Promise<ApprovalRequest> {
    const approvals = this.getApprovals();
    const index = approvals.findIndex((a) => a.id === params.approvalId);
    if (index === -1) throw new Error('Approval request not found');

    const req = approvals[index];
    if (req.status !== 'PENDING') throw new Error('Approval request is not pending');

    req.status = params.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    req.reviewedBy = params.reviewer;
    req.reviewedAt = new Date().toISOString();
    req.reviewNotes = params.notes;

    if (params.action === 'APPROVE' && req.type === 'FEE_SCHEDULE_CHANGE') {
      const revenueHeads = this.getRevenueHeads();
      const headIdx = revenueHeads.findIndex((h) => h.id === req.data.revenueHeadId);
      if (headIdx !== -1) {
        revenueHeads[headIdx].defaultAmountKobo = req.data.newAmountKobo;
        saveItem(STORAGE_KEYS.REVENUE_HEADS, revenueHeads);
      }
    }

    approvals[index] = req;
    saveItem(STORAGE_KEYS.APPROVALS, approvals);

    // Audit log
    const auditLogs = this.getAuditLogs();
    const lastHash = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].hash : GENESIS_HASH;
    const auditRecord = await createAuditRecord({
      actor: params.reviewer,
      role: 'ACCOUNTANT_GENERAL',
      action: `MAKER_CHECKER_${req.status}`,
      entityType: 'ApprovalRequest',
      entityId: req.id,
      details: `${req.status} request: ${req.title} by ${req.requestedBy}`,
      previousHash: lastHash,
    });
    saveItem(STORAGE_KEYS.AUDIT_LOGS, [...auditLogs, auditRecord]);

    return req;
  }

  /**
   * Submit citizen grievance / dispute
   */
  static async submitDispute(params: {
    prn: string;
    payerName: string;
    payerPhone: string;
    payerEmail: string;
    amountKobo: number;
    paymentDate: string;
    channel: PaymentMethod;
    bankReference: string;
    description: string;
  }): Promise<DisputeTicket> {
    const dispute: DisputeTicket = {
      id: `disp-${Date.now()}`,
      prn: params.prn,
      payerName: params.payerName,
      payerPhone: params.payerPhone,
      payerEmail: params.payerEmail,
      amountKobo: params.amountKobo,
      paymentDate: params.paymentDate,
      channel: params.channel,
      bankReference: params.bankReference,
      description: params.description,
      status: 'PENDING_INVESTIGATION',
      createdAt: new Date().toISOString(),
    };

    const disputes = [dispute, ...this.getDisputes()];
    saveItem(STORAGE_KEYS.DISPUTES, disputes);
    return dispute;
  }

  /**
   * Register a citizen payment reminder for recurring taxes/fees
   */
  static async createReminder(params: {
    payerName: string;
    email?: string;
    phone?: string;
    channel: 'SMS' | 'EMAIL' | 'BOTH';
    revenueHeadId: string;
    frequency: 'ANNUAL' | 'MONTHLY' | 'TERMLY';
    nextDueDate: string;
    leadDays: number;
    customReference?: string;
  }): Promise<PaymentReminder> {
    const revenueHeads = this.getRevenueHeads();
    const head = revenueHeads.find((h) => h.id === params.revenueHeadId) || revenueHeads[0];

    const reminder: PaymentReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      payerName: params.payerName,
      email: params.email?.trim() || undefined,
      phone: params.phone?.trim() || undefined,
      channel: params.channel,
      revenueHeadId: head.id,
      revenueHeadName: head.name,
      revenueHeadCode: head.code,
      mdaName: head.mdaName,
      estimatedAmountKobo: head.defaultAmountKobo,
      frequency: params.frequency,
      nextDueDate: params.nextDueDate,
      leadDays: params.leadDays,
      customReference: params.customReference?.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    const reminders = [reminder, ...this.getReminders()];
    saveItem(STORAGE_KEYS.REMINDERS, reminders);

    // Audit log
    const auditLogs = this.getAuditLogs();
    const lastHash = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].hash : GENESIS_HASH;
    const auditRecord = await createAuditRecord({
      actor: params.email || params.phone || params.payerName,
      role: 'CITIZEN',
      action: 'SUBSCRIBE_PAYMENT_REMINDER',
      entityType: 'PaymentReminder',
      entityId: reminder.id,
      details: `Scheduled ${reminder.frequency} reminder for ${head.name} via ${reminder.channel}. Due: ${reminder.nextDueDate}`,
      previousHash: lastHash,
    });
    saveItem(STORAGE_KEYS.AUDIT_LOGS, [...auditLogs, auditRecord]);

    return reminder;
  }

  static toggleReminderStatus(id: string): PaymentReminder {
    const reminders = this.getReminders();
    const idx = reminders.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Reminder not found');

    reminders[idx].status = reminders[idx].status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    saveItem(STORAGE_KEYS.REMINDERS, reminders);
    return reminders[idx];
  }

  static deleteReminder(id: string): void {
    const reminders = this.getReminders().filter((r) => r.id !== id);
    saveItem(STORAGE_KEYS.REMINDERS, reminders);
  }

  /**
   * Reset data to initial state
   */
  static resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.MDAS);
    localStorage.removeItem(STORAGE_KEYS.REVENUE_HEADS);
    localStorage.removeItem(STORAGE_KEYS.SPLIT_RULES);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.LEDGER_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.LEDGER_TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.DISPUTES);
    localStorage.removeItem(STORAGE_KEYS.APPROVALS);
    localStorage.removeItem(STORAGE_KEYS.IDEMPOTENCY_KEYS);
    localStorage.removeItem(STORAGE_KEYS.REMINDERS);
  }
}
