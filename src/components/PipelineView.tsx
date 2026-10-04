import React, { useState } from 'react';
import { BusinessProfile, ClientRecord, QuoteStatus, ServiceQuote } from '../types';
import { calculateQuote, formatCurrency } from '../utils/calculations';
import { calculateWinProbability, WinProbabilityResult } from '../utils/winProbability';
import { AIWinProbabilityModal } from './AIWinProbabilityModal';
import {
  Search,
  Filter,
  Eye,
  Edit3,
  Share2,
  Copy,
  Trash2,
  Printer,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  DollarSign,
  TrendingUp,
  LayoutList,
  Kanban,
  Check,
  Sparkles,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface PipelineViewProps {
  quotes: ServiceQuote[];
  allQuotes?: ServiceQuote[];
  clients?: ClientRecord[];
  business: BusinessProfile;
  onSelectQuote: (quote: ServiceQuote) => void;
  onEditQuote: (quote: ServiceQuote) => void;
  onNewQuote: () => void;
  onDeleteQuote: (id: string) => void;
  onDuplicateQuote: (quote: ServiceQuote) => void;
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
  onOpenShareModal: (quote: ServiceQuote) => void;
  onOpenAIDraft?: () => void;
  onOpenFollowUpRadar?: (quote: ServiceQuote) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  quotes,
  allQuotes,
  clients,
  business,
  onSelectQuote,
  onEditQuote,
  onNewQuote,
  onDeleteQuote,
  onDuplicateQuote,
  onUpdateStatus,
  onOpenShareModal,
  onOpenAIDraft,
  onOpenFollowUpRadar,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [winFilter, setWinFilter] = useState<'all' | 'high' | 'moderate' | 'at_risk'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedWinQuote, setSelectedWinQuote] = useState<ServiceQuote | null>(null);

  // Calculate Win Probability for all quotes based on historical size cohorts and interactions
  const winScores = React.useMemo(() => {
    const map = new Map<string, WinProbabilityResult>();
    quotes.forEach((q) => {
      const clientRecord = clients?.find(
        (c) =>
          c.email?.toLowerCase() === q.client.email?.toLowerCase() ||
          c.name?.toLowerCase() === q.client.name?.toLowerCase()
      );
      map.set(
        q.id,
        calculateWinProbability(q, allQuotes || quotes, clientRecord, business.defaultTaxRate)
      );
    });
    return map;
  }, [quotes, allQuotes, clients, business.defaultTaxRate]);

  // Filter quotes by search, status, and win probability tier
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.client.name.toLowerCase().includes(search.toLowerCase()) ||
      q.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.client.serviceAddress.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;

    const winData = winScores.get(q.id);
    let matchesWin = true;
    if (winFilter === 'high') {
      matchesWin = (winData?.score ?? 0) >= 70;
    } else if (winFilter === 'moderate') {
      matchesWin = (winData?.score ?? 0) >= 45 && (winData?.score ?? 0) < 70;
    } else if (winFilter === 'at_risk') {
      matchesWin = (winData?.score ?? 0) < 45 && q.status !== 'accepted' && q.status !== 'invoiced';
    }

    return matchesSearch && matchesStatus && matchesWin;
  });

  // Calculate Pipeline KPIs including AI Win Probability
  const kpis = React.useMemo(() => {
    let totalPipelineVal = 0;
    let acceptedVal = 0;
    let acceptedCount = 0;
    let totalSentOrAcceptedCount = 0;

    quotes.forEach((q) => {
      const calc = calculateQuote(q, business.defaultTaxRate);
      totalPipelineVal += calc.total;

      if (q.status === 'accepted' || q.status === 'invoiced') {
        acceptedVal += calc.total;
        acceptedCount += 1;
      }
      if (q.status !== 'draft') {
        totalSentOrAcceptedCount += 1;
      }
    });

    const winRate =
      totalSentOrAcceptedCount > 0 ? (acceptedCount / totalSentOrAcceptedCount) * 100 : 0;
    const avgDeal = quotes.length > 0 ? totalPipelineVal / quotes.length : 0;

    // AI Predictive Metrics
    const openQuotes = quotes.filter(
      (q) => q.status !== 'accepted' && q.status !== 'invoiced' && q.status !== 'declined'
    );
    const openScores = openQuotes.map((q) => winScores.get(q.id)?.score ?? 50);
    const avgWinProb =
      openScores.length > 0
        ? Math.round(openScores.reduce((a, b) => a + b, 0) / openScores.length)
        : 72;
    const highWinCount = openScores.filter((s) => s >= 70).length;
    const atRiskCount = openScores.filter((s) => s < 45).length;

    return {
      totalPipelineVal,
      acceptedVal,
      winRate,
      avgDeal,
      totalCount: quotes.length,
      acceptedCount,
      avgWinProb,
      highWinCount,
      atRiskCount,
    };
  }, [quotes, business.defaultTaxRate, winScores]);

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Accepted
          </span>
        );
      case 'invoiced':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Invoiced
          </span>
        );
      case 'viewed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            Viewed
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Sent
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Declined
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Draft
          </span>
        );
    }
  };

  const followUpNeededQuotes = quotes.filter((q) => q.status === 'sent' || q.status === 'viewed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* SaaS Pipeline Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Total Pipeline</p>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatCurrency(kpis.totalPipelineVal, business.currencySymbol)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
            <span>{kpis.totalCount} active proposals</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Won / Closed</p>
          <p className="text-lg font-bold text-emerald-800 font-mono tabular-nums mt-0.5">
            {formatCurrency(kpis.acceptedVal, business.currencySymbol)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
            <span>{kpis.acceptedCount} deals signed</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Historical Win Rate</p>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {kpis.winRate.toFixed(0)}%
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
            <span>Sent to won conversion</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Avg Deal Size</p>
          <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {formatCurrency(kpis.avgDeal, business.currencySymbol)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
            <span>Across all trades</span>
          </div>
        </div>

        {/* AI Win Probability Forecast KPI Card */}
        <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-purple-50/70 p-3.5 rounded-lg border border-blue-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-950 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              AI Win Probability
            </p>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-100/80 text-blue-800 rounded font-semibold">
              Forecast
            </span>
          </div>
          <p className="text-lg font-black text-blue-900 font-mono tabular-nums mt-0.5">
            {kpis.avgWinProb}% <span className="text-xs font-semibold text-slate-500 font-sans">avg open</span>
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1.5">
            <span className="text-emerald-700 font-medium font-mono">{kpis.highWinCount} High Win</span>
            <span>·</span>
            <span className="text-amber-700 font-medium font-mono">{kpis.atRiskCount} At Risk</span>
          </div>
        </div>
      </div>

      {/* AI Follow-Up & Close Radar Banner */}
      {followUpNeededQuotes.length > 0 && onOpenFollowUpRadar && (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 text-white p-4 rounded-xl shadow-xs border border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 shrink-0">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  AI Follow-Up & Close Radar
                </span>
                <span className="px-2 py-0.2 text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded-full">
                  {followUpNeededQuotes.length} High-Intent Deals
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Proactive follow-up within 48h increases proposal closing by 68%. Pick any quote to launch the omni-channel closer:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {followUpNeededQuotes.slice(0, 3).map((fq) => {
              const fWin = winScores.get(fq.id);
              return (
                <button
                  key={fq.id}
                  onClick={() => onOpenFollowUpRadar(fq)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/10 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  title={`Launch follow-up sequence for ${fq.client.name}`}
                >
                  <span>{fq.client.name.split(' ')[0]} ({fq.quoteNumber})</span>
                  {fWin && (
                    <span className="text-[10px] font-mono px-1 rounded bg-purple-400/30 text-purple-200">
                      {fWin.score}% Win
                    </span>
                  )}
                  <ArrowRight className="w-3 h-3 text-purple-300" />
                </button>
              );
            })}
            {followUpNeededQuotes.length > 3 && (
              <button
                onClick={() => onOpenFollowUpRadar(followUpNeededQuotes[0])}
                className="px-2.5 py-1 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                Open Closer Radar →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Control bar: search, segmented tabs, win filters, view toggle, and CTA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by client, title, quote # or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Status Tabs Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            {[
              { id: 'all', label: 'All' },
              { id: 'draft', label: 'Drafts' },
              { id: 'sent', label: 'Sent' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'invoiced', label: 'Invoiced' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`text-xs px-2.5 py-1 rounded-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* AI Win Probability Filter Control */}
          <div className="flex items-center gap-1 bg-blue-50/70 p-1 rounded-md border border-blue-200/60">
            <span className="text-[10px] font-bold text-blue-900 px-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-700" />
              <span>Win:</span>
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'high', label: 'High (≥70%)' },
              { id: 'at_risk', label: 'At Risk (<45%)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setWinFilter(tab.id as any)}
                className={`text-xs px-2 py-0.5 rounded-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  winFilter === tab.id
                    ? 'bg-white text-blue-950 shadow-2xs font-bold'
                    : 'text-blue-800/80 hover:text-blue-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-sm cursor-pointer transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1 rounded-sm cursor-pointer transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-3.5 h-3.5" />
            </button>
          </div>

          {onOpenAIDraft && (
            <button
              onClick={onOpenAIDraft}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md shadow-2xs cursor-pointer whitespace-nowrap transition-colors"
              title="Draft quote from plain language notes with AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-800" />
              <span>AI Draft</span>
            </button>
          )}

          <button
            onClick={onNewQuote}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs cursor-pointer whitespace-nowrap transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Quote</span>
          </button>
        </div>
      </div>

      {/* Main View: List or Kanban */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Quote #</th>
                  <th className="py-3 px-4">Client & Project</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-blue-950 font-bold">
                      <Sparkles className="w-3 h-3 text-blue-700" />
                      Win Probability
                    </span>
                  </th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Required Deposit</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No quotes found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((q) => {
                    const calc = calculateQuote(q, business.defaultTaxRate);
                    const winData = winScores.get(q.id) || calculateWinProbability(q, allQuotes || quotes);

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-blue-900 whitespace-nowrap">
                          {q.quoteNumber}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => onSelectQuote(q)}
                            className="font-semibold text-slate-900 hover:text-blue-900 text-left block cursor-pointer transition-colors"
                          >
                            {q.projectTitle}
                          </button>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span>{q.client.name}</span>
                            <span>·</span>
                            <span className="truncate max-w-[200px]">{q.client.serviceAddress}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            value={q.status}
                            onChange={(e) => onUpdateStatus(q.id, e.target.value as QuoteStatus)}
                            className="text-xs font-medium bg-transparent border-0 py-0.5 pl-0 pr-6 text-slate-800 cursor-pointer focus:ring-0"
                          >
                            <option value="draft">● Draft</option>
                            <option value="sent">● Sent</option>
                            <option value="viewed">● Viewed</option>
                            <option value="accepted">● Accepted</option>
                            <option value="declined">● Declined</option>
                            <option value="invoiced">● Invoiced</option>
                          </select>
                        </td>

                        {/* AI Win Probability Column */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedWinQuote(q)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-transform hover:scale-105 cursor-pointer shadow-2xs ${winData.badgeBg} ${winData.badgeText} ${winData.badgeBorder}`}
                            title={`AI Win Probability: ${winData.score}%\nCohort: ${winData.jobSizeCohort.label} (${winData.jobSizeCohort.historicalAcceptanceRate}% baseline)\nClick to view AI deep dive analysis`}
                          >
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span className="font-mono">{winData.score}%</span>
                            <span className="text-[10px] font-medium opacity-85">· {winData.rating}</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatCurrency(calc.total, business.currencySymbol)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                          {formatCurrency(calc.depositRequired, business.currencySymbol)}
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({q.depositRequiredPercent}%)
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(q.validUntil).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {onOpenFollowUpRadar && (
                              <button
                                onClick={() => onOpenFollowUpRadar(q)}
                                className="p-1.5 text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded cursor-pointer transition-colors"
                                title="AI Follow-Up & Close Radar"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onSelectQuote(q)}
                              className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                              title="Preview Client Proposal"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenShareModal(q)}
                              className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                              title="Share & Send to Client"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditQuote(q)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                              title="Edit Quote"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDuplicateQuote(q)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                              title="Duplicate Quote"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteQuote(q.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                              title="Delete Quote"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {[
            { id: 'draft', title: 'Drafts', dotColor: 'bg-slate-400' },
            { id: 'sent', title: 'Sent / Reviewing', dotColor: 'bg-amber-500' },
            { id: 'accepted', title: 'Accepted / Signed', dotColor: 'bg-emerald-500' },
            { id: 'invoiced', title: 'Invoiced & Completed', dotColor: 'bg-blue-600' },
          ].map((col) => {
            const colQuotes = filteredQuotes.filter((q) => {
              if (col.id === 'sent') return q.status === 'sent' || q.status === 'viewed';
              return q.status === col.id;
            });

            const colTotal = colQuotes.reduce(
              (sum, q) => sum + calculateQuote(q, business.defaultTaxRate).total,
              0
            );

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 rounded-lg p-3 border border-slate-200 space-y-3 min-h-[400px]"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className="text-xs font-bold text-slate-900">{col.title}</span>
                    <span className="text-[11px] text-slate-500 font-mono">({colQuotes.length})</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                    {formatCurrency(colTotal, business.currencySymbol)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colQuotes.map((q) => {
                    const calc = calculateQuote(q, business.defaultTaxRate);
                    const winData = winScores.get(q.id) || calculateWinProbability(q, allQuotes || quotes);

                    return (
                      <div
                        key={q.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-blue-900">{q.quoteNumber}</span>
                          <span className="text-slate-400 font-mono">
                            {new Date(q.createdAt).toLocaleDateString('en-US', {
                              month: 'numeric',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div>
                          <button
                            onClick={() => onSelectQuote(q)}
                            className="text-xs font-bold text-slate-900 hover:text-blue-900 text-left line-clamp-2 cursor-pointer transition-colors"
                          >
                            {q.projectTitle}
                          </button>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {q.client.name} · {q.client.serviceAddress}
                          </p>
                        </div>

                        {/* AI Win Probability Card Badge */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => setSelectedWinQuote(q)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border hover:scale-105 transition-all cursor-pointer shadow-2xs ${winData.badgeBg} ${winData.badgeText} ${winData.badgeBorder}`}
                            title={`AI Win Probability: ${winData.score}%\nCohort: ${winData.jobSizeCohort.label} (${winData.jobSizeCohort.historicalAcceptanceRate}% baseline)\nClick for AI breakdown`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{winData.score}% Win</span>
                            <span className="opacity-75">· {winData.rating}</span>
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {winData.jobSizeCohort.historicalAcceptanceRate}% cohort
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                          <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                            {formatCurrency(calc.total, business.currencySymbol)}
                          </span>
                          <div className="flex items-center gap-1">
                            {onOpenFollowUpRadar && (
                              <button
                                onClick={() => onOpenFollowUpRadar(q)}
                                className="p-1 text-purple-700 hover:text-purple-900 rounded cursor-pointer"
                                title="AI Follow-Up & Close Radar"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onOpenShareModal(q)}
                              className="p-1 text-slate-500 hover:text-blue-900 rounded cursor-pointer"
                              title="Share"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditQuote(q)}
                              className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Quick state progression */}
                        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Status:</span>
                          <select
                            value={q.status}
                            onChange={(e) => onUpdateStatus(q.id, e.target.value as QuoteStatus)}
                            className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-800 cursor-pointer"
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="viewed">Viewed</option>
                            <option value="accepted">Accepted</option>
                            <option value="invoiced">Invoiced</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Win Probability Deep Dive Modal */}
      {selectedWinQuote && (
        <AIWinProbabilityModal
          quote={selectedWinQuote}
          allQuotes={allQuotes || quotes}
          clientRecord={
            clients?.find(
              (c) =>
                c.email?.toLowerCase() === selectedWinQuote.client.email?.toLowerCase() ||
                c.name?.toLowerCase() === selectedWinQuote.client.name?.toLowerCase()
            ) || null
          }
          business={business}
          isOpen={Boolean(selectedWinQuote)}
          onClose={() => setSelectedWinQuote(null)}
          onOpenFollowUpRadar={onOpenFollowUpRadar}
          onSelectQuote={onSelectQuote}
        />
      )}
    </div>
  );
};
