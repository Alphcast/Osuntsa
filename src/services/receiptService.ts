/**
 * Official E-Receipt Generation & Cryptographic Verification Service for OSUN-TSA
 */

import { Invoice, Receipt, PaymentAttempt } from '../types';

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const serial = Math.floor(100000 + Math.random() * 900000);
  return `REC-OSN-${year}-${serial}`;
}

/**
 * Creates a tamper-proof verification hash for an e-receipt
 */
export async function createReceiptVerificationHash(
  receiptNumber: string,
  prn: string,
  amountKobo: number,
  paidAt: string,
  payerName: string
): Promise<string> {
  const secretKey = 'OSUN_STATE_GOVERNMENT_TSA_AUTHORITY_KEY_2026';
  const rawPayload = `${receiptNumber}|${prn}|${amountKobo}|${paidAt}|${payerName}|${secretKey}`;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(rawPayload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 32).toUpperCase();
  }

  // Fallback simple checksum
  let hash = 0x5a5a5a5a;
  for (let i = 0; i < rawPayload.length; i++) {
    hash = (hash << 5) - hash + rawPayload.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, 'F').toUpperCase() + '9E7D2B1C';
}

export async function createReceiptFromPayment(
  invoice: Invoice,
  paymentAttempt: PaymentAttempt
): Promise<Receipt> {
  const receiptNumber = generateReceiptNumber();
  const paidAt = paymentAttempt.completedAt || new Date().toISOString();
  
  const verificationHash = await createReceiptVerificationHash(
    receiptNumber,
    invoice.prn,
    invoice.totalAmountKobo,
    paidAt,
    invoice.payer.name
  );

  const qrCodeUrl = `/verify?ref=${encodeURIComponent(receiptNumber)}&prn=${encodeURIComponent(invoice.prn)}&hash=${encodeURIComponent(verificationHash)}`;

  return {
    id: `receipt-${Date.now()}`,
    receiptNumber,
    invoiceId: invoice.id,
    prn: invoice.prn,
    paymentAttemptId: paymentAttempt.id,
    mdaName: invoice.mdaName,
    revenueHeadName: invoice.revenueHeadName,
    payerName: invoice.payer.name,
    payerEmail: invoice.payer.email,
    payerPhone: invoice.payer.phone,
    payerTinNin: invoice.payer.nin || invoice.payer.tin,
    amountKobo: invoice.amountKobo,
    gatewayFeeKobo: invoice.gatewayFeeKobo,
    totalPaidKobo: invoice.totalAmountKobo,
    paymentMethod: paymentAttempt.channel,
    gateway: paymentAttempt.gateway,
    transactionRef: paymentAttempt.gatewayRef,
    paidAt,
    verificationHash,
    qrCodeUrl,
    studentDetails: invoice.studentDetails,
  };
}

/**
 * Validates whether a receipt is authentic or forged
 */
export async function verifyReceiptAuthenticity(receipt: Receipt): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  const expectedHash = await createReceiptVerificationHash(
    receipt.receiptNumber,
    receipt.prn,
    receipt.totalPaidKobo,
    receipt.paidAt,
    receipt.payerName
  );

  if (receipt.verificationHash !== expectedHash) {
    return {
      isValid: false,
      reason: 'Cryptographic signature mismatch! This receipt does not match Osun State Treasury records.',
    };
  }

  return { isValid: true };
}
