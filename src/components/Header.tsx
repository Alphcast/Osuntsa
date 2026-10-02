import React from 'react';
import { ShieldCheck, Globe, Building2, Landmark, Search, BarChart3, HelpCircle, Smartphone } from 'lucide-react';
import { Language } from '../types';
import { t } from '../services/i18n';

interface HeaderProps {
  currentView: 'portal' | 'verify' | 'track' | 'history' | 'transparency' | 'dispute' | 'agent' | 'admin' | 'reminders';
  onNavigate: (view: 'portal' | 'verify' | 'track' | 'history' | 'transparency' | 'dispute' | 'agent' | 'admin' | 'reminders') => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  language,
  onLanguageChange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single Wordmark / Brand element */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('portal')}
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-600/50 p-0.5 bg-white shadow-xs shrink-0 group-hover:border-amber-600 transition-colors">
                <img
                  src="/src/assets/images/osun_omoluabi_crest_1790962999488.jpg"
                  alt="Osun State Government Emblem"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors">
                  OSUN-TSA
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 leading-none">
                  Treasury Single Account
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-6 text links, single-line with hover highlights */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('portal')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                currentView === 'portal' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800 pb-0.5' : ''
              }`}
            >
              {t('payNow', language)}
            </button>
            <button
              onClick={() => onNavigate('verify')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                currentView === 'verify' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800 pb-0.5' : ''
              }`}
            >
              {t('verifyReceipt', language)}
            </button>
            <button
              onClick={() => onNavigate('track')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                currentView === 'track' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800 pb-0.5' : ''
              }`}
            >
              {t('trackPayment', language)}
            </button>
            <button
              onClick={() => onNavigate('transparency')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                currentView === 'transparency' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800 pb-0.5' : ''
              }`}
            >
              {t('transparencyDashboard', language)}
            </button>
            <button
              onClick={() => onNavigate('dispute')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                currentView === 'dispute' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800 pb-0.5' : ''
              }`}
            >
              {t('disputeHelpdesk', language)}
            </button>
            <button
              onClick={() => onNavigate('reminders')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                currentView === 'reminders' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800 pb-0.5' : ''
              }`}
            >
              Get Reminders
            </button>
            <button
              onClick={() => onNavigate('agent')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap ${
                currentView === 'agent' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800 pb-0.5' : ''
              }`}
            >
              {t('agentPosPortal', language)}
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions (Language select & Back-office button) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Language dropdown */}
            <div className="relative flex items-center">
              <label htmlFor="language-select" className="sr-only">Language</label>
              <Globe className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                id="language-select"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
                <option value="en">English (EN)</option>
                <option value="yo">Yorùbá (YO)</option>
                <option value="pcm">Pidgin (PCM)</option>
              </select>
            </div>

            {/* Back-office access */}
            <button
              onClick={() => onNavigate(currentView === 'admin' ? 'portal' : 'admin')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentView === 'admin'
                  ? 'bg-slate-900 text-white'
                  : 'bg-emerald-800 text-white hover:bg-emerald-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>{currentView === 'admin' ? 'Exit Back-Office' : t('treasuryBackOffice', language)}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center overflow-x-auto gap-3 py-2 border-t border-slate-100 text-xs font-medium text-slate-600 scrollbar-none">
          <button
            onClick={() => onNavigate('portal')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${currentView === 'portal' ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''}`}
          >
            {t('payNow', language)}
          </button>
          <button
            onClick={() => onNavigate('verify')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${currentView === 'verify' ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''}`}
          >
            {t('verifyReceipt', language)}
          </button>
          <button
            onClick={() => onNavigate('track')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${currentView === 'track' ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''}`}
          >
            {t('trackPayment', language)}
          </button>
          <button
            onClick={() => onNavigate('transparency')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${currentView === 'transparency' ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''}`}
          >
            {t('transparencyDashboard', language)}
          </button>
          <button
            onClick={() => onNavigate('dispute')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${currentView === 'dispute' ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''}`}
          >
            {t('disputeHelpdesk', language)}
          </button>
          <button
            onClick={() => onNavigate('reminders')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${currentView === 'reminders' ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''}`}
          >
            Get Reminders
          </button>
          <button
            onClick={() => onNavigate('agent')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${currentView === 'agent' ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''}`}
          >
            {t('agentPosPortal', language)}
          </button>
        </div>
      </div>
    </header>
  );
};
