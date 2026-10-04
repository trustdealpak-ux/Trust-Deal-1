import React, { useState } from 'react';
import { BusinessProfile, LineItem, QuoteTier, UnitType } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  Sparkles,
  Wand2,
  Check,
  RotateCcw,
  ArrowRight,
  Layers,
  FileText,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
  Edit2,
} from 'lucide-react';

interface AIQuoteAssistantModalProps {
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onApplyDraft: (draft: any) => void;
}

const SAMPLE_PROMPTS = [
  {
    trade: 'plumbing',
    label: 'Plumbing: Water Heater & Tank',
    text: 'Customer Eleanor Vance (510-555-8392, eleanor@example.com) at 1742 Skyline Blvd Oakland needs emergency replacement of a 50-gallon gas water heater. Install a high-efficiency Bradford White 50-Gal unit, new thermal expansion tank, quarter-turn shutoff ball valve, and file city mechanical permit. Needs it done next Tuesday, approx 4-5 hours labor.',
  },
  {
    trade: 'electrical',
    label: 'Electrical: 200A Panel & EV Charger',
    text: 'Customer Samantha Wei (720-419-7703, swei@weiproperties.com) at 882 S Pearl St Denver CO wants to upgrade her old 100A fuse box to a 200A Square D QO panel, plus run a dedicated 50-Amp NEMA 14-50 EV charger circuit 40ft into the detached garage. Include Denver city electrical permit and power company coordination. Start within 10 days.',
  },
  {
    trade: 'landscaping',
    label: 'Landscaping: Autumn Cleanup & Beds',
    text: 'Dr. Julian Foster (512-809-4112, jfoster@gmail.com) at 2418 Barton Creek Blvd Austin TX wants a full autumn estate cleanup: weed clearing, prune all crepe myrtles, deliver and spread 8 cubic yards of dark organic hardwood mulch, plant 12 Texas Sage 5-gallon shrubs, and repair broken zone 3 drip line. About 6 hours for a 4-man crew.',
  },
  {
    trade: 'cleaning',
    label: 'Cleaning: Post-Reno Deep Clean',
    text: 'Client Michael Torres (312-489-2210, mtorres@chicagoart.org) at 440 N Wabash Ave #18B Chicago needs complete post-construction deep clean of a 2,200 sq ft condo. Wipe inside all kitchen cabinets, scrub oven and fridge, clean all interior window glass, and hot water carpet extraction on 3 bedrooms. Start this Friday, 1 full day.',
  },
];

