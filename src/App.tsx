import React, { useState } from 'react';
import {
  Header,
} from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MdaCatalog } from './components/MdaCatalog';
import { CitizenQuickPay } from './components/CitizenQuickPay';
import { CitizenTrustSection } from './components/CitizenTrustSection';
import { InvoiceGenerationModal } from './components/InvoiceGenerationModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ReceiptVerificationView } from './components/ReceiptVerificationView';
import { PrnLookupView } from './components/PrnLookupView';
import { TransparencyDashboard } from './components/TransparencyDashboard';
import { DisputeDeskView } from './components/DisputeDeskView';
import { AgentTerminalView } from './components/AgentTerminalView';
import { AdminDashboard } from './components/AdminDashboard';
import { PaymentReminderView } from './components/PaymentReminderView';
import { UserPaymentHistoryView } from './components/UserPaymentHistoryView';

import { StorageService } from './services/storageService';
import { formatKoboToNaira } from './services/prnService';
import { useToast } from './context/ToastContext';
import { Language, RevenueHead, Invoice, Receipt } from './types';
import { ShieldCheck, Landmark, CheckCircle2 } from 'lucide-react';

export default function App() {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<
    'portal' | 'verify' | 'track' | 'history' | 'transparency' | 'dispute' | 'agent' | 'admin' | 'reminders'
  >('portal');
  const [language, setLanguage] = useState<Language>('en');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');

  // Modal workflows
  const [selectedRevenueHead, setSelectedRevenueHead] = useState<RevenueHead | null>(null);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<Invoice | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);

  // Data
  const mdas = StorageService.getMdas();
  const revenueHeads = StorageService.getRevenueHeads();

  // Extract distinct sectors
  const distinctSectors = Array.from(new Set(mdas.map((m) => m.sector)));

  const handleInvoiceCreated = (invoice: Invoice) => {
    setSelectedRevenueHead(null);
    setActiveInvoiceForPayment(invoice);
  };

  const handlePaymentSuccess = (receipt: Receipt) => {
    // 1. Immediately dismiss checkout modal
    setActiveInvoiceForPayment(null);

    // 2. Trigger instant immediate feedback toast
    toast.success(
      `Payment Successful · ${formatKoboToNaira(receipt.totalPaidKobo)}`,
      `Remittance confirmed into Osun TSA for ${receipt.payerName} (PRN: ${receipt.prn}). Generating official electronic receipt...`,
      5000
    );

    // 3. Smooth transition to official receipt modal
    setTimeout(() => {
      setActiveReceipt(receipt);
    }, 850);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-800 selection:text-white">
      {/* 3-Zone Header Contract */}
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        language={language}
        onLanguageChange={(lang) => setLanguage(lang)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'portal' && (
          <div>
            <HeroSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSector={selectedSector}
              onSectorSelect={setSelectedSector}
              sectors={distinctSectors}
              language={language}
              onQuickPayClick={() => {
                if (revenueHeads.length > 0) setSelectedRevenueHead(revenueHeads[0]);
              }}
              onVerifyClick={() => setCurrentView('verify')}
            />

            {/* Instant Citizen Quick Pay & Tax Estimator */}
            <CitizenQuickPay
              revenueHeads={revenueHeads}
              language={language}
              onSelectRevenueHead={(head) => setSelectedRevenueHead(head)}
              onPayExistingInvoice={(inv) => setActiveInvoiceForPayment(inv)}
              onNavigateToReminders={() => setCurrentView('reminders')}
            />

            <MdaCatalog
              mdas={mdas}
              revenueHeads={revenueHeads}
              selectedSector={selectedSector}
              searchQuery={searchQuery}
              language={language}
              onSelectRevenueHead={(head) => setSelectedRevenueHead(head)}
            />

            {/* How It Works, Guarantee & Citizen FAQs */}
            <CitizenTrustSection />
          </div>
        )}

        {currentView === 'verify' && <ReceiptVerificationView />}

        {(currentView === 'track' || currentView === 'history') && (
          <UserPaymentHistoryView
            onPayInvoice={(invoice) => setActiveInvoiceForPayment(invoice)}
            onViewReceipt={(receipt) => setActiveReceipt(receipt)}
            onNavigateToPortal={() => setCurrentView('portal')}
            onNavigateToReminders={() => setCurrentView('reminders')}
          />
        )}

        {currentView === 'transparency' && <TransparencyDashboard />}

        {currentView === 'dispute' && <DisputeDeskView />}

        {currentView === 'agent' && <AgentTerminalView />}

        {currentView === 'reminders' && (
          <PaymentReminderView
            revenueHeads={revenueHeads}
            onPayNow={(headId) => {
              const head = revenueHeads.find((h) => h.id === headId);
              if (head) setSelectedRevenueHead(head);
            }}
          />
        )}

        {currentView === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 py-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 p-1 flex items-center justify-center">
                <img
                  src="/src/assets/images/osun_omoluabi_crest_1790962999488.jpg"
                  alt="State Crest"
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">
                  GOVERNMENT OF OSUN STATE OF NIGERIA
                </span>
                <span className="text-slate-400 text-xs">
                  Office of the Accountant-General · Treasury Single Account (TSA)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <button onClick={() => setCurrentView('portal')} className="hover:text-white transition-colors">
                Public Revenue Portal
              </button>
              <span>·</span>
              <button onClick={() => setCurrentView('verify')} className="hover:text-white transition-colors">
                Receipt Verification
              </button>
              <span>·</span>
              <button onClick={() => setCurrentView('transparency')} className="hover:text-white transition-colors">
                Open Data Transparency
              </button>
              <span>·</span>
              <button onClick={() => setCurrentView('reminders')} className="hover:text-white transition-colors">
                Payment Reminders
              </button>
              <span>·</span>
              <button onClick={() => setCurrentView('admin')} className="hover:text-white transition-colors">
                Treasury Back-Office
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              &copy; {new Date().getFullYear()} Osun State Government. All financial transactions are double-entry balanced and settled in integer kobo.
            </div>
            <div className="flex items-center gap-3">
              <span>CBN TSA Compliant</span>
              <span>·</span>
              <span>NDPA 2023 Data Protected</span>
              <span>·</span>
              <span>State Secretariat, Abere, Osogbo</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Assessment / PRN Generation Modal */}
      {selectedRevenueHead && (
        <InvoiceGenerationModal
          revenueHead={selectedRevenueHead}
          language={language}
          onClose={() => setSelectedRevenueHead(null)}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}

      {/* MODAL 2: Multi-Channel Payment Checkout Modal */}
      {activeInvoiceForPayment && (
        <PaymentModal
          invoice={activeInvoiceForPayment}
          language={language}
          onClose={() => setActiveInvoiceForPayment(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* MODAL 3: Official Electronic Revenue Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
          onNavigateToVerify={() => {
            setActiveReceipt(null);
            setCurrentView('verify');
          }}
        />
      )}
    </div>
  );
}
