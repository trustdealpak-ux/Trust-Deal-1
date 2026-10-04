import React from 'react';
import { BusinessProfile } from '../types';
import {
  Sparkles,
  BookOpen,
  FileCheck,
  CheckCircle2,
  Share2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Layers,
  PenTool,
  Clock,
  Kanban,
  Building2,
  Zap,
  Lightbulb,
} from 'lucide-react';

interface GuidelinesViewProps {
  business: BusinessProfile;
  onNavigate: (tab: 'pipeline' | 'builder' | 'clients' | 'catalog' | 'analytics' | 'settings') => void;
  onOpenAIDraft: () => void;
}

export const GuidelinesView: React.FC<GuidelinesViewProps> = ({
  business,
  onNavigate,
  onOpenAIDraft,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-200 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Master User Guide & Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            How to Use QuoteForge Local
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            QuoteForge is a purpose-built proposal generation SaaS designed for trade contractors and local service businesses. It turns informal client requests into high-converting, professional proposals with itemized scopes, margin intelligence, and digital e-signatures in under 60 seconds.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenAIDraft}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-md shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Try AI Quote Draft</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('builder')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Open Manual Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="hidden lg:block absolute -right-6 -bottom-6 w-56 h-56 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />
      </div>

      {/* 6-Step Workflow Roadmap */}
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            The 6-Step Contractor Workflow
          </h2>
          <p className="text-xs text-slate-500">
            Follow this standard operating procedure to maximize proposal close rate and revenue per job.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                1
              </span>
              <button
                onClick={() => onNavigate('settings')}
                className="text-[11px] font-semibold text-blue-800 hover:text-blue-950 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Edit Branding</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-900" />
                <span>Configure Business Identity & Credentials</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Add your official contractor license number, commercial liability insurance bond details, contact numbers, and default warranty disclaimers in <strong>Business Settings</strong>. This builds instant trust on client proposals.
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-500 border border-slate-100">
              Pro-Tip: Setting your default deposit (e.g. 30%) and local tax rate guarantees correct math across all proposals automatically.
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                2
              </span>
              <button
                onClick={onOpenAIDraft}
                className="text-[11px] font-semibold text-blue-800 hover:text-blue-950 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Assistant</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-900" />
                <span>Write in Plain Language with AI Assistant</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                You or your client don&apos;t need to manually type 20 line items. Simply type or paste notes like: <em>&quot;Need 50A EV charger installed in garage for Samantha Wei at 882 S Pearl St Denver, run 40ft conduit, pull city permit.&quot;</em> The AI automatically parses labor hours, materials, permit fees, timeline, and deposit.
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-500 border border-slate-100">
              Review & Amend: You can edit any line item, unit price, or description before clicking &quot;Apply & Populate Quote Form&quot;.
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                3
              </span>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                +38% Ticket Lift
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-900" />
                <span>Use the 3-Tier Option Strategy</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Instead of giving a single &quot;take it or leave it&quot; price, offer <strong>Good / Better / Best</strong> options. The customer can compare the standard fix vs high-efficiency upgrade vs turnkey overhaul with extended warranties. 70% of clients pick the middle &quot;Better&quot; recommendation.
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-500 border border-slate-100">
              In Quote Builder: Toggle between &quot;Single Scope&quot; and &quot;3-Tier Matrix&quot; anytime with 1 click.
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                4
              </span>
              <button
                onClick={() => onNavigate('catalog')}
                className="text-[11px] font-semibold text-blue-800 hover:text-blue-950 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Price Book</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span>Protect Margins with Live Profit Intelligence</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                As you build quotes, the right sidebar calculates your private internal direct costs vs client billing prices. It displays your estimated <strong>Gross Profit</strong> and <strong>Gross Margin %</strong> in real-time, alerting you if margins dip below 30%.
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-500 border border-slate-100">
              Private Data: Internal costs and profit percentages are strictly private to the contractor and never visible in client proposals.
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                5
              </span>
              <button
                onClick={() => onNavigate('pipeline')}
                className="text-[11px] font-semibold text-blue-800 hover:text-blue-950 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Go to Pipeline</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-blue-900" />
                <span>1-Click SMS & Email Quote Transmission</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Click <strong>&quot;Share & Send to Client&quot;</strong> on any quote to copy a pre-formatted SMS message or professional email draft with the direct interactive link and investment totals ready to send immediately to the homeowner.
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-500 border border-slate-100">
              Interactive Link: The client opens the link on their mobile phone or laptop with no app download required.
            </div>
          </div>

          {/* Step 6 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 shadow-2xs hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center font-mono">
                6
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Instant Closing
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-emerald-700" />
                <span>Touchscreen E-Signatures & PDF Export</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Clients can toggle optional upgrades, choose their desired package tier, and sign using their fingertip or mouse on the built-in HTML5 signature canvas. The quote status immediately updates to <strong>Accepted</strong>, locking in their spot.
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-500 border border-slate-100">
              Print & PDF: Clean print styling allows generating crisp, vector PDF files for printing or archiving anytime.
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic AI Suite Feature Overview */}
      <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-blue-600 text-white">
            <Sparkles className="w-4 h-4" />
          </span>
          <h2 className="text-base font-bold text-white tracking-tight">
            Next-Gen AI Quote Intelligence & Autonomous Follow-Up
          </h2>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-900/60 border border-blue-700 text-blue-200">
            Field Service AI Engine
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          How modern local contractors use QuoteForge AI to win quotes before competitors even show up:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
              <Zap className="w-3.5 h-3.5" />
              <span>Job Site Photo Estimator</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Snap a photo of any water heater, breaker panel, or bathroom leak. Gemini Vision detects equipment specs, code hazards, and outputs itemized materials & labor.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pipeline Win Probability Engine</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Every pipeline quote receives an AI <strong>Win Probability Score (0-100%)</strong> calculating closure likelihood from historical acceptance rates for similar job sizes, view latency, and repeat client trust.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Multi-Touch Follow-Up Closer</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Over 65% of quotes are won on follow-up. Generates personalized 4-touch SMS, email, and phone scripts tailored to each homeowner&apos;s project and age.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>AI Objection Buster</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Customer says &quot;too expensive&quot; or &quot;need to talk to spouse&quot;? Generate psychology-backed responses and phased scopes without cutting into contractor margin.
            </p>
          </div>
        </div>
      </div>

      {/* Trade Best Practices & FAQs */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Contractor Best Practices & Tips
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">Always Require a Deposit</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Never start work or order non-returnable equipment without securing the 25-35% deposit. It eliminates client ghosting and protects cash flow.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">Include Optional Add-Ons</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mark items like whole-house surge arrestors, annual flush maintenance, or smart thermostats as <em>Optional</em>. Clients select them ~35% of the time, boosting ticket sizes without pressure.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">Explicit Permitting Terms</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Specify city mechanical or electrical permit filing as a distinct line item to ensure clients recognize the value of code compliance and safety inspections.
            </p>
          </div>
        </div>
      </div>

      {/* Fast Action Launcher Footer */}
      <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-blue-950">
            Ready to generate your next service quote?
          </h3>
          <p className="text-xs text-blue-800">
            Try the AI Quote Assistant or explore your service price book.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAIDraft}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-md shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Open AI Quote Assistant</span>
          </button>
        </div>
      </div>
    </div>
  );
};