export const AIQuoteAssistantModal: React.FC<AIQuoteAssistantModalProps> = ({
  business,
  isOpen,
  onClose,
  onApplyDraft,
}) => {
  const [promptText, setPromptText] = useState('');
  const [mode, setMode] = useState<'single' | 'tiered'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [parsedDraft, setParsedDraft] = useState<any | null>(null);
  const [isFallbackNotice, setIsFallbackNotice] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  if (!isOpen) return null;

  const handleSelectSample = (text: string) => {
    setPromptText(text);
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      alert('Please describe your job scope or paste client notes.');
      return;
    }

    setIsLoading(true);
    setLoadingStep(1);
    setParsedDraft(null);
    setIsFallbackNotice(false);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 600);

    try {
      const response = await fetch('/api/ai/parse-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawDescription: promptText,
          trade: business.trade,
          mode,
          businessContext: {
            businessName: business.name,
            currencySymbol: business.currencySymbol,
            taxRate: business.defaultTaxRate,
            depositPercent: business.defaultDepositPercent,
          },
        }),
      });

      clearInterval(stepInterval);
      const data = await response.json();

      if (data.draft) {
        setParsedDraft(data.draft);
        if (data.isFallback) {
          setIsFallbackNotice(true);
        }
      } else {
        alert(data.error || 'Failed to generate quote draft. Please try again.');
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('AI generate error:', err);
      alert('Network error communicating with AI server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!parsedDraft) return;

    // Convert items with generated IDs
    const preparedDraft = {
      ...parsedDraft,
      singleItems: (parsedDraft.singleItems || []).map((item: any, idx: number) => ({
        id: `ai_item_${Date.now()}_${idx}`,
        category: item.category || 'labor',
        description: item.description || 'Service line item',
        quantity: Number(item.quantity) || 1,
        unit: (item.unit as UnitType) || 'hours',
        unitPrice: Number(item.unitPrice) || 100,
        unitCost: Number(item.unitCost) || 50,
        taxable: item.taxable !== undefined ? item.taxable : item.category === 'materials',
        isOptional: !!item.isOptional,
        selected: true,
      })),
      tiers: (parsedDraft.tiers || []).map((tier: any, tIdx: number) => ({
        id: tier.id || `tier_${tIdx + 1}`,
        name: tier.name || `Option ${tIdx + 1}`,
        tagline: tier.tagline || '',
        isRecommended: !!tier.isRecommended,
        warrantyYears: Number(tier.warrantyYears) || 1,
        items: (tier.items || []).map((item: any, iIdx: number) => ({
          id: `ai_tier_item_${Date.now()}_${tIdx}_${iIdx}`,
          category: item.category || 'labor',
          description: item.description || 'Task',
          quantity: Number(item.quantity) || 1,
          unit: (item.unit as UnitType) || 'hours',
          unitPrice: Number(item.unitPrice) || 100,
          unitCost: Number(item.unitCost) || 50,
          taxable: item.taxable !== undefined ? item.taxable : item.category === 'materials',
          isOptional: false,
          selected: true,
        })),
      })),
    };

    onApplyDraft(preparedDraft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  AI Quote Assistant
                </h3>
                <span className="text-[11px] font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Gemini Flash Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Type in simple conversational language or voice notes. AI auto-builds an itemized quote draft with labor, materials, permits, and pricing.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* If No Draft Generated Yet */}
          {!parsedDraft ? (
            <div className="space-y-4">
              {/* Scope Mode Selection */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Choose Proposal Format:
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Single scope breakdown or 3-tier Good/Better/Best packages
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMode('single')}
                    className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      mode === 'single'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Single Scope
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('tiered')}
                    className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-1 ${
                      mode === 'tiered'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>3-Tier Options</span>
                  </button>
                </div>
              </div>

              {/* Natural Plain Language Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Describe Job Scope, Client Details & Requirements:
                </label>
                <textarea
                  rows={5}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g. Mrs. Robinson (510-555-0192) at 450 Oak St needs a new 50-gal water heater installed. Pull city permit, replace corroded shutoff valve, install thermal expansion tank. Start next Wednesday."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900 text-slate-900 font-sans leading-relaxed"
                />
              </div>

              {/* One-click Sample Prompts */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Or Try a 1-Click Example from Local Trades:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(sample.text)}
                      className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition-colors text-xs cursor-pointer group"
                    >
                      <p className="font-semibold text-slate-900 group-hover:text-blue-900">
                        {sample.label}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {sample.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading steps indicator */}
              {isLoading && (
                <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-blue-950 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-semibold">
                    <Wand2 className="w-4 h-4 text-blue-800 animate-spin" />
                    <span>AI Estimator is generating quote structure...</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-500 pt-1">
                    <div className={loadingStep >= 1 ? 'font-bold text-blue-900' : ''}>
                      1. Parsing Scope
                    </div>
                    <div className={loadingStep >= 2 ? 'font-bold text-blue-900' : ''}>
                      2. Client Details
                    </div>
                    <div className={loadingStep >= 3 ? 'font-bold text-blue-900' : ''}>
                      3. Pricing & Labor
                    </div>
                    <div className={loadingStep >= 4 ? 'font-bold text-blue-900' : ''}>
                      4. Legal Terms
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Draft Review & Amend Panel */
            <div className="space-y-4 animate-in fade-in">
              {isFallbackNotice && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>Draft structured using our smart trade estimation algorithm. You can review and amend any detail below.</span>
                </div>
              )}

              {/* Title and Scope Banner */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Generated Proposal Draft
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingDraft(!isEditingDraft)}
                    className="text-xs text-blue-800 hover:text-blue-950 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{isEditingDraft ? 'Done Editing' : 'Amend Details'}</span>
                  </button>
                </div>

                {isEditingDraft ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">Project Title</label>
                      <input
                        type="text"
                        value={parsedDraft.projectTitle || ''}
                        onChange={(e) => setParsedDraft({ ...parsedDraft, projectTitle: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">Scope Narrative</label>
                      <textarea
                        rows={3}
                        value={parsedDraft.projectScopeSummary || ''}
                        onChange={(e) => setParsedDraft({ ...parsedDraft, projectScopeSummary: e.target.value })}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded leading-relaxed"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{parsedDraft.projectTitle}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {parsedDraft.projectScopeSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* Client & Timeline Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white border border-slate-200 rounded-lg p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                    <User className="w-3 h-3" /> Client Info
                  </div>
                  <p className="font-bold text-slate-900">
                    {parsedDraft.clientName || 'Valued Client'}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    {parsedDraft.phone} {parsedDraft.email ? `· ${parsedDraft.email}` : ''}
                  </p>
                  <p className="text-slate-600 text-[11px] flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{parsedDraft.serviceAddress || 'Address on file'}</span>
                  </p>
                </div>

                <div className="space-y-1 sm:border-l sm:border-slate-100 sm:pl-3">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                    <Calendar className="w-3 h-3" /> Timeline & Deposit
                  </div>
                  <p className="text-slate-700">
                    <span className="text-slate-400">Target Start:</span>{' '}
                    <span className="font-medium font-mono text-slate-900">
                      {parsedDraft.estimatedStartDate || 'Upcoming'}
                    </span>
                  </p>
                  <p className="text-slate-700">
                    <span className="text-slate-400">Duration:</span>{' '}
                    <span className="font-medium text-slate-900">
                      {parsedDraft.estimatedDuration || '1-2 Days'}
                    </span>
                  </p>
                  <p className="text-slate-700">
                    <span className="text-slate-400">Required Deposit:</span>{' '}
                    <span className="font-semibold text-blue-900 font-mono">
                      {parsedDraft.depositRequiredPercent || 30}%
                    </span>
                  </p>
                </div>
              </div>

              {/* Items Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
                    {parsedDraft.isTiered ? 'Generated 3-Tier Option Packages' : 'Parsed Line Items'}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Values in {business.currencySymbol} USD
                  </span>
                </div>

                {parsedDraft.isTiered && parsedDraft.tiers ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {parsedDraft.tiers.map((t: any, idx: number) => {
                      const tierTotal = (t.items || []).reduce(
                        (sum: number, i: any) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
                        0
                      );
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                            t.isRecommended
                              ? 'bg-blue-50/50 border-blue-900'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{t.name}</span>
                            {t.isRecommended && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{t.tagline}</p>
                          <p className="font-mono font-bold text-slate-900 text-sm pt-1">
                            {formatCurrency(tierTotal, business.currencySymbol)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {t.items?.length || 0} line items included
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Description</th>
                          <th className="py-2 px-3 text-right">Qty</th>
                          <th className="py-2 px-3 text-right">Rate</th>
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {(parsedDraft.singleItems || []).map((item: any, idx: number) => {
                          const total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3">
                                <span className="font-semibold text-slate-900 block">
                                  {item.description}
                                </span>
                                <span className="text-[10px] text-slate-400 capitalize">
                                  {item.category?.replace('_', ' ')}
                                  {item.isOptional ? ' · Optional Add-on' : ''}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums">
                                {item.quantity} <span className="text-[10px] text-slate-400">{item.unit}</span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums">
                                {formatCurrency(item.unitPrice, business.currencySymbol)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                                {formatCurrency(total, business.currencySymbol)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          {parsedDraft ? (
            <>
              <button
                type="button"
                onClick={() => setParsedDraft(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard & Start Over</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-md shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply & Populate Quote Form</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-[11px] text-slate-500">
                Tip: Mention hours, model names, client address or phone number for automatic form filling.
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoading || !promptText.trim()}
                  onClick={handleGenerate}
                  className="px-5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  <span>{isLoading ? 'Generating Draft...' : 'Generate Quote Draft'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
