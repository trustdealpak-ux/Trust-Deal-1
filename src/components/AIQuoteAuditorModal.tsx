import React, { useState, useEffect } from 'react';
import { BusinessProfile, LineItem, UnitType } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  Sparkles,
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  Lightbulb,
  Zap,
  Info,
} from 'lucide-react';

interface AIQuoteAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessProfile;
  projectTitle: string;
  projectScopeSummary: string;
  items: LineItem[];
  isTiered: boolean;
  total: number;
  onAddMissingItem: (item: LineItem) => void;
}

interface AuditResult {
  winProbabilityScore: number;
  profitHealth: 'excellent' | 'healthy' | 'at_risk' | 'low_margin';
  overallAssessment: string;
  missingItems: Array<{
    title: string;
    category: 'labor' | 'materials' | 'permits_equipment' | 'service_fee';
    description: string;
    estimatedPrice: number;
    estimatedCost: number;
    reason: string;
  }>;
  liabilityRisks: string[];
  upsellOpportunities: Array<{
    title: string;
    revenueImpact: string;
    description: string;
  }>;
  actionableTips: string[];
}

export const AIQuoteAuditorModal: React.FC<AIQuoteAuditorModalProps> = ({
  isOpen,
  onClose,
  business,
  projectTitle,
  projectScopeSummary,
  items,
  isTiered,
  total,
  onAddMissingItem,
}) => {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addedItemTitles, setAddedItemTitles] = useState<Set<string>>(new Set());

  const runAudit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/audit-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle,
          projectScopeSummary,
          trade: business.trade,
          items,
          isTiered,
          total,
        }),
      });
      const data = await res.json();
      if (data.audit) {
        setAudit(data.audit);
      }
    } catch (err) {
      console.error('Failed to run quote audit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-900 text-white">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                AI Quote Intelligence & Risk Auditor
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Live Analysis
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Auditing scope completeness, liability clauses, and predictive win-rate for{' '}
              <span className="font-semibold text-slate-700">{business.name}</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-800">
                Auditing line items against building codes & contractor closing psychology...
              </p>
              <p className="text-[11px] text-slate-400">
                Checking for omitted permits, safety valves, and liability coverage.
              </p>
            </div>
          ) : audit ? (
            <div className="space-y-5">
              {/* Scorecard Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Win Probability
                    </p>
                    <p className="text-3xl font-extrabold tracking-tight mt-0.5 tabular-nums text-emerald-400">
                      {audit.winProbabilityScore}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-400/60" />
                </div>

                <div className="bg-blue-50 border border-blue-200/80 p-4 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">
                    Profit Margin Health
                  </p>
                  <p className="text-xl font-bold text-blue-950 uppercase mt-1">
                    {audit.profitHealth}
                  </p>
                  <p className="text-[11px] text-blue-800/80 mt-0.5">
                    Total quoted: {formatCurrency(total)}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">
                    Missing Scope Items
                  </p>
                  <p className="text-xl font-bold text-amber-950 mt-1">
                    {audit.missingItems.length} Identified
                  </p>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">
                    Protect against scope creep
                  </p>
                </div>
              </div>

              {/* Assessment Text */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900 font-semibold">Executive Assessment: </strong>
                {audit.overallAssessment}
              </div>

              {/* Missing Trade Necessities (Actionable Add to Quote) */}
              {audit.missingItems && audit.missingItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Recommended Scope Additions (Missing Items)</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">1-Click Auto Insert</span>
                  </div>

                  <div className="space-y-2.5">
                    {audit.missingItems.map((item, idx) => {
                      const isAdded = addedItemTitles.has(item.title);

                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {item.title}
                              </span>
                              <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded-md bg-amber-100 text-amber-900">
                                {item.category}
                              </span>
                              <span className="text-xs font-semibold text-emerald-800 tabular-nums">
                                +{formatCurrency(item.estimatedPrice)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700">{item.description}</p>
                            <p className="text-[11px] text-amber-900 font-medium">
                              <strong>Why required:</strong> {item.reason}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              onAddMissingItem({
                                id: `missing_${Date.now()}_${idx}`,
                                category: item.category as any,
                                description: `${item.title}: ${item.description}`,
                                quantity: 1,
                                unit: item.category === 'labor' ? 'hours' : 'flat rate' as UnitType,
                                unitPrice: item.estimatedPrice,
                                unitCost: item.estimatedCost,
                                taxable: item.category === 'materials',
                                isOptional: false,
                                selected: true,
                              });
                              setAddedItemTitles(new Set([...addedItemTitles, item.title]));
                            }}
                            disabled={isAdded}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${
                              isAdded
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Added to Quote</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Quote (+{formatCurrency(item.estimatedPrice)})</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Liability & Legal Protection Alerts */}
              {audit.liabilityRisks && audit.liabilityRisks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-900" />
                    <span>Contractor Liability Safeguards</span>
                  </h4>
                  <div className="space-y-1.5">
                    {audit.liabilityRisks.map((risk, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 flex items-start gap-2"
                      >
                        <Info className="w-3.5 h-3.5 text-blue-800 shrink-0 mt-0.5" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* High-Margin Upsells */}
              {audit.upsellOpportunities && audit.upsellOpportunities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>High-Converting Upsell Opportunities</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {audit.upsellOpportunities.map((op, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{op.title}</span>
                          <span className="text-[11px] font-bold text-emerald-700">
                            {op.revenueImpact}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {op.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            AI updates win probability as scope changes
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
