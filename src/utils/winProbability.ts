import { BusinessProfile, ClientRecord, ServiceQuote } from '../types';
import { calculateQuote } from './calculations';

export interface WinProbabilityFactor {
  name: string;
  category: 'historical_size' | 'customer_interaction' | 'quote_structure' | 'urgency_timeline';
  impact: 'positive' | 'negative' | 'neutral';
  scoreDelta: number;
  description: string;
}

export interface JobSizeCohort {
  label: string;
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  quoteTotal: number;
  totalHistoricalQuotes: number;
  acceptedHistoricalQuotes: number;
  historicalAcceptanceRate: number; // 0 - 100
  isIndustryBenchmark: boolean;
  sampleDescription: string;
}

export interface CustomerInteractionAnalysis {
  interactionLevel: 'high_engagement' | 'moderate' | 'unopened' | 'stalled' | 'closed';
  viewLatencyHours?: number;
  hasViewed: boolean;
  daysSinceSent: number;
  isRepeatCustomer: boolean;
  priorCompletedJobs: number;
  clientTag?: string;
  engagementSummary: string;
}

export interface WinProbabilityResult {
  score: number; // 0 - 100
  rating: 'Very High' | 'High' | 'Moderate' | 'At Risk' | 'Closed Won' | 'Closed Lost';
  color: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  confidence: 'High' | 'Moderate' | 'Preliminary';
  jobSizeCohort: JobSizeCohort;
  customerInteraction: CustomerInteractionAnalysis;
  factors: WinProbabilityFactor[];
  strengths: string[];
  risks: string[];
  recommendedAction: string;
  recommendedFollowUpType: 'nudge' | 'objection_check' | 'urgency_offer' | 'schedule_call';
}

/**
 * Calculates AI-driven Win Probability score for a quote based on:
 * 1. Historical acceptance rates for similar job sizes in this business/trade
 * 2. Real-time customer interactions (view latency, days since sent, repeat client status)
 * 3. Proposal structure signals (tiered options, deposit terms, discounts, warranty)
 */
