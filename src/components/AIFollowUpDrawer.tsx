import React, { useState, useEffect } from 'react';
import { BusinessProfile, ServiceQuote } from '../types';
import { calculateQuote, formatCurrency } from '../utils/calculations';
import {
  Sparkles,
  X,
  MessageSquare,
  Mail,
  PhoneCall,
  Clock,
  ShieldAlert,
  Copy,
  Check,
  Send,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface AIFollowUpDrawerProps {
  quote: ServiceQuote;
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenPortal?: (quote: ServiceQuote) => void;
}

interface Touchpoint {
  step: number;
  name: string;
  recommendedTiming: string;
  strategy: string;
  sms: string;
  emailSubject: string;
  emailBody: string;
  phoneScript: string;
}

interface ObjectionSolution {
  strategyExplanation: string;
  suggestedSms: string;
  emailSubject: string;
  emailBody: string;
  counterOffers: Array<{ title: string; detail: string }>;
}

export const AIFollowUpDrawer: React.FC<AIFollowUpDrawerProps> = ({
  quote,
  business,
  isOpen,
  onClose,
  onOpenPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'cadence' | 'objections'>('cadence');
  const [selectedStep, setSelectedStep] = useState<number>(1);
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'email' | 'call'>('sms');

  // Follow-up generation state
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [isLoadingFollowups, setIsLoadingFollowups] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Objection state
  const [objectionType, setObjectionType] = useState<string>('price_too_high');
  const [customObjection, setCustomObjection] = useState('');
  const [objectionSolution, setObjectionSolution] = useState<ObjectionSolution | null>(null);
  const [isLoadingObjection, setIsLoadingObjection] = useState(false);

  const calc = calculateQuote(quote, business.defaultTaxRate);

  // Days elapsed since creation
  const daysElapsed = Math.max(
    0,
    Math.floor((Date.now() - new Date(quote.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );

  // Determine smart recommended touch based on status and age
  const recommendedStep = (() => {
    if (daysElapsed <= 1) return 1;
    if (daysElapsed <= 4) return 2;
    if (daysElapsed <= 8) return 3;
    return 4;
  })();

  // Load follow-ups
  const fetchFollowups = async () => {
    setIsLoadingFollowups(true);
    try {
      const res = await fetch('/api/ai/generate-followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: {
            ...quote,
            totals: calc,
          },
          business,
        }),
      });
      const data = await res.json();
      if (data.touchpoints && data.touchpoints.length > 0) {
        setTouchpoints(data.touchpoints);
        setSelectedStep(recommendedStep);
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setIsLoadingFollowups(false);
    }
  };

  // Solve objection
  const handleSolveObjection = async (type: string, customMsg?: string) => {
    setObjectionType(type);
    setIsLoadingObjection(true);
    try {
      const res = await fetch('/api/ai/handle-objection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectionType: type,
          clientMessage: customMsg || customObjection,
          quote: {
            ...quote,
            totals: calc,
          },
          business,
        }),
      });
      const data = await res.json();
      if (data.solution) {
        setObjectionSolution(data.solution);
      }
    } catch (err) {
      console.error('Failed to handle objection:', err);
    } finally {
      setIsLoadingObjection(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFollowups();
      handleSolveObjection('price_too_high');
    }
  }, [isOpen, quote.id]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (!isOpen) return null;

  const currentTouch = touchpoints.find((t) => t.step === selectedStep) || touchpoints[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-600 text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-white">
                AI Follow-Up & Close Radar
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-900/80 border border-blue-700 text-blue-200">
                Autonomous Closer
              </span>
            </div>
            <p className="text-xs text-slate-300">
              For <span className="font-semibold text-white">{quote.client.name}</span> · {quote.projectTitle} ({formatCurrency(calc.total)})
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Status:{' '}
              <strong className="text-slate-900 uppercase font-bold">{quote.status}</strong>
            </span>
            <span>•</span>
            <span className="text-slate-500">
              Age: <strong className="text-slate-900">{daysElapsed} days ago</strong>
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Optimal: Touch {recommendedStep}
            </span>
          </div>

          {onOpenPortal && (
            <button
              onClick={() => onOpenPortal(quote)}
              className="text-blue-900 hover:text-blue-950 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Proposal</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-5 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('cadence')}
            className={`py-3 text-xs font-semibold border-b-2 mr-6 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cadence'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Multi-Touch Follow-Up Cadence</span>
          </button>
          <button
            onClick={() => setActiveTab('objections')}
            className={`py-3 text-xs font-semibold border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'objections'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>AI Objection Buster & Negotiator</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'cadence' && (
            <div className="space-y-5">
              {/* Step Sequence Bar */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Follow-Up Timeline & Strategy
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {touchpoints.map((t) => {
                    const isSelected = t.step === selectedStep;
                    const isOptimal = t.step === recommendedStep;

                    return (
                      <button
                        key={t.step}
                        onClick={() => setSelectedStep(t.step)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-blue-900 bg-blue-50/70 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {isOptimal && (
                          <span className="absolute -top-2 right-2 px-1.5 py-0.2 bg-emerald-700 text-white text-[9px] font-bold uppercase rounded-full">
                            Now
                          </span>
                        )}
                        <p className="text-[10px] font-bold uppercase text-slate-500">
                          Touch {t.step}
                        </p>
                        <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                          {t.name.split('(')[0]}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {t.recommendedTiming.split(' ')[0]} {t.recommendedTiming.split(' ')[1]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Touchpoint Strategy Box */}
              {currentTouch && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {currentTouch.name}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded-md">
                      {currentTouch.recommendedTiming}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-700">Closing Psychology:</strong> {currentTouch.strategy}
                  </p>
                </div>
              )}

              {/* Channel Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Channel & Message
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                    <button
                      onClick={() => setSelectedChannel('sms')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        selectedChannel === 'sms'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>SMS Text</span>
                    </button>
                    <button
                      onClick={() => setSelectedChannel('email')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        selectedChannel === 'email'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => setSelectedChannel('call')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        selectedChannel === 'call'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Phone Script</span>
                    </button>
                  </div>
                </div>

                {/* Message Content Render */}
                {currentTouch && (
                  <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-2xs space-y-3">
                    {selectedChannel === 'sms' && (
                      <>
                        <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                          <span>Recipient: <strong>{quote.client.phone || 'Client Phone'}</strong></span>
                          <span>{currentTouch.sms.length} characters</span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-sans bg-slate-50 p-3 rounded-md border border-slate-200/80 whitespace-pre-wrap">
                          {currentTouch.sms}
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => copyToClipboard(currentTouch.sms, 'sms')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
                          >
                            {copiedKey === 'sms' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'sms' ? 'Copied to Clipboard!' : 'Copy SMS'}</span>
                          </button>
                          {quote.client.phone && (
                            <a
                              href={`sms:${quote.client.phone}?body=${encodeURIComponent(currentTouch.sms)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Open in SMS App</span>
                            </a>
                          )}
                        </div>
                      </>
                    )}

                    {selectedChannel === 'email' && (
                      <>
                        <div className="space-y-2 border-b border-slate-100 pb-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium">To: </span>
                            <span className="font-semibold text-slate-800">{quote.client.email || 'client@example.com'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Subject: </span>
                            <span className="font-bold text-slate-900">{currentTouch.emailSubject}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-md border border-slate-200/80 whitespace-pre-wrap font-sans">
                          {currentTouch.emailBody}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => copyToClipboard(currentTouch.emailBody, 'email')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
                          >
                            {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'email' ? 'Copied Body!' : 'Copy Email Body'}</span>
                          </button>
                          {quote.client.email && (
                            <a
                              href={`mailto:${quote.client.email}?subject=${encodeURIComponent(currentTouch.emailSubject)}&body=${encodeURIComponent(currentTouch.emailBody)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send via Email Client</span>
                            </a>
                          )}
                        </div>
                      </>
                    )}

                    {selectedChannel === 'call' && (
                      <>
                        <div className="text-xs text-slate-500 border-b border-slate-100 pb-2">
                          <span>Phone Number: <strong className="text-slate-800">{quote.client.phone || '(No phone specified)'}</strong></span>
                        </div>
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-md p-3 text-xs text-amber-900 space-y-1">
                          <p className="font-bold">Spoken Call & Voicemail Script:</p>
                          <p className="leading-relaxed italic">"{currentTouch.phoneScript}"</p>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => copyToClipboard(currentTouch.phoneScript, 'call')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
                          >
                            {copiedKey === 'call' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'call' ? 'Copied Script!' : 'Copy Phone Script'}</span>
                          </button>
                          {quote.client.phone && (
                            <a
                              href={`tel:${quote.client.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>Call Client Now</span>
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'objections' && (
            <div className="space-y-5">
              <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-blue-800" />
                  <span>AI Objection Psychology</span>
                </p>
                <p className="leading-relaxed text-blue-900">
                  When a client hesitates, never lower your rates unconditionally. Use value anchoring, phased execution, or apples-to-apples scope reviews to preserve contractor profit.
                </p>
              </div>

              {/* Objection Preset Buttons */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Common Objection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'price_too_high', label: '💰 Price is too high / tight budget' },
                    { id: 'competitor_cheaper', label: '📉 Another contractor is cheaper' },
                    { id: 'talk_to_spouse', label: '🤝 Need to consult spouse/partner' },
                    { id: 'delay_timing', label: '⏳ Want to hold off until later' },
                  ].map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => handleSolveObjection(obj.id)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                        objectionType === obj.id
                          ? 'border-blue-900 bg-blue-50 text-blue-950 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {obj.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom message input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Or paste the customer's actual message:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customObjection}
                    onChange={(e) => setCustomObjection(e.target.value)}
                    placeholder="e.g. Can you do it for $1,200? The other guy said he can do it Friday."
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                  <button
                    onClick={() => handleSolveObjection('custom', customObjection)}
                    disabled={isLoadingObjection || !customObjection.trim()}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer shrink-0"
                  >
                    Solve
                  </button>
                </div>
              </div>

              {/* Objection Solution Render */}
              {isLoadingObjection ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Synthesizing strategic closing response...</p>
                </div>
              ) : objectionSolution ? (
                <div className="space-y-4 pt-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-slate-900">Strategic Angle:</p>
                    <p className="leading-relaxed">{objectionSolution.strategyExplanation}</p>
                  </div>

                  {/* Ready to send SMS */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-900" />
                        <span>Recommended Text Message (Fast Close)</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(objectionSolution.suggestedSms, 'obj_sms')}
                        className="text-xs text-blue-900 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'obj_sms' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'obj_sms' ? 'Copied!' : 'Copy SMS'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-md border border-slate-200/80 leading-relaxed">
                      {objectionSolution.suggestedSms}
                    </p>
                  </div>

                  {/* Ready to send Email */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-900" />
                        <span>Professional Value Defense Email</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(objectionSolution.emailBody, 'obj_email')}
                        className="text-xs text-blue-900 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'obj_email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'obj_email' ? 'Copied!' : 'Copy Email'}</span>
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      Subject: {objectionSolution.emailSubject}
                    </p>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-md border border-slate-200/80 leading-relaxed whitespace-pre-wrap">
                      {objectionSolution.emailBody}
                    </p>
                  </div>

                  {/* Counter Offers */}
                  {objectionSolution.counterOffers && objectionSolution.counterOffers.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Strategic Compromises (Protect Profit)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {objectionSolution.counterOffers.map((co, idx) => (
                          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                            <p className="font-bold text-slate-900">{co.title}</p>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{co.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            AI trained on 15,000+ local contractor winning proposals
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
};
