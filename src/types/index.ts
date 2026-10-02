export type Currency = 'NGN';

export type Language = 'en' | 'yo' | 'pcm';

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' | 'EXPIRED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REVERSED';

export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'USSD' | 'BANK_BRANCH' | 'POS_AGENT' | 'QR';

export type GatewayProvider = 'REMITA' | 'INTERSWITCH' | 'PAYSTACK' | 'FLUTTERWAVE' | 'NIBSS' | 'MOCK';

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Mda {
  id: string;
  code: string; // e.g. "MDA-EDU-01"
  name: string;
  sector: string; // Education, Health, Internal Revenue, Lands, etc.
  description: string;
  iconName: string;
  contactEmail: string;
  contactPhone: string;
  headquarters: string;
}

export interface RevenueHead {
  id: string;
  mdaId: string;
  mdaCode: string;
  mdaName: string;
  code: string; // e.g. "REV-EDU-001"
  name: string;
  category: string;
  description: string;
  defaultAmountKobo: number; // Stored in integer kobo
  isAmountVariable: boolean; // if true, payer or officer specifies amount
  minAmountKobo?: number;
  maxAmountKobo?: number;
  tsaSubAccountCode: string;
  splitRuleId: string;
  frequency: 'ONE_TIME' | 'ANNUAL' | 'MONTHLY' | 'TERMLY';
  applicableLgas?: string[]; // Optional specific LGAs
  sampleDocumentationRequired?: string[];
}

export interface SplitRule {
  id: string;
  name: string;
  description: string;
  effectiveDate: string;
  version: number;
  splits: {
    recipient: 'TSA_MAIN' | 'MDA_RETENTION' | 'LGA_SHARE' | 'GATEWAY_FEE';
    percentage: number; // e.g. 85, 10, 3, 2 (must total 100)
    targetAccountId: string;
  }[];
}

export interface Payer {
  name: string;
  email: string;
  phone: string;
  nin?: string;
  tin?: string;
  address?: string;
  lga?: string;
}

export interface StudentDetails {
  studentName: string;
  schoolName: string;
  studentClass: string; // JSS 1 to SSS 3
  section: string; // Up to 10 sections: Section A to Section J
  term: string; // 1st Term, 2nd Term, 3rd Term
  academicSession: string; // e.g. "2025/2026"
  admissionNumber?: string;
  parentName?: string;
}

export interface Invoice {
  id: string;
  prn: string; // Payment Reference Number
  mdaId: string;
  mdaName: string;
  revenueHeadId: string;
  revenueHeadName: string;
  revenueHeadCode: string;
  description: string;
  amountKobo: number; // Base fee
  gatewayFeeKobo: number; // Fee charged (borne by payer or gov)
  totalAmountKobo: number; // Total to pay
  payer: Payer;
  status: InvoiceStatus;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  virtualAccountNumber?: string;
  virtualAccountBank?: string;
  ussdCode?: string;
  channelUsed?: PaymentMethod;
  notes?: string;
  studentDetails?: StudentDetails;
}

export interface PaymentAttempt {
  id: string;
  invoiceId: string;
  prn: string;
  amountKobo: number;
  gateway: GatewayProvider;
  gatewayRef: string;
  channel: PaymentMethod;
  status: PaymentStatus;
  idempotencyKey: string;
  initiatedAt: string;
  completedAt?: string;
  rawWebhookPayload?: any;
  failureReason?: string;
}

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description: string;
  balanceKobo: number; // Maintained balance
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  direction: 'DEBIT' | 'CREDIT';
  amountKobo: number;
  description: string;
}

export interface LedgerTransaction {
  id: string;
  reference: string; // e.g. PRN or Settlement ID
  type: 'PAYMENT_CREDIT' | 'SETTLEMENT_SWEEP' | 'REVERSAL' | 'FEE_EXPENSE';
  narrative: string;
  timestamp: string;
  entries: LedgerEntry[];
  totalDebitKobo: number;
  totalCreditKobo: number;
  balanced: boolean; // invariant: totalDebitKobo === totalCreditKobo
  isReversal?: boolean;
  reversedTransactionId?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string; // e.g. "REC-OSN-2026-10492"
  invoiceId: string;
  prn: string;
  paymentAttemptId: string;
  mdaName: string;
  revenueHeadName: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  payerTinNin?: string;
  amountKobo: number;
  gatewayFeeKobo: number;
  totalPaidKobo: number;
  paymentMethod: PaymentMethod;
  gateway: GatewayProvider;
  transactionRef: string;
  paidAt: string;
  verificationHash: string; // HMAC-SHA256 signature
  qrCodeUrl: string;
  studentDetails?: StudentDetails;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string; // Officer email, system worker, or public user
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  previousHash: string;
  hash: string; // SHA-256 tamper-evident hash
}

export interface DisputeTicket {
  id: string;
  prn: string;
  payerName: string;
  payerPhone: string;
  payerEmail: string;
  amountKobo: number;
  paymentDate: string;
  channel: PaymentMethod;
  bankReference: string;
  description: string;
  status: 'PENDING_INVESTIGATION' | 'AUTO_RESOLVED' | 'REFUNDED' | 'REJECTED';
  officerRemarks?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'FEE_SCHEDULE_CHANGE' | 'REFUND_REQUEST' | 'SPLIT_RULE_UPDATE';
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  data: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface ReconciliationRecord {
  id: string;
  date: string;
  gateway: GatewayProvider;
  totalTransactionsCount: number;
  matchedCount: number;
  unmatchedCount: number;
  totalAmountKobo: number;
  matchedAmountKobo: number;
  discrepancyKobo: number;
  status: 'BALANCED' | 'DISCREPANCY_FLAGGED' | 'IN_PROGRESS';
}

export interface PaymentReminder {
  id: string;
  payerName: string;
  email?: string;
  phone?: string;
  channel: 'SMS' | 'EMAIL' | 'BOTH';
  revenueHeadId: string;
  revenueHeadName: string;
  revenueHeadCode: string;
  mdaName: string;
  estimatedAmountKobo: number;
  frequency: 'ANNUAL' | 'MONTHLY' | 'TERMLY';
  nextDueDate: string;
  leadDays: number; // e.g. 7, 14, or 30 days before
  customReference?: string; // e.g. "Plate OS-492-B2" or "Plot 14 Ring Road"
  createdAt: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  lastNotifiedAt?: string;
}

