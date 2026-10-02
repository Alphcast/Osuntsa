import React, { useState } from 'react';
import { Smartphone, Printer, CheckCircle2, ShieldCheck, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { formatKoboToNaira } from '../services/prnService';
import { OSUN_LGAS } from '../data/initialData';

export const AgentTerminalView: React.FC = () => {
  const [selectedLga, setSelectedLga] = useState('Osogbo');
  const [officerId, setOfficerId] = useState('OSTSA-FLD-049');
  const [payerName, setPayerName] = useState('');
  const [plateOrPhone, setPlateOrPhone] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<{
    name: string;
    amountKobo: number;
    revHeadId: string;
  }>({
    name: 'Daily Market Stall Levy',
    amountKobo: 20000, // ₦200
    revHeadId: 'rev-business-premises',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPrintedTicket, setLastPrintedTicket] = useState<{
    prn: string;
    receiptNo: string;
    time: string;
    amountKobo: number;
    feeName: string;
    lga: string;
  } | null>(null);

  const presets = [
    { name: 'Daily Market Stall Levy', amountKobo: 20000, revHeadId: 'rev-business-premises' },
    { name: 'Commercial Motorcycle / Okada Daily Levy', amountKobo: 30000, revHeadId: 'rev-driver-licence' },
    { name: 'Abattoir Veterinary Meat Pass', amountKobo: 150000, revHeadId: 'rev-abattoir-fee' },
    { name: 'Produce Haulage Timber / Cocoa Checkpoint', amountKobo: 500000, revHeadId: 'rev-abattoir-fee' },
  ];

  const handleIssueLevy = async () => {
    setIsProcessing(true);
    try {
      const invoice = await StorageService.createInvoice({
        revenueHeadId: selectedPreset.revHeadId,
        amountKobo: selectedPreset.amountKobo,
        payerName: payerName.trim() || 'Field Payer (Cash/POS)',
        payerEmail: 'agent.collection@osun.gov.ng',
        payerPhone: plateOrPhone.trim() || '+234 800 000 0000',
        payerLga: selectedLga,
        description: `Field Terminal Levy: ${selectedPreset.name} (Officer: ${officerId})`,
        officerActor: `${officerId}@osun.gov.ng`,
      });

      const { receipt } = await StorageService.recordPayment({
        invoiceId: invoice.id,
        gatewayRef: `POS-FLD-${Date.now()}`,
        gatewayProvider: 'MOCK',
        channel: 'POS_AGENT',
        idempotencyKey: `pos-key-${Date.now()}`,
        officerActor: officerId,
      });

      setLastPrintedTicket({
        prn: invoice.prn,
        receiptNo: receipt.receiptNumber,
        time: new Date().toLocaleTimeString('en-NG'),
        amountKobo: invoice.totalAmountKobo,
        feeName: selectedPreset.name,
        lga: selectedLga,
      });

      // Clear input
      setPayerName('');
      setPlateOrPhone('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OFFLINE-CAPABLE POS AGENT MODE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Revenue Field Collector Terminal
          </h1>
          <p className="text-xs text-slate-400">
            For designated Osun State field revenue agents at markets, motor parks, and agricultural checkpoints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-slate-400 block">Agent ID:</span>
            <span className="font-mono font-bold text-white">{officerId}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Terminal Configuration & Presets */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                LGA Ward / Location
              </label>
              <select
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
                {OSUN_LGAS.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga} LGA
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Plate No / Phone Number
              </label>
              <input
                type="text"
                value={plateOrPhone}
                onChange={(e) => setPlateOrPhone(e.target.value)}
                placeholder="e.g. OS-942-A02 or 0802..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Quick Levy Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Preset Government Levy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map((preset) => {
                const isSelected = selectedPreset.name === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="text-xs font-medium">{preset.name}</span>
                    <span className="mt-2 text-sm font-bold font-mono text-emerald-900 tabular-nums">
                      {formatKoboToNaira(preset.amountKobo)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Total Settle: <strong className="font-mono text-slate-900">{formatKoboToNaira(selectedPreset.amountKobo + 15000)}</strong>
            </div>

            <button
              type="button"
              onClick={handleIssueLevy}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs rounded-md shadow-xs transition-colors"
            >
              {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span>{isProcessing ? 'Issuing Ticket...' : 'Collect & Print POS Slip'}</span>
            </button>
          </div>
        </div>

        {/* Mini Thermal Receipt Preview */}
        <div className="bg-slate-50 rounded-xl border border-slate-300 p-5 font-mono text-xs flex flex-col justify-between shadow-inner">
          <div>
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <span className="font-bold text-slate-900 block text-xs">GOVERNMENT OF OSUN STATE</span>
              <span className="text-[10px] text-slate-600 block">TREASURY SINGLE ACCOUNT (TSA)</span>
              <span className="text-[9px] text-slate-500 block">OFFICIAL FIELD COLLECTION SLIP</span>
            </div>

            {lastPrintedTicket ? (
              <div className="py-4 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ticket:</span>
                  <span className="font-bold text-slate-900">{lastPrintedTicket.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PRN:</span>
                  <span className="font-bold text-emerald-800">{lastPrintedTicket.prn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">LGA:</span>
                  <span>{lastPrintedTicket.lga}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Levy:</span>
                  <span className="text-right max-w-[140px] truncate">{lastPrintedTicket.feeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time:</span>
                  <span>{lastPrintedTicket.time}</span>
                </div>
                <div className="pt-2 border-t border-dashed border-slate-400 flex justify-between font-bold text-slate-900 text-xs">
                  <span>PAID:</span>
                  <span className="tabular-nums">{formatKoboToNaira(lastPrintedTicket.amountKobo)}</span>
                </div>
                <div className="pt-2 text-center text-[9px] text-slate-500">
                  *** REMITTED TO OSUN TSA ***
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Press &ldquo;Collect & Print POS Slip&rdquo; to simulate instant thermal receipt issuance.
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-400 border-t border-dashed border-slate-400 pt-2">
            Terminal POS v2.6 · Agent Safe Mode
          </div>
        </div>
      </div>
    </div>
  );
};
