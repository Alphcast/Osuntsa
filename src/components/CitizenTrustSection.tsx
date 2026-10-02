import React, { useState } from 'react';
import {
  CreditCard,
  Building,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Landmark,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const CitizenTrustSection: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I pay if I do not have an ATM card?',
      answer:
        'You do not need a debit card. You can choose "Instant Bank Transfer" to receive a dedicated 10-digit virtual bank account number (Wema Bank PLC / Osun TSA), or use the USSD phone code (*737*...), or take your PRN to any commercial bank branch in Nigeria.',
    },
    {
      question: 'How do I know my money reached the Osun State Government?',
      answer:
        'All collections on this portal settle directly into the Osun State Consolidated Revenue Fund (CRF) under the Treasury Single Account (TSA) framework at the Central Bank and partnering commercial banks. No intermediary or individual holds collection accounts. You will immediately receive an official electronic receipt with a digital HMAC signature.',
    },
    {
      question: 'Can this electronic receipt be used for university clearance or police checks?',
      answer:
        'Yes. The receipt is an official legal revenue document bearing the Osun State Government seal and a QR code. Verification officers (police, road traffic officers, courts, university registry) can scan the QR code or enter the receipt number on this website to confirm authenticity instantly.',
    },
    {
      question: 'What should I do if my bank debited me but my PRN still says UNPAID?',
      answer:
        'Simply visit the "Citizen Dispute Desk" on this portal, input your PRN and your bank transaction reference or session ID. Our automated switch requery engine will verify the payment with the inter-bank switch and automatically credit your invoice.',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* 3 Steps: How to Pay */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            How to Pay Any Osun State Fee or Tax Online
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            No bank queues, no manual paper teller delays. Completed in under 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-sm mb-4">
              01
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Select Revenue Head & Details
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Choose the fee or tax (UNIOSUN school fees, Certificate of Occupancy, vehicle plate number, or direct tax) and enter your name, phone number, and optional TIN/NIN.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-sm mb-4">
              02
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Choose Payment Method
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Pay via your bank app (dynamic virtual account), ATM card (Mastercard/Visa/Verve), mobile phone USSD code, or walk into any bank branch with your PRN.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-sm mb-4">
              03
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Get Official E-Receipt
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Instantly receive and download your official Osun State Government electronic receipt with a tamper-evident digital signature and verification QR code.
            </p>
          </div>
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="bg-emerald-950 text-white rounded-2xl p-8 sm:p-10 border border-emerald-900 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-900 text-emerald-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Guaranteed Security & Transparency</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            Every Naira Remitted Directly to Osun State TSA
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Eliminates cash leakages and unauthorized agent charges. By paying on OSUN-TSA, your funds directly support public schools, roads, healthcare clinics, and community infrastructure across all 30 LGAs in Osun State.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 shrink-0 text-xs">
          <div className="p-3 bg-emerald-900/60 rounded-lg border border-emerald-800">
            <div className="font-bold text-white text-base font-mono">100%</div>
            <div className="text-emerald-300 text-[11px] mt-0.5">TSA Compliant</div>
          </div>
          <div className="p-3 bg-emerald-900/60 rounded-lg border border-emerald-800">
            <div className="font-bold text-white text-base font-mono">Real-Time</div>
            <div className="text-emerald-300 text-[11px] mt-0.5">Switch Settlement</div>
          </div>
          <div className="p-3 bg-emerald-900/60 rounded-lg border border-emerald-800">
            <div className="font-bold text-white text-base font-mono">30 LGAs</div>
            <div className="text-emerald-300 text-[11px] mt-0.5">Coverage</div>
          </div>
          <div className="p-3 bg-emerald-900/60 rounded-lg border border-emerald-800">
            <div className="font-bold text-white text-base font-mono">0 Kobo</div>
            <div className="text-emerald-300 text-[11px] mt-0.5">Discrepancy</div>
          </div>
        </div>
      </div>

      {/* Citizen FAQs */}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            Frequently Asked Questions by Taxpayers & Citizens
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Common questions regarding government revenue collection in Osun State.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.question}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
