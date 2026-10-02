import React, { useState } from 'react';
import { Invoice, PaymentMethod, GatewayProvider, Receipt, Language } from '../types';
import {
  X,
  CreditCard,
  Building,
  Smartphone,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { formatKoboToNaira } from '../services/prnService';
import { StorageService } from '../services/storageService';
import { getGatewayAdapter } from '../services/gatewayService';
import { t } from '../services/i18n';

interface PaymentModalProps {
  invoice: Invoice;
  language: Language;
  onClose: () => void;
  onPaymentSuccess: (receipt: Receipt) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  language,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [selectedGateway, setSelectedGateway] = useState<GatewayProvider>('MOCK');
  const [copiedPrn, setCopiedPrn] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // International Currency Estimator (USD, GBP, EUR)
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'GBP' | 'EUR' | 'NGN'>('USD');

  // Market Exchange Rates (Indicative interbank / NAFEM rates)
  const exchangeRates = {
    USD: { rate: 1485.50, label: 'US Dollar', symbol: '$' },
    GBP: { rate: 1942.20, label: 'British Pound', symbol: '£' },
    EUR: { rate: 1618.80, label: 'Euro', symbol: '€' },
  };

  const totalNaira = invoice.totalAmountKobo / 100;

  const calculateConversion = (curr: 'USD' | 'GBP' | 'EUR') => {
    const rateInfo = exchangeRates[curr];
    const foreignVal = totalNaira / rateInfo.rate;
    return {
      formatted: `${rateInfo.symbol}${foreignVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      rateFormatted: `1 ${curr} = ₦${rateInfo.rate.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
    };
  };

  // Card Simulation fields
  const [cardNumber, setCardNumber] = useState('5399 8201 9283 4810');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('842');

  const handleCopyPrn = () => {
    navigator.clipboard.writeText(invoice.prn);
    setCopiedPrn(true);
    setTimeout(() => setCopiedPrn(false), 2000);
  };

  const handleCopyAccount = () => {
    if (invoice.virtualAccountNumber) {
      navigator.clipboard.writeText(invoice.virtualAccountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleExecutePayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const idempotencyKey = `idemp-${Date.now()}-${invoice.prn}-${Math.random().toString(36).substring(2, 7)}`;
      const adapter = getGatewayAdapter(selectedGateway);
      const gatewayResponse = await adapter.initiate(invoice, selectedMethod, idempotencyKey);

      if (!gatewayResponse.success) {
        throw new Error(gatewayResponse.message || 'Gateway rejected transaction initiation.');
      }

      const { receipt } = await StorageService.recordPayment({
        invoiceId: invoice.id,
        gatewayRef: gatewayResponse.gatewayRef,
        gatewayProvider: selectedGateway,
        channel: selectedMethod,
        idempotencyKey,
      });

      onPaymentSuccess(receipt);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment execution failed. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Osun TSA Payment Checkout
            </h3>
            <p className="text-xs text-slate-500">
              PRN: <span className="font-mono font-semibold text-emerald-800">{invoice.prn}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Banner */}
        <div className="px-6 py-3.5 bg-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900">
          <div>
            <div className="text-xs text-emerald-300 font-semibold">{invoice.revenueHeadName}</div>
            <div className="text-xs text-emerald-100/80">Payer: {invoice.payer.name}</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold">Total Settlement Amount (TSA)</div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-white">
              {formatKoboToNaira(invoice.totalAmountKobo)}
            </div>
          </div>
        </div>

        {/* Currency Converter Utility for International Residents & Diaspora */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 text-xs text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-slate-200">
                International Currency Converter:
              </span>
              <span className="hidden md:inline text-[11px] text-slate-400">
                (For Diaspora & Foreign Partners)
              </span>
            </div>

            {/* Currency selector buttons */}
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700/80 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedCurrency('USD')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  selectedCurrency === 'USD'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCurrency('GBP')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  selectedCurrency === 'GBP'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                GBP (£)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCurrency('EUR')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  selectedCurrency === 'EUR'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EUR (€)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCurrency('NGN')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  selectedCurrency === 'NGN'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                NGN (₦)
              </button>
            </div>
          </div>

          {selectedCurrency !== 'NGN' ? (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-800/50 p-2.5 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-medium">Estimated FX Amount:</span>
                <span className="font-mono text-base font-extrabold text-emerald-400 tabular-nums">
                  ≈ {calculateConversion(selectedCurrency).formatted} {selectedCurrency}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Indicative Rate: {calculateConversion(selectedCurrency).rateFormatted}</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Standard Statutory Central Settlement in Nigerian Naira (NGN).</span>
              <span className="font-mono font-bold text-white">{formatKoboToNaira(invoice.totalAmountKobo)}</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t('paymentMethods', language)}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('BANK_TRANSFER')}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1.5 ${
                  selectedMethod === 'BANK_TRANSFER'
                    ? 'border-emerald-700 bg-emerald-50/70 text-emerald-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Building className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-semibold">Bank Transfer</span>
                <span className="text-[10px] text-slate-500">Virtual Account</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('CARD')}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1.5 ${
                  selectedMethod === 'CARD'
                    ? 'border-emerald-700 bg-emerald-50/70 text-emerald-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-semibold">ATM Card</span>
                <span className="text-[10px] text-slate-500">Mastercard/Visa</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('USSD')}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1.5 ${
                  selectedMethod === 'USSD'
                    ? 'border-emerald-700 bg-emerald-50/70 text-emerald-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-semibold">USSD Code</span>
                <span className="text-[10px] text-slate-500">Any Mobile Phone</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('BANK_BRANCH')}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-1.5 ${
                  selectedMethod === 'BANK_BRANCH'
                    ? 'border-emerald-700 bg-emerald-50/70 text-emerald-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-semibold">Bank Branch</span>
                <span className="text-[10px] text-slate-500">Pay with PRN</span>
              </button>
            </div>
          </div>

          {/* Active Channel Details */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            {selectedMethod === 'BANK_TRANSFER' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Dedicated Dynamic Virtual Account</span>
                  <span className="text-[11px] text-emerald-700 font-medium">Valid for 30 minutes</span>
                </div>
                <div className="bg-white p-3.5 rounded-md border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Account Number</div>
                    <div className="text-xl font-bold font-mono text-slate-900 tracking-wider">
                      {invoice.virtualAccountNumber || '9928374610'}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {invoice.virtualAccountBank || 'Wema Bank PLC / Osun State TSA'}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyAccount}
                    className="p-2 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-slate-100 flex items-center gap-1 text-xs"
                  >
                    {copiedAccount ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Transfer the exact sum of <strong>{formatKoboToNaira(invoice.totalAmountKobo)}</strong> from your bank app or internet banking. Settlement reflects immediately in Osun TSA.
                </p>
              </div>
            )}

            {selectedMethod === 'CARD' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-700">Card Payment Simulator (Sandbox 3DS)</div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-slate-500">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        maxLength={3}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono bg-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PCI-DSS Compliant: Card data never touches government servers.</span>
                </div>

                {selectedCurrency !== 'NGN' && (
                  <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-md text-[11px] text-blue-900 flex items-start gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Foreign Cards Accepted:</strong> International Visa and Mastercard credit/debit cards are billed in home currency ({selectedCurrency}) by your card issuer at the prevailing interbank conversion rate.
                    </span>
                  </div>
                )}
              </div>
            )}

            {selectedMethod === 'USSD' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-700">USSD Direct Payment Code</div>
                <div className="bg-white p-3 rounded-md border border-slate-200 text-center">
                  <div className="text-lg font-bold font-mono text-emerald-800 tracking-wider">
                    {invoice.ussdCode || `*737*000*${invoice.prn.slice(-6)}#`}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Dial this code from any phone (GTBank, Zenith, Access, UBA, etc.) to approve payment via USSD PIN.
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === 'BANK_BRANCH' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-700">Pay Across Counter at any Commercial Bank</div>
                <div className="bg-white p-3 rounded-md border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Reference Number:</span>
                    <span className="font-mono font-bold text-slate-900">{invoice.prn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Biller Name:</span>
                    <span className="font-semibold text-slate-900">Osun State Government TSA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Permitted Banks:</span>
                    <span className="text-slate-700">Zenith, First Bank, Wema, UBA, Access, GTB</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Walk into any branch in Nigeria and ask the teller to process on <strong>Osun TSA / Remita e-Collection</strong> using this PRN.
                </p>
              </div>
            )}
          </div>

          {/* Gateway Selector */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Payment Switching Gateway:</span>
            <select
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value as GatewayProvider)}
              className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded px-2 py-1"
            >
              <option value="MOCK">Mock Sandbox (Instant Test Settle)</option>
              <option value="REMITA">Remita TSA e-Collection (RRR)</option>
              <option value="PAYSTACK">Paystack Switch</option>
              <option value="NIBSS">NIBSS NIP Virtual Settlement</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleCopyPrn}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              {copiedPrn ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrn ? 'PRN Copied' : 'Copy PRN for Later'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-md shadow-xs transition-colors"
              >
                <span>
                  {isProcessing
                    ? 'Verifying & Settling...'
                    : `Confirm & Authorize Settlement (${formatKoboToNaira(invoice.totalAmountKobo)}${
                        selectedCurrency !== 'NGN' ? ` · ≈ ${calculateConversion(selectedCurrency).formatted}` : ''
                      })`}
                </span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
