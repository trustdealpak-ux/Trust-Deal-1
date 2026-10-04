import React, { useState } from 'react';
import { BusinessProfile, ServiceQuote } from '../types';
import { calculateQuote, formatCurrency } from '../utils/calculations';
import { Copy, Check, MessageSquare, Mail, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  quote: ServiceQuote;
  business: BusinessProfile;
  onClose: () => void;
  onOpenPortal: (quote: ServiceQuote) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  quote,
  business,
  onClose,
  onOpenPortal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const calc = calculateQuote(quote, business.defaultTaxRate);
  const formattedTotal = formatCurrency(calc.total, business.currencySymbol);

  // Link simulation (in real SaaS this is customer review link)
  const shareUrl = `${window.location.origin}/quote/${quote.id}`;

  const smsText = `Hi ${quote.client.name.split(' ')[0]}, your service proposal (${quote.quoteNumber}) from ${business.name} for ${quote.projectTitle} is ready: ${shareUrl}. Total: ${formattedTotal}. Review & sign online anytime. Questions? Call ${business.phone}.`;

  const emailSubject = `Service Proposal: ${quote.projectTitle} (${quote.quoteNumber}) - ${business.name}`;
  const emailBody = `Dear ${quote.client.name},

Thank you for the opportunity to estimate your project. We have prepared an itemized proposal for:

Project: ${quote.projectTitle}
Proposal #: ${quote.quoteNumber}
Investment: ${formattedTotal}

You can view the full scope of work, warranty details, and approve the proposal online using your secure client portal link:
${shareUrl}

If you have any questions or require adjustments, please don't hesitate to contact our team directly at ${business.phone} or ${business.email}.

Best regards,
${business.name}
${business.licenseNumber}
${business.phone}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopySms = async () => {
    try {
      await navigator.clipboard.writeText(smsText);
      setCopiedSms(true);
      setTimeout(() => setCopiedSms(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Send & Share Quote</h3>
            <p className="text-xs text-slate-500">
              {quote.quoteNumber} · {quote.client.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Share Link Row */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Client Interactive Portal Link
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-mono text-slate-700 select-all"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPortal(quote);
              }}
              className="px-3 py-2 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Open customer view directly"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* 1-Click SMS Draft */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Text / SMS Message Template</span>
            </label>
            <button
              type="button"
              onClick={handleCopySms}
              className="text-[11px] text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              {copiedSms ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSms ? 'Copied SMS text' : 'Copy message'}</span>
            </button>
          </div>
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-700 font-sans leading-relaxed">
            {smsText}
          </div>
        </div>

        {/* 1-Click Email Template */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Professional Email Draft</span>
            </label>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="text-[11px] text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedEmail ? 'Copied email' : 'Copy email'}</span>
            </button>
          </div>
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-slate-900">Subject: {emailSubject}</p>
            <pre className="whitespace-pre-wrap font-sans text-slate-600 text-[11px] mt-1">
              {emailBody}
            </pre>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
