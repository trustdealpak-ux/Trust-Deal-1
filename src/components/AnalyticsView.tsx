import React from 'react';
import { BusinessProfile, ServiceQuote } from '../types';
import { calculateQuote, formatCurrency } from '../utils/calculations';
import {
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface AnalyticsViewProps {
  quotes: ServiceQuote[];
  business: BusinessProfile;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ quotes, business }) => {
  const analytics = React.useMemo(() => {
    let totalQuoted = 0;
    let wonRevenue = 0;
    let pendingRevenue = 0;
    let totalEstCost = 0;
    let wonEstCost = 0;

    let draftCount = 0;
    let sentCount = 0;
    let acceptedCount = 0;
    let invoicedCount = 0;

    quotes.forEach((q) => {
      const calc = calculateQuote(q, business.defaultTaxRate);
      totalQuoted += calc.total;
      totalEstCost += calc.estimatedCost;

      if (q.status === 'draft') draftCount++;
      if (q.status === 'sent' || q.status === 'viewed') {
        sentCount++;
        pendingRevenue += calc.total;
      }
      if (q.status === 'accepted' || q.status === 'invoiced') {
        wonRevenue += calc.total;
        wonEstCost += calc.estimatedCost;
        if (q.status === 'accepted') acceptedCount++;
        if (q.status === 'invoiced') invoicedCount++;
      }
    });

    const closedDeals = acceptedCount + invoicedCount;
    const totalOut = sentCount + closedDeals;
    const winRate = totalOut > 0 ? (closedDeals / totalOut) * 100 : 0;
    const wonProfit = wonRevenue - wonEstCost;
    const wonMargin = wonRevenue > 0 ? (wonProfit / wonRevenue) * 100 : 0;

    return {
      totalQuoted,
      wonRevenue,
      pendingRevenue,
      winRate,
      wonProfit,
      wonMargin,
      draftCount,
      sentCount,
      acceptedCount,
      invoicedCount,
      totalCount: quotes.length,
    };
  }, [quotes, business.defaultTaxRate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Revenue & Quote Conversion Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Performance metrics for {business.name}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Total Quoted Value</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatCurrency(analytics.totalQuoted, business.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Across {analytics.totalCount} proposals
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Signed Revenue Won</span>
          <p className="text-2xl font-bold text-emerald-800 font-mono tabular-nums mt-1">
            {formatCurrency(analytics.wonRevenue, business.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            {analytics.acceptedCount + analytics.invoicedCount} jobs approved
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Proposal Win Rate</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {analytics.winRate.toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Closed vs out for signature
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 block">Estimated Won Gross Profit</span>
          <p className="text-2xl font-bold text-blue-900 font-mono tabular-nums mt-1">
            {formatCurrency(analytics.wonProfit, business.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            {analytics.wonMargin.toFixed(1)}% gross margin
          </p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Proposal Pipeline Status
          </h2>

          <div className="space-y-3">
            {[
              {
                label: 'Accepted & Invoiced (Won)',
                count: analytics.acceptedCount + analytics.invoicedCount,
                color: 'bg-emerald-600',
                val: analytics.wonRevenue,
              },
              {
                label: 'Sent & Under Customer Review',
                count: analytics.sentCount,
                color: 'bg-amber-500',
                val: analytics.pendingRevenue,
              },
              {
                label: 'Internal Drafts',
                count: analytics.draftCount,
                color: 'bg-slate-400',
                val: analytics.totalQuoted - analytics.wonRevenue - analytics.pendingRevenue,
              },
            ].map((stat, idx) => {
              const pct = analytics.totalCount > 0 ? (stat.count / analytics.totalCount) * 100 : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{stat.label}</span>
                    <span className="font-mono text-slate-900 tabular-nums">
                      {stat.count} quotes · {formatCurrency(Math.max(0, stat.val), business.currencySymbol)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trade Efficiency Insights */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Closing Velocity & Recommendations
          </h2>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-900 block">
                Offer 3-Tier Option Proposals:
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Contractors offering Good / Better / Best packages experience a 38% higher average ticket value. Customers consistently pick the middle &quot;Better&quot; recommendation over the bare minimum repair.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-900 block">
                Standardize Deposit Requirement:
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your current default deposit is {business.defaultDepositPercent}%. Requiring a 30-35% upfront deposit covers material costs prior to arrival and minimizes customer cancellations.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-900 block">
                Digital Signature Adoption:
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Proposals with instant e-signatures sent via SMS close within 14 hours on average, compared to 4.2 days for manual paper or PDF email attachments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
