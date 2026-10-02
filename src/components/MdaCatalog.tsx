import React, { useState } from 'react';
import {
  Mda,
  RevenueHead,
  Language,
} from '../types';
import {
  GraduationCap,
  Receipt,
  Building,
  HeartPulse,
  Car,
  Briefcase,
  Tractor,
  Scale,
  Compass,
  Droplets,
  Pickaxe,
  MapPin,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  FileText,
  CreditCard,
} from 'lucide-react';
import { formatKoboToNaira } from '../services/prnService';
import { t } from '../services/i18n';

interface MdaCatalogProps {
  mdas: Mda[];
  revenueHeads: RevenueHead[];
  selectedSector: string;
  searchQuery: string;
  language: Language;
  onSelectRevenueHead: (head: RevenueHead) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-5 h-5" />,
  Receipt: <Receipt className="w-5 h-5" />,
  Building: <Building className="w-5 h-5" />,
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  Tractor: <Tractor className="w-5 h-5" />,
  Scale: <Scale className="w-5 h-5" />,
  Compass: <Compass className="w-5 h-5" />,
  Droplets: <Droplets className="w-5 h-5" />,
  Pickaxe: <Pickaxe className="w-5 h-5" />,
  MapPin: <MapPin className="w-5 h-5" />,
};

export const MdaCatalog: React.FC<MdaCatalogProps> = ({
  mdas,
  revenueHeads,
  selectedSector,
  searchQuery,
  language,
  onSelectRevenueHead,
}) => {
  const [expandedMdaIds, setExpandedMdaIds] = useState<Record<string, boolean>>({
    'mda-edu': true,
    'mda-irs': true,
    'mda-lands': true,
    'mda-hlth': true,
  });

  const toggleMda = (mdaId: string) => {
    setExpandedMdaIds((prev) => ({
      ...prev,
      [mdaId]: !prev[mdaId],
    }));
  };

  // Filter MDAs and revenue heads based on search & sector
  const filteredMdas = mdas.filter((mda) => {
    const matchesSector = selectedSector === 'ALL' || mda.sector === selectedSector;
    if (!matchesSector) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesMda =
      mda.name.toLowerCase().includes(query) ||
      mda.code.toLowerCase().includes(query) ||
      mda.sector.toLowerCase().includes(query);

    const hasMatchingHead = revenueHeads.some(
      (h) =>
        h.mdaId === mda.id &&
        (h.name.toLowerCase().includes(query) ||
          h.code.toLowerCase().includes(query) ||
          h.category.toLowerCase().includes(query) ||
          h.description.toLowerCase().includes(query))
    );

    return matchesMda || hasMatchingHead;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Osun State Revenue Directory
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Select any official revenue head to generate an assessed invoice, pay online, or obtain an instant PRN.
          </p>
        </div>
        <div className="mt-2 sm:mt-0 text-xs text-slate-400 font-mono tabular-nums">
          Showing {filteredMdas.length} MDAs · {revenueHeads.length} Revenue Heads
        </div>
      </div>

      {filteredMdas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200 mt-6">
          <p className="text-sm text-slate-600 font-medium">No revenue heads or MDAs found matching &ldquo;{searchQuery}&rdquo;</p>
          <p className="text-xs text-slate-400 mt-1">Try searching for keywords like &ldquo;UNIOSUN&rdquo;, &ldquo;Tax&rdquo;, &ldquo;Plate&rdquo;, or &ldquo;Land&rdquo;</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredMdas.map((mda) => {
            const heads = revenueHeads.filter((h) => {
              if (h.mdaId !== mda.id) return false;
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                h.name.toLowerCase().includes(q) ||
                h.code.toLowerCase().includes(q) ||
                h.category.toLowerCase().includes(q) ||
                h.description.toLowerCase().includes(q) ||
                mda.name.toLowerCase().includes(q)
              );
            });

            const isExpanded = expandedMdaIds[mda.id] || searchQuery.trim().length > 0;

            return (
              <div
                key={mda.id}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* MDA Header Accordion Bar */}
                <button
                  onClick={() => toggleMda(mda.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                      {ICON_MAP[mda.iconName] || <Building className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-semibold text-slate-900">
                          {mda.name}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {mda.code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span>{mda.sector}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{heads.length} statutory fee types</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="hidden sm:inline text-xs font-medium text-slate-500">
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Expanded Revenue Heads Table / List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {heads.map((head) => (
                      <div
                        key={head.id}
                        className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {head.name}
                            </span>
                            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {head.code}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                            {head.description}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                            <span>Category: {head.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-400">Sub-Account: {head.tsaSubAccountCode}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{head.frequency.toLowerCase().replace('_', ' ')}</span>
                          </div>
                        </div>

                        {/* Amount & Direct Pay Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                          <div className="text-left sm:text-right">
                            <div className="text-base sm:text-lg font-bold text-slate-900 font-mono tabular-nums">
                              {head.isAmountVariable ? (
                                <span>Variable Assessment</span>
                              ) : (
                                formatKoboToNaira(head.defaultAmountKobo)
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {head.isAmountVariable ? 'Input assessed sum' : 'Statutory fixed rate'}
                            </div>
                          </div>

                          <button
                            onClick={() => onSelectRevenueHead(head)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md transition-colors shadow-2xs whitespace-nowrap"
                          >
                            <span>Pay / Generate PRN</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
