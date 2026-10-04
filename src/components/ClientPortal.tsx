import React, { useState, useRef, useEffect } from 'react';
import { BusinessProfile, LineItem, ServiceQuote } from '../types';
import { calculateQuote, formatCurrency } from '../utils/calculations';
import {
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Clock,
  Printer,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  PenTool,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Share2,
} from 'lucide-react';

interface ClientPortalProps {
  quote: ServiceQuote;
  business: BusinessProfile;
  onUpdateQuote: (updated: ServiceQuote) => void;
  onBackToDashboard: () => void;
  onOpenShareModal: (quote: ServiceQuote) => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  quote,
  business,
  onUpdateQuote,
  onBackToDashboard,
  onOpenShareModal,
}) => {
  // Local state for client interaction
  const [selectedTierId, setSelectedTierId] = useState<string>(
    quote.selectedTierId || (quote.tiers && quote.tiers[0]?.id) || ''
  );

  // Optional items toggled by customer
  const [optionalItemIds, setOptionalItemIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const items = quote.isTiered
      ? (quote.tiers?.find((t) => t.id === (quote.selectedTierId || quote.tiers?.[0]?.id))?.items || [])
      : quote.singleItems;
    items.forEach((item) => {
      if (item.isOptional) {
        initial[item.id] = !!item.selected;
      }
    });
    return initial;
  });

  // Signature modal state
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState(quote.client.name || '');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('type');
  const [typedSignature, setTypedSignature] = useState(quote.client.name || '');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Canvas ref for signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Prepare quote clone for live calculation with customer selections
  const activeQuote: ServiceQuote = React.useMemo(() => {
    let itemsCopy: LineItem[] = [];

    if (quote.isTiered && quote.tiers && quote.tiers.length > 0) {
      const activeTier = quote.tiers.find((t) => t.id === selectedTierId) || quote.tiers[0];
      itemsCopy = (activeTier?.items || []).map((item) => ({
        ...item,
        selected: item.isOptional ? !!optionalItemIds[item.id] : true,
      }));
    } else {
      itemsCopy = quote.singleItems.map((item) => ({
        ...item,
        selected: item.isOptional ? !!optionalItemIds[item.id] : true,
      }));
    }

    return {
      ...quote,
      selectedTierId,
      singleItems: quote.isTiered ? quote.singleItems : itemsCopy,
      tiers: quote.isTiered && quote.tiers
        ? quote.tiers.map((t) =>
            t.id === selectedTierId ? { ...t, items: itemsCopy } : t
          )
        : quote.tiers,
    };
  }, [quote, selectedTierId, optionalItemIds]);

  const calculations = calculateQuote(activeQuote, business.defaultTaxRate);

  // Initialize canvas when modal opens
  useEffect(() => {
    if (showSignModal && signatureMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [showSignModal, signatureMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const handleToggleOptionalItem = (itemId: string) => {
    setOptionalItemIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleConfirmSignature = () => {
    if (!signerName.trim()) {
      alert('Please enter your full legal name.');
      return;
    }
    if (!acceptTerms) {
      alert('Please agree to the terms and conditions.');
      return;
    }

    let signatureData = '';
    if (signatureMode === 'draw' && canvasRef.current && hasDrawn) {
      signatureData = canvasRef.current.toDataURL('image/png');
    } else {
      signatureData = `typed:${typedSignature || signerName}`;
    }

    const updated: ServiceQuote = {
      ...activeQuote,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      clientSignature: {
        signerName: signerName.trim(),
        signedAt: new Date().toISOString(),
        signatureDataUrl: signatureData,
        termsAccepted: true,
      },
    };

    onUpdateQuote(updated);
    setShowSignModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const isAccepted = quote.status === 'accepted' || quote.status === 'invoiced';

  // Active items for display
  const displayItems = quote.isTiered
    ? (quote.tiers?.find((t) => t.id === selectedTierId)?.items || [])
    : activeQuote.singleItems;

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10">
      {/* Top action rail (hidden in print) */}
      <div className="no-print max-w-4xl mx-auto px-4 mb-4 flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-2xs cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Contractor Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenShareModal(quote)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-2xs cursor-pointer transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Share Link</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-2xs cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Proposal Document Container */}
      <main className="print-container max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
        {/* Proposal Header Banner */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Official Service Proposal
                </span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-xs text-blue-300 font-medium">
                  {quote.quoteNumber}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {business.name}
              </h1>
              <p className="text-xs text-slate-300">{business.tagline}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-slate-400">
                <span>{business.address}, {business.city}, {business.state} {business.zip}</span>
                <span>·</span>
                <span>{business.licenseNumber}</span>
              </div>
            </div>

            {/* Direct Contact Box */}
            <div className="bg-slate-800/80 rounded-lg p-3 text-xs text-slate-300 space-y-1.5 shrink-0 border border-slate-700/60">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono">{business.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>{business.email}</span>
              </div>
              <div className="pt-1 border-t border-slate-700 text-[11px] text-slate-400">
                {business.insuranceInfo}
              </div>
            </div>
          </div>
        </div>

        {/* Client & Project Overview */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Prepared For
              </p>
              <p className="text-base font-bold text-slate-900">{quote.client.name}</p>
              {quote.client.companyName && (
                <p className="text-xs text-slate-600 font-medium">{quote.client.companyName}</p>
              )}
              <p className="text-xs text-slate-600 mt-1">{quote.client.serviceAddress}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-mono">
                <span>{quote.client.phone}</span>
                <span>·</span>
                <span>{quote.client.email}</span>
              </div>
            </div>

            <div className="md:border-l md:border-slate-200 md:pl-6 space-y-2">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Project Title
                </p>
                <p className="text-sm font-bold text-slate-900">{quote.projectTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                <div>
                  <span className="text-slate-500 block">Date Issued</span>
                  <span className="font-mono text-slate-800">
                    {new Date(quote.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Valid Until</span>
                  <span className="font-mono text-slate-800">
                    {new Date(quote.validUntil).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {(quote.estimatedStartDate || quote.estimatedDuration) && (
                <div className="flex items-center gap-4 pt-1 text-xs text-slate-600">
                  {quote.estimatedStartDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Starts: {quote.estimatedStartDate}</span>
                    </div>
                  )}
                  {quote.estimatedDuration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Duration: {quote.estimatedDuration}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Scope Narrative */}
          {quote.projectScopeSummary && (
            <div className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900 block mb-1">
                Scope of Work & Specification:
              </span>
              <p>{quote.projectScopeSummary}</p>
            </div>
          )}
        </div>

        {/* Tiered Option Selector (If applicable) */}
        {quote.isTiered && quote.tiers && quote.tiers.length > 0 && (
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-white">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Select Your Service Package
              </h2>
              <p className="text-xs text-slate-500">
                Review and select the package option that best fits your requirements and budget.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quote.tiers.map((tier) => {
                const isSelected = selectedTierId === tier.id;
                // Calculate quick subtotal for tier
                const tierItemsTotal = tier.items.reduce(
                  (sum, i) => sum + (i.quantity || 0) * (i.unitPrice || 0),
                  0
                );

                return (
                  <div
                    key={tier.id}
                    onClick={() => !isAccepted && setSelectedTierId(tier.id)}
                    className={`relative rounded-lg p-4 border transition-all text-left ${
                      isSelected
                        ? 'border-blue-900 bg-blue-50/40 shadow-xs ring-1 ring-blue-900'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    } ${!isAccepted ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {tier.isRecommended && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm mb-2">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Recommended Choice</span>
                      </div>
                    )}
                    <h3 className="text-sm font-bold text-slate-900">{tier.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tier.tagline}</p>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                        {formatCurrency(tierItemsTotal, business.currencySymbol)}
                      </span>
                      {tier.warrantyYears && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {tier.warrantyYears}-Yr Warranty
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600">
                      {isSelected ? (
                        <span className="font-semibold text-blue-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selected Option
                        </span>
                      ) : (
                        <span className="text-slate-400">Click to select</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Itemized Line Items Table */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Itemized Scope & Pricing
            </h2>
            <span className="text-xs text-slate-500">
              Values in {business.currencySymbol} USD
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayItems.map((item) => {
                  const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                  const isChecked = item.isOptional ? !!optionalItemIds[item.id] : true;

                  return (
                    <tr
                      key={item.id}
                      className={item.isOptional ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-start gap-2">
                          {item.isOptional && (
                            <input
                              type="checkbox"
                              disabled={isAccepted}
                              checked={isChecked}
                              onChange={() => handleToggleOptionalItem(item.id)}
                              className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                              title="Toggle optional item"
                            />
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {item.description}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="capitalize">{item.category.replace('_', ' ')}</span>
                              {item.isOptional && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-700 font-medium">
                                    Optional Add-on {isChecked ? '(Included)' : '(Unchecked)'}
                                  </span>
                                </>
                              )}
                              {item.taxable && (
                                <>
                                  <span>·</span>
                                  <span>Taxable</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {item.quantity} <span className="text-[11px] text-slate-500">{item.unit}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {formatCurrency(item.unitPrice, business.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {item.isOptional && !isChecked ? (
                          <span className="text-slate-400 line-through">
                            {formatCurrency(lineTotal, business.currencySymbol)}
                          </span>
                        ) : (
                          formatCurrency(lineTotal, business.currencySymbol)
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary Calculation Grid */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
            {/* Warranty & Guarantee Callout */}
            <div className="max-w-sm text-xs text-slate-600 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Craftsmanship Guarantee</p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {quote.warrantyTerms || business.defaultWarrantyTerms}
                  </p>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(calculations.subtotal, business.currencySymbol)}
                </span>
              </div>

              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>
                    Discount {quote.discountType === 'percent' ? `(${quote.discountValue}%)` : ''}
                  </span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(calculations.discountAmount, business.currencySymbol)}
                  </span>
                </div>
              )}

              {calculations.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>
                    Estimated Sales Tax (
                    {quote.customTaxRate !== undefined ? quote.customTaxRate : business.defaultTaxRate}%)
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(calculations.taxAmount, business.currencySymbol)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Investment</span>
                <span className="font-mono tabular-nums text-base">
                  {formatCurrency(calculations.total, business.currencySymbol)}
                </span>
              </div>

              {calculations.depositRequired > 0 && (
                <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>
                      Deposit Due to Schedule ({quote.depositRequiredPercent}%)
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatCurrency(calculations.depositRequired, business.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Balance Upon Completion</span>
                    <span className="font-mono tabular-nums">
                      {formatCurrency(calculations.balanceDue, business.currencySymbol)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="p-6 sm:p-8 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-600 space-y-3">
          <p className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
            Terms & Payment Agreement
          </p>
          <p className="leading-relaxed">
            {quote.termsAndConditions || business.defaultPaymentTerms}
          </p>
          {quote.notesToCustomer && (
            <div className="p-3 bg-white rounded border border-slate-200 text-slate-700 text-xs">
              <span className="font-semibold text-slate-900">Special Notes: </span>
              {quote.notesToCustomer}
            </div>
          )}
        </div>

        {/* Acceptance / Signature Area */}
        <div className="p-6 sm:p-8 border-t border-slate-200 bg-white">
          {isAccepted && quote.clientSignature ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-950">
                    Quote Accepted & Confirmed
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Signed by <span className="font-semibold">{quote.clientSignature.signerName}</span> on{' '}
                    <span className="font-mono">
                      {new Date(quote.clientSignature.signedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>.
                  </p>

                  {/* Render signature */}
                  <div className="mt-3 pt-3 border-t border-emerald-200/60">
                    <p className="text-[11px] font-semibold text-emerald-900 mb-1">
                      Digital Signature on Record:
                    </p>
                    {quote.clientSignature.signatureDataUrl?.startsWith('data:image') ? (
                      <img
                        src={quote.clientSignature.signatureDataUrl}
                        alt="Client Signature"
                        className="h-14 max-w-xs border border-emerald-200 bg-white rounded p-1"
                      />
                    ) : (
                      <p className="text-xl font-serif italic text-emerald-950 px-2 py-1 bg-white/70 rounded border border-emerald-200 inline-block">
                        {quote.clientSignature.signatureDataUrl?.replace('typed:', '') || quote.clientSignature.signerName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-print rounded-lg border border-slate-200 bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ready to proceed with this proposal?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sign digitally to lock in your scheduled date. An automatic confirmation copy will be emailed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSignModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Sign & Accept Proposal</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Signature Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sign & Authorize Proposal</h3>
                <p className="text-xs text-slate-500">{quote.projectTitle}</p>
              </div>
              <button
                onClick={() => setShowSignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Total recap */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500 block">Total Investment</span>
                <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                  {formatCurrency(calculations.total, business.currencySymbol)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Deposit Due Upon Acceptance</span>
                <span className="font-mono font-bold text-sm text-blue-900 tabular-nums">
                  {formatCurrency(calculations.depositRequired, business.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Legal Signer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Signer Full Legal Name *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => {
                  setSignerName(e.target.value);
                  setTypedSignature(e.target.value);
                }}
                placeholder="e.g. Eleanor Vance"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 text-slate-900"
              />
            </div>

            {/* Mode selector */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setSignatureMode('type')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                  signatureMode === 'type'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Type Signature
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('draw')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                  signatureMode === 'draw'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Draw with Mouse / Finger
              </button>
            </div>

            {/* Signature Area */}
            {signatureMode === 'type' ? (
              <div className="p-4 border border-slate-300 rounded-md bg-slate-50/50 text-center min-h-[90px] flex items-center justify-center">
                <p className="text-2xl font-serif italic text-slate-900 tracking-wide">
                  {typedSignature || 'Your Signature Here'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative border border-slate-300 rounded-md bg-white">
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[120px] touch-none cursor-crosshair"
                  />
                  {!hasDrawn && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 pointer-events-none">
                      Draw your signature above
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Clear canvas
                </button>
              </div>
            )}

            {/* Agreement checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                />
                <span>
                  I confirm that I am authorized to approve this project proposal, and I agree to the specifications,
                  payment terms, and warranty disclaimers outlined above.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!signerName.trim() || !acceptTerms}
                onClick={handleConfirmSignature}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-xs cursor-pointer"
              >
                Confirm & Sign Agreement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