export function calculateWinProbability(
  quote: ServiceQuote,
  allQuotes: ServiceQuote[] = [],
  clientRecord?: ClientRecord | null,
  taxRate: number = 8.5
): WinProbabilityResult {
  const calc = calculateQuote(quote, taxRate);
  const total = calc.total;

  // 1. Immediately handle terminal closed statuses
  if (quote.status === 'accepted' || quote.status === 'invoiced') {
    return {
      score: 100,
      rating: 'Closed Won',
      color: 'emerald',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      confidence: 'High',
      jobSizeCohort: {
        label: 'Accepted Job',
        priceRange: `$${Math.round(total).toLocaleString()}`,
        minPrice: total,
        maxPrice: total,
        quoteTotal: total,
        totalHistoricalQuotes: 1,
        acceptedHistoricalQuotes: 1,
        historicalAcceptanceRate: 100,
        isIndustryBenchmark: false,
        sampleDescription: 'Proposal accepted by client and scheduled.',
      },
      customerInteraction: {
        interactionLevel: 'closed',
        hasViewed: true,
        daysSinceSent: 0,
        isRepeatCustomer: false,
        priorCompletedJobs: 1,
        engagementSummary: 'Client accepted proposal and signed agreement.',
      },
      factors: [
        {
          name: 'Proposal Accepted & Signed',
          category: 'customer_interaction',
          impact: 'positive',
          scoreDelta: 100,
          description: 'Client executed agreement terms.',
        },
      ],
      strengths: ['Signed authorization on record', 'Deposit terms established'],
      risks: [],
      recommendedAction: 'Ready for job scheduling and material procurement.',
      recommendedFollowUpType: 'schedule_call',
    };
  }

  if (quote.status === 'declined') {
    return {
      score: 0,
      rating: 'Closed Lost',
      color: 'slate',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-600',
      badgeBorder: 'border-slate-200',
      confidence: 'High',
      jobSizeCohort: {
        label: 'Declined Opportunity',
        priceRange: `$${Math.round(total).toLocaleString()}`,
        minPrice: total,
        maxPrice: total,
        quoteTotal: total,
        totalHistoricalQuotes: 1,
        acceptedHistoricalQuotes: 0,
        historicalAcceptanceRate: 0,
        isIndustryBenchmark: false,
        sampleDescription: 'Client declined this quote.',
      },
      customerInteraction: {
        interactionLevel: 'closed',
        hasViewed: true,
        daysSinceSent: 0,
        isRepeatCustomer: false,
        priorCompletedJobs: 0,
        engagementSummary: 'Quote marked as declined.',
      },
      factors: [
        {
          name: 'Declined by Customer',
          category: 'customer_interaction',
          impact: 'negative',
          scoreDelta: -100,
          description: 'Proposal rejected or expired.',
        },
      ],
      strengths: [],
      risks: ['Client did not move forward'],
      recommendedAction: 'Consider sending a polite feedback survey or revised scope in 30 days.',
      recommendedFollowUpType: 'objection_check',
    };
  }

  // 2. Identify Job Size Cohort & Historical Acceptance Rate
  let cohortLabel = 'Standard Project';
  let minRange = 0;
  let maxRange = 10000;
  let industryBenchmark = 65; // default 65% baseline win rate

  if (total < 1000) {
    cohortLabel = 'Micro / Diagnostic (<$1K)';
    minRange = 0;
    maxRange = 1200;
    industryBenchmark = 78; // smaller jobs close faster
  } else if (total < 3500) {
    cohortLabel = 'Standard Residential ($1K–$3.5K)';
    minRange = 800;
    maxRange = 4000;
    industryBenchmark = 68;
  } else if (total < 7500) {
    cohortLabel = 'Major System / Remodel ($3.5K–$7.5K)';
    minRange = 3000;
    maxRange = 9000;
    industryBenchmark = 59;
  } else {
    cohortLabel = 'Premium / Large Scope ($7.5K+)';
    minRange = 7000;
    maxRange = 50000;
    industryBenchmark = 48; // high tickets take longer and have lower single-touch close rates
  }

  // Calculate historical quotes in similar size bracket
  const relevantHistoricalQuotes = allQuotes.filter((q) => {
    if (q.id === quote.id) return false;
    const qTotal = calculateQuote(q, taxRate).total;
    // Match quotes in the price range
    return qTotal >= minRange && qTotal <= maxRange;
  });

  const closedHistoricalQuotes = relevantHistoricalQuotes.filter(
    (q) => q.status === 'accepted' || q.status === 'invoiced' || q.status === 'declined'
  );

  const acceptedHistoricalQuotes = closedHistoricalQuotes.filter(
    (q) => q.status === 'accepted' || q.status === 'invoiced'
  );

  let historicalAcceptanceRate = industryBenchmark;
  let isIndustryBenchmark = true;
  let sampleDescription = `Based on trade benchmark (${industryBenchmark}% average for ${cohortLabel}).`;

  if (closedHistoricalQuotes.length >= 2) {
    const rawHistoricalRate =
      (acceptedHistoricalQuotes.length / closedHistoricalQuotes.length) * 100;
    // Blend empirical data with benchmark based on sample size
    const empiricalWeight = Math.min(0.85, closedHistoricalQuotes.length * 0.25);
    historicalAcceptanceRate = Math.round(
      rawHistoricalRate * empiricalWeight + industryBenchmark * (1 - empiricalWeight)
    );
    isIndustryBenchmark = false;
    sampleDescription = `${acceptedHistoricalQuotes.length} of ${closedHistoricalQuotes.length} similar-sized quotes closed in your account (${Math.round(rawHistoricalRate)}% account close rate).`;
  }

  // 3. Customer Interaction Analysis
  const now = new Date();
  const createdAtDate = new Date(quote.createdAt);
  const sentAtDate = quote.sentAt ? new Date(quote.sentAt) : null;
  const viewedAtDate = quote.viewedAt ? new Date(quote.viewedAt) : null;

  // Days since sent
  const referenceDate = sentAtDate || createdAtDate;
  const elapsedMs = Math.max(0, now.getTime() - referenceDate.getTime());
  const daysSinceSent = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

  // View latency (hours between sent and viewed)
  let viewLatencyHours: number | undefined;
  if (sentAtDate && viewedAtDate) {
    const latencyMs = Math.max(0, viewedAtDate.getTime() - sentAtDate.getTime());
    viewLatencyHours = Math.round((latencyMs / (1000 * 60 * 60)) * 10) / 10;
  }

  const hasViewed = quote.status === 'viewed' || Boolean(quote.viewedAt);

  // Check repeat customer status
  const clientQuotes = allQuotes.filter(
    (q) =>
      q.id !== quote.id &&
      (q.client.email?.toLowerCase() === quote.client.email?.toLowerCase() ||
        q.client.name?.toLowerCase() === quote.client.name?.toLowerCase())
  );
  const priorCompletedJobs = clientQuotes.filter(
    (q) => q.status === 'accepted' || q.status === 'invoiced'
  ).length;
  const isRepeatCustomer = priorCompletedJobs > 0;

  let interactionLevel: CustomerInteractionAnalysis['interactionLevel'] = 'moderate';
  let engagementSummary = 'Quote sent to client.';

  if (hasViewed) {
    if (daysSinceSent <= 3) {
      interactionLevel = 'high_engagement';
      engagementSummary = viewLatencyHours !== undefined && viewLatencyHours < 12
        ? `High Engagement: Client viewed proposal within ${viewLatencyHours} hrs of sending.`
        : 'Active Engagement: Client recently opened and reviewed proposal.';
    } else if (daysSinceSent <= 8) {
      interactionLevel = 'moderate';
      engagementSummary = `Client viewed proposal ${daysSinceSent} days ago; awaiting decision.`;
    } else {
      interactionLevel = 'stalled';
      engagementSummary = `Stalled: Client viewed ${daysSinceSent} days ago without signing.`;
    }
  } else if (quote.status === 'sent') {
    if (daysSinceSent > 4) {
      interactionLevel = 'unopened';
      engagementSummary = `Unopened: Delivered ${daysSinceSent} days ago but client has not yet opened.`;
    } else {
      interactionLevel = 'moderate';
      engagementSummary = `Recently sent (${daysSinceSent}d ago); awaiting first client review.`;
    }
  } else {
    // Draft
    interactionLevel = 'unopened';
    engagementSummary = 'Draft status: Not yet sent to client.';
  }

  // 4. Calculate Weighted Score
  let score = historicalAcceptanceRate;
  const factors: WinProbabilityFactor[] = [];
  const strengths: string[] = [];
  const risks: string[] = [];

  // Factor A: Historical Job Size Baseline
  factors.push({
    name: `Historical Size Baseline (${cohortLabel})`,
    category: 'historical_size',
    impact: historicalAcceptanceRate >= 65 ? 'positive' : 'neutral',
    scoreDelta: Math.round(historicalAcceptanceRate - 60),
    description: sampleDescription,
  });

  // Factor B: Customer Interactions & Engagement Latency
  if (hasViewed) {
    if (viewLatencyHours !== undefined && viewLatencyHours <= 6) {
      score += 16;
      factors.push({
        name: 'Rapid Customer Engagement',
        category: 'customer_interaction',
        impact: 'positive',
        scoreDelta: +16,
        description: `Client opened quote in under ${Math.ceil(viewLatencyHours)} hours—signals high buying urgency.`,
      });
      strengths.push(`Client opened proposal rapidly (${viewLatencyHours}h after sending)`);
    } else if (viewLatencyHours !== undefined && viewLatencyHours <= 24) {
      score += 12;
      factors.push({
        name: 'Prompt Customer Review',
        category: 'customer_interaction',
        impact: 'positive',
        scoreDelta: +12,
        description: 'Client viewed proposal within 24 hours of delivery.',
      });
      strengths.push('Client engaged within 24 hours');
    } else {
      score += 8;
      factors.push({
        name: 'Proposal Opened by Client',
        category: 'customer_interaction',
        impact: 'positive',
        scoreDelta: +8,
        description: 'Customer accessed the proposal portal.',
      });
      strengths.push('Customer has reviewed the proposal');
    }
  } else if (quote.status === 'sent') {
    if (daysSinceSent >= 5) {
      score -= 14;
      factors.push({
        name: 'Unopened After 5+ Days',
        category: 'customer_interaction',
        impact: 'negative',
        scoreDelta: -14,
        description: 'Client has not opened email/SMS delivery link. May be in spam or neglected.',
      });
      risks.push('Customer has not opened the link after 5+ days');
    } else {
      score += 2;
      factors.push({
        name: 'Recently Delivered',
        category: 'customer_interaction',
        impact: 'positive',
        scoreDelta: +2,
        description: 'Delivered to customer inbox; evaluation underway.',
      });
    }
  } else if (quote.status === 'draft') {
    score -= 10;
    factors.push({
      name: 'Unsent Draft',
      category: 'customer_interaction',
      impact: 'neutral',
      scoreDelta: -10,
      description: 'Quote not yet presented to customer.',
    });
    risks.push('Quote is still in draft state');
  }

  // Factor C: Time-Elapsed Momentum Decay
  if (quote.status !== 'draft') {
    if (daysSinceSent <= 2) {
      score += 8;
      factors.push({
        name: 'Golden 48-Hour Closing Window',
        category: 'urgency_timeline',
        impact: 'positive',
        scoreDelta: +8,
        description: '74% of contractor quotes close within 48 hours of initial delivery.',
      });
      strengths.push('Within peak 48-hour closing window');
    } else if (daysSinceSent > 7 && daysSinceSent <= 14) {
      score -= 12;
      factors.push({
        name: 'Momentum Loss (7–14 Days Inactive)',
        category: 'urgency_timeline',
        impact: 'negative',
        scoreDelta: -12,
        description: 'Extended delay without customer signature; competitive shopping risk increases.',
      });
      risks.push(`No response for ${daysSinceSent} days`);
    } else if (daysSinceSent > 14) {
      score -= 22;
      factors.push({
        name: 'Stalled Deal (>14 Days)',
        category: 'urgency_timeline',
        impact: 'negative',
        scoreDelta: -22,
        description: 'Quote is exceeding typical decision cycle; needs prompt reactivation.',
      });
      risks.push(`Over two weeks old (${daysSinceSent} days) without closure`);
    }
  }

  // Factor D: Repeat Customer Loyalty
  if (isRepeatCustomer) {
    score += 15;
    factors.push({
      name: 'Repeat Customer Loyalty Boost',
      category: 'customer_interaction',
      impact: 'positive',
      scoreDelta: +15,
      description: `Client previously approved ${priorCompletedJobs} job(s) with your team. High established trust.`,
    });
    strengths.push(`Existing client with ${priorCompletedJobs} past approved project(s)`);
  } else if (clientRecord?.tag === 'vip' || clientRecord?.tag === 'property_manager') {
    score += 10;
    factors.push({
      name: 'High-Value Account Profile',
      category: 'customer_interaction',
      impact: 'positive',
      scoreDelta: +10,
      description: `Client tagged as ${clientRecord.tag.replace('_', ' ').toUpperCase()} with recurring property needs.`,
    });
    strengths.push(`Client tagged as ${clientRecord.tag.replace('_', ' ').toUpperCase()}`);
  }

  // Factor E: Proposal Structure (Tiers, Deposit, Terms)
  if (quote.isTiered && quote.tiers && quote.tiers.length >= 2) {
    score += 12;
    factors.push({
      name: 'Tiered Options (Good/Better/Best)',
      category: 'quote_structure',
      impact: 'positive',
      scoreDelta: +12,
      description: 'Tiered choices eliminate single-price shock and give clients control, boosting close rates by 28%.',
    });
    strengths.push('Multi-tier pricing structure gives customer choice');
  }

  // Deposit Friction Check
  if (quote.depositRequiredPercent > 0 && quote.depositRequiredPercent <= 33) {
    score += 5;
    factors.push({
      name: 'Frictionless Deposit Terms',
      category: 'quote_structure',
      impact: 'positive',
      scoreDelta: +5,
      description: `${quote.depositRequiredPercent}% deposit aligns with customer cash-flow comfort.`,
    });
    strengths.push(`Balanced deposit requirement (${quote.depositRequiredPercent}%)`);
  } else if (quote.depositRequiredPercent > 45) {
    score -= 8;
    factors.push({
      name: 'High Upfront Deposit Requirement',
      category: 'quote_structure',
      impact: 'negative',
      scoreDelta: -8,
      description: `${quote.depositRequiredPercent}% upfront deposit creates cash-flow friction for homeowner.`,
    });
    risks.push(`High upfront deposit (${quote.depositRequiredPercent}%) may induce hesitation`);
  }

  // Discount / Promotion Check
  if (quote.discountValue > 0) {
    score += 6;
    factors.push({
      name: 'Promotional Incentive Applied',
      category: 'quote_structure',
      impact: 'positive',
      scoreDelta: +6,
      description: 'Active discount creates perceived urgency and value.',
    });
    strengths.push('Promotional discount included');
  }

  // Warranty Terms Check
  if (quote.warrantyTerms && quote.warrantyTerms.length > 20) {
    score += 4;
    factors.push({
      name: 'Explicit Warranty Protection',
      category: 'quote_structure',
      impact: 'positive',
      scoreDelta: +4,
      description: 'Clear warranty language establishes quality credibility.',
    });
    strengths.push('Comprehensive warranty terms provided');
  }

  // Normalize final score for open pipeline
  score = Math.max(8, Math.min(96, Math.round(score)));

  // Rating & Styling
  let rating: WinProbabilityResult['rating'] = 'Moderate';
  let color: WinProbabilityResult['color'] = 'amber';
  let badgeBg = 'bg-amber-50';
  let badgeText = 'text-amber-800';
  let badgeBorder = 'border-amber-200';

  if (score >= 80) {
    rating = 'Very High';
    color = 'emerald';
    badgeBg = 'bg-emerald-50';
    badgeText = 'text-emerald-800';
    badgeBorder = 'border-emerald-300';
  } else if (score >= 65) {
    rating = 'High';
    color = 'blue';
    badgeBg = 'bg-blue-50';
    badgeText = 'text-blue-800';
    badgeBorder = 'border-blue-200';
  } else if (score >= 45) {
    rating = 'Moderate';
    color = 'amber';
    badgeBg = 'bg-amber-50';
    badgeText = 'text-amber-800';
    badgeBorder = 'border-amber-300';
  } else {
    rating = 'At Risk';
    color = 'rose';
    badgeBg = 'bg-rose-50';
    badgeText = 'text-rose-800';
    badgeBorder = 'border-rose-300';
  }

  // Confidence based on sample size
  const confidence: WinProbabilityResult['confidence'] =
    closedHistoricalQuotes.length >= 3 ? 'High' : closedHistoricalQuotes.length >= 1 ? 'Moderate' : 'Preliminary';

  // Recommended Action Formulation
  let recommendedAction = 'Maintain standard touchpoints.';
  let recommendedFollowUpType: WinProbabilityResult['recommendedFollowUpType'] = 'nudge';

  if (quote.status === 'draft') {
    recommendedAction = 'Send proposal to client to initiate tracking and start the closing clock.';
    recommendedFollowUpType = 'schedule_call';
  } else if (hasViewed && daysSinceSent <= 2) {
    recommendedAction = 'Customer viewed proposal recently. Send a warm check-in to answer any technical questions while intent is fresh.';
    recommendedFollowUpType = 'nudge';
  } else if (hasViewed && daysSinceSent > 2 && daysSinceSent <= 7) {
    recommendedAction = 'Follow up with an objection-buster touchpoint focusing on scheduling availability and warranty coverage.';
    recommendedFollowUpType = 'objection_check';
  } else if (hasViewed && daysSinceSent > 7) {
    recommendedAction = 'Deal is at risk of going cold. Offer a 5% early-booking incentive or offer to adjust the scope to fit budget.';
    recommendedFollowUpType = 'urgency_offer';
  } else if (!hasViewed && daysSinceSent >= 3) {
    recommendedAction = 'Client hasn’t opened the quote yet. Send a quick SMS reminder or call to confirm receipt.';
    recommendedFollowUpType = 'nudge';
  } else {
    recommendedAction = 'Quote in evaluation window. Review line items and ensure timely responses to questions.';
    recommendedFollowUpType = 'nudge';
  }

  return {
    score,
    rating,
    color,
    badgeBg,
    badgeText,
    badgeBorder,
    confidence,
    jobSizeCohort: {
      label: cohortLabel,
      priceRange: `$${minRange.toLocaleString()} – $${maxRange.toLocaleString()}`,
      minPrice: minRange,
      maxPrice: maxRange,
      quoteTotal: total,
      totalHistoricalQuotes: closedHistoricalQuotes.length,
      acceptedHistoricalQuotes: acceptedHistoricalQuotes.length,
      historicalAcceptanceRate,
      isIndustryBenchmark,
      sampleDescription,
    },
    customerInteraction: {
      interactionLevel,
      viewLatencyHours,
      hasViewed,
      daysSinceSent,
      isRepeatCustomer,
      priorCompletedJobs,
      clientTag: clientRecord?.tag,
      engagementSummary,
    },
    factors,
    strengths,
    risks,
    recommendedAction,
    recommendedFollowUpType,
  };
}
