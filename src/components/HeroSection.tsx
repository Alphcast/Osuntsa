import React from 'react';
import { Search, ShieldCheck, CheckCircle2, ArrowRight, Landmark } from 'lucide-react';
import { Language } from '../types';
import { t } from '../services/i18n';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSector: string;
  onSectorSelect: (sector: string) => void;
  sectors: string[];
  language: Language;
  onQuickPayClick: () => void;
  onVerifyClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  selectedSector,
  onSectorSelect,
  sectors,
  language,
  onQuickPayClick,
  onVerifyClick,
}) => {
  return (
    <div className="relative bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900 text-white overflow-hidden border-b border-emerald-800/40">
      {/* Subtle background image overlay with high contrast scrim */}
      <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
        <img
          src="/src/assets/images/osun_secretariat_building_1790954386913.jpg"
          alt="Osun State Secretariat"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="max-w-2xl text-center md:text-left">
            {/* Government Authority Bar */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-md bg-emerald-800/60 border border-emerald-600/40 text-emerald-200 text-xs font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Osun State Government of Nigeria</span>
              <span aria-hidden="true">·</span>
              <span>Ministry of Finance & TSA Directorate</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-tight">
              {t('portalTitle', language)}
            </h1>

            <p className="mt-3 text-base sm:text-lg text-emerald-100/90 max-w-xl text-balance font-normal">
              {t('portalSubtitle', language)}
            </p>

            {/* Trust and Compliance Badges (Clean text with typographic bullet) */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-emerald-200/80">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero Collection Leakage
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Tamper-Proof HMAC E-Receipts
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                All 30 LGAs Integrated
              </span>
            </div>
          </div>

          {/* Official Seal / Coat of Arms visual */}
          <div className="shrink-0 hidden md:flex flex-col items-center">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/10 p-2 border border-emerald-500/30 backdrop-blur-sm shadow-xl">
              <img
                src="/src/assets/images/osun_omoluabi_crest_1790962999488.jpg"
                alt="Osun State Government Official Crest"
                className="w-full h-full object-contain rounded-full bg-white p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="mt-2 text-xs font-semibold text-emerald-200 tracking-wider uppercase">
              State of the Living Spring
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mt-8 max-w-3xl">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('searchMdaOrFee', language)}
              className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 placeholder:text-slate-400 rounded-lg text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Interactive Sector Filter Bar (Clean segmented button bar per design constitution) */}
        <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onSectorSelect('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedSector === 'ALL'
                ? 'bg-emerald-400 text-emerald-950 font-semibold shadow-xs'
                : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/80 border border-emerald-700/50'
            }`}
          >
            All Sectors
          </button>
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => onSectorSelect(sector)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedSector === sector
                  ? 'bg-emerald-400 text-emerald-950 font-semibold shadow-xs'
                  : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/80 border border-emerald-700/50'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
