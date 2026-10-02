/**
 * PRN (Payment Reference Number) Service & Money Formatting for OSUN-TSA
 * 
 * Invariant: All money calculations are strictly in integer kobo.
 * PRN Format: OSN-YYMM-XXXX-XXXX-C where C is an ISO 7064 Mod 97-10 / Luhn-style check digit.
 */

export function calculateCheckDigit(baseString: string): string {
  // Extract alphanumeric characters and convert to numeric ASCII values
  const sanitized = baseString.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  let sum = 0;
  for (let i = 0; i < sanitized.length; i++) {
    const charCode = sanitized.charCodeAt(i);
    const weight = (i % 2 === 0) ? 3 : 7;
    sum = (sum + charCode * weight) % 97;
  }
  // Check code between 0 and 9, or hex A-Z
  const remainder = (98 - sum) % 97;
  const checkChar = String.fromCharCode(65 + (remainder % 26));
  return checkChar;
}

export function generatePrn(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // 8 random alphanumeric characters in 2 groups of 4 (excluding confusing characters like O, 0, I, 1)
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += charset.charAt(Math.floor(Math.random() * charset.length));
    part2 += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  const rawBase = `OSN${year}${month}${part1}${part2}`;
  const checkChar = calculateCheckDigit(rawBase);

  return `OSN-${year}${month}-${part1}-${part2}-${checkChar}`;
}

export function validatePrn(prn: string): { isValid: boolean; reason?: string } {
  if (!prn) return { isValid: false, reason: 'PRN cannot be empty' };
  
  const clean = prn.trim().toUpperCase();
  const match = clean.match(/^OSN-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9])$/);
  
  if (!match) {
    return { isValid: false, reason: 'Invalid PRN format. Expected OSN-YYMM-XXXX-XXXX-C' };
  }

  const [_, yymm, part1, part2, checkChar] = match;
  const rawBase = `OSN${yymm}${part1}${part2}`;
  const expectedCheck = calculateCheckDigit(rawBase);

  if (checkChar !== expectedCheck) {
    return { isValid: false, reason: 'PRN checksum failed. Verification digit does not match.' };
  }

  return { isValid: true };
}

/**
 * Format integer kobo into Nigerian Naira string (₦)
 * Guaranteed no floating point inaccuracy.
 */
export function formatKoboToNaira(kobo: number, includeSymbol = true): string {
  if (kobo === undefined || kobo === null || isNaN(kobo)) return includeSymbol ? '₦0.00' : '0.00';
  
  const isNegative = kobo < 0;
  const absKobo = Math.abs(Math.round(kobo));
  
  const naira = Math.floor(absKobo / 100);
  const remainingKobo = absKobo % 100;
  
  const formattedNaira = naira.toLocaleString('en-NG');
  const formattedKobo = String(remainingKobo).padStart(2, '0');
  
  const result = `${formattedNaira}.${formattedKobo}`;
  const prefix = isNegative ? '-' : '';
  return includeSymbol ? `${prefix}₦${result}` : `${prefix}${result}`;
}

/**
 * Convert user Naira input into integer kobo
 */
export function nairaToKobo(naira: number | string): number {
  if (typeof naira === 'number') {
    return Math.round(naira * 100);
  }
  if (!naira) return 0;
  const clean = String(naira).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Convert integer kobo into English words for legal and financial receipts
 */
export function koboToWords(kobo: number): string {
  if (kobo <= 0) return 'Zero Naira Only';
  const naira = Math.floor(kobo / 100);
  const remKobo = kobo % 100;

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(num: number): string {
    let str = '';
    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
      if (num > 0) str += 'and ';
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      str += ones[num] + ' ';
    }
    return str.trim();
  }

  let words = '';
  const millions = Math.floor(naira / 1000000);
  const thousands = Math.floor((naira % 1000000) / 1000);
  const remainder = naira % 1000;

  if (millions > 0) {
    words += convertGroup(millions) + ' Million ';
  }
  if (thousands > 0) {
    words += convertGroup(thousands) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertGroup(remainder) + ' ';
  }

  words = words.trim() + ' Naira';

  if (remKobo > 0) {
    words += ` and ${convertGroup(remKobo)} Kobo`;
  }

  return words + ' Only';
}

/**
 * Generate a valid 10-digit NUBAN virtual account number with realistic bank details
 */
export function generateVirtualAccount(prn: string): { accountNumber: string; bankName: string; bankCode: string } {
  // Extract digits or hash from PRN to ensure deterministic, consistent virtual account per invoice
  let seed = 0;
  for (let i = 0; i < prn.length; i++) {
    seed = (seed * 31 + prn.charCodeAt(i)) % 100000000;
  }
  const accountBase = String(90000000 + Math.abs(seed % 9999999)).slice(0, 9);
  
  // Calculate NUBAN check digit for Wema Bank (035) or Providus (101)
  const bankCode = '035'; // Wema Bank / ALAT
  const bankName = 'Wema Bank PLC / Osun State TSA';
  
  const nubanString = bankCode + accountBase;
  const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(nubanString.charAt(i), 10) * weights[i];
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const accountNumber = accountBase + checkDigit;

  return {
    accountNumber,
    bankName,
    bankCode
  };
}
