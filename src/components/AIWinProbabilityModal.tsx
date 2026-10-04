import React from 'react';
import { BusinessProfile, ClientRecord, ServiceQuote } from '../types';
import { calculateQuote, formatCurrency } from '../utils/calculations';
import { calculateWinProbability, WinProbabilityResult } from '../utils/winProbability';
import {
  Sparkles,
  X,
  TrendingUp,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  BarChart3,
  Calendar,
  DollarSign,
  UserCheck,
  Send,
  MessageSquare,
} from 'lucide-react';

interface AIWinProbabilityModalProps {
  quote: ServiceQuote;
  allQuotes: ServiceQuote[];
  clientRecord?: ClientRecord | null;
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenFollowUpRadar?: (quote: ServiceQuote) => void;
  onSelectQuote?: (quote: ServiceQuote) => void;
}

export const AIWinProbabilityModal: React.FC<AIWinProbabilityModalProps> = ({
  quote,
  allQuotes,
  clientRecord,
  business,
  isOpen,
  onClose,
  onOpenFollowUpRadar,
  onSelectQuote,
}) => {
  if (!isOpen) return null;

  const calc = calculateQuote(quote, business.defaultTaxRate);
  const winData: WinProbabilityResult = calculateWinProbability(
    quote,
    allQuotes,
    clientRecord,
    business.defaultTaxRate
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden transition-all">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">
                  AI Win Probability Intelligence
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-400/20 text-cyan-200 border border-cyan-400/30">
                  {winData.confidence} Confidence
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                {quote.quoteNumber} · {quote.projectTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Top Score Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-4">
              {/* Radial Score Gauge Display */}
              <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-white shadow-xs border-4 border-slate-100 shrink-0">
                <div
                  className={`w-16 h-16 rounded-full flex flex-col items-center justify-center text-center ${winData.badgeBg}`}
                >
                  <span className={`text-xl font-black font-mono tracking-tight ${winData.badgeText}`}>
                    {winData.score}%
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 -mt-0.5">
                    Win Likelihood
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${winData.badgeBg} ${winData.badgeText} ${winData.badgeBorder}`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    {winData.rating}
                  </span>
                  <span className="text-xs text-slate-500">
                    Deal Size: <strong className="text-slate-800 font-mono">{formatCurrency(calc.total, business.currencySymbol)}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {winData.customerInteraction.engagementSummary}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            {onOpenFollowUpRadar && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFollowUpRadar(quote);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs cursor-pointer transition-colors whitespace-nowrap"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI Follow-Up Closer</span>
              </button>
            )}
          </div>

          {/* Two Core AI Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pillar 1: Historical Acceptance Rates for Similar Job Sizes */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Historical Job Size Acceptance
                  </h4>
                </div>
                <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {winData.jobSizeCohort.historicalAcceptanceRate}% Baseline
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Job Size Cohort:</span>
                  <strong className="text-slate-900 font-medium">{winData.jobSizeCohort.label}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Price Range Bracket:</span>
                  <span className="font-mono text-slate-700">{winData.jobSizeCohort.priceRange}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Historical Sample:</span>
                  <span className="text-slate-700">
                    {winData.jobSizeCohort.isIndustryBenchmark
                      ? 'Industry Trade Benchmark'
                      : `${winData.jobSizeCohort.acceptedHistoricalQuotes} of ${winData.jobSizeCohort.totalHistoricalQuotes} closed quotes`}
                  </span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="pt-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Cohort Win Rate</span>
                    <span className="font-mono font-bold text-slate-700">{winData.jobSizeCohort.historicalAcceptanceRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${winData.jobSizeCohort.historicalAcceptanceRate}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                    {winData.jobSizeCohort.sampleDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 2: Customer Interactions & Engagement */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Customer Interactions
                  </h4>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                    winData.customerInteraction.interactionLevel === 'high_engagement'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : winData.customerInteraction.interactionLevel === 'unopened'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {winData.customerInteraction.interactionLevel.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    Portal View Status:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {winData.customerInteraction.hasViewed
                      ? winData.customerInteraction.viewLatencyHours !== undefined
                        ? `Viewed (${winData.customerInteraction.viewLatencyHours}h after sent)`
                        : 'Opened & Viewed'
                      : 'Not yet opened'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Delivery Timeline:
                  </span>
                  <span className="font-medium text-slate-700">
                    {winData.customerInteraction.daysSinceSent === 0
                      ? 'Sent today'
                      : `${winData.customerInteraction.daysSinceSent} days ago`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    Customer Relationship:
                  </span>
                  <span className="font-medium text-slate-700">
                    {winData.customerInteraction.isRepeatCustomer
                      ? `Repeat Client (${winData.customerInteraction.priorCompletedJobs} previous jobs)`
                      : 'New Customer Relationship'}
                  </span>
                </div>
                {clientRecord?.tag && (
                  <div className="flex justify-between text-slate-600">
                    <span>Client Tag:</span>
                    <span className="font-semibold text-blue-800 uppercase text-[10px] px-1.5 py-0.5 bg-blue-50 rounded">
                      {clientRecord.tag.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contributing AI Scoring Factors */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              Scoring Factors & Calculation Breakdown
            </h4>

            <div className="divide-y divide-slate-100 text-xs">
              {winData.factors.map((factor, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">{factor.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono capitalize">
                        ({factor.category.replace('_', ' ')})
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {factor.description}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs shrink-0 px-2 py-0.5 rounded ${
                      factor.impact === 'positive'
                        ? 'text-emerald-700 bg-emerald-50'
                        : factor.impact === 'negative'
                        ? 'text-rose-700 bg-rose-50'
                        : 'text-slate-600 bg-slate-100'
                    }`}
                  >
                    {factor.scoreDelta > 0 ? `+${factor.scoreDelta}%` : `${factor.scoreDelta}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommended Strategy */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-2">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>AI Next Best Action to Maximize Win Rate</span>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed">
              {winData.recommendedAction}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-slate-500 text-[11px]">
            Win Probability adapts in real time as customer views and interactions occur.
          </div>
          <div className="flex items-center gap-2">
            {onSelectQuote && (
              <button
                onClick={() => {
                  onClose();
                  onSelectQuote(quote);
                }}
                className="px-3 py-1.5 font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
              >
                View Client Proposal
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
