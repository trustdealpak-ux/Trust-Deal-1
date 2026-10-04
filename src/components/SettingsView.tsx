import React, { useState } from 'react';
import {
  BusinessProfile,
  CatalogTemplate,
  ClientRecord,
  ServiceQuote,
  TradeType,
} from '../types';
import { resetToDemoData } from '../utils/storage';
import {
  Building2,
  Shield,
  Percent,
  DollarSign,
  Check,
  RotateCcw,
  Palette,
  Webhook,
  Code2,
  Copy,
  ExternalLink,
  Download,
  Upload,
  Send,
  Plus,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileJson,
} from 'lucide-react';

interface SettingsViewProps {
  business: BusinessProfile;
  businesses: BusinessProfile[];
  onUpdateBusiness: (updated: BusinessProfile) => void;
  onOpenNewCompanyModal?: () => void;
  quotes?: ServiceQuote[];
  clients?: ClientRecord[];
  templates?: CatalogTemplate[];
  onImportFullArchive?: (archive: {
    business: BusinessProfile;
    quotes: ServiceQuote[];
    clients: ClientRecord[];
    templates: CatalogTemplate[];
  }) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  business,
  businesses,
  onUpdateBusiness,
  onOpenNewCompanyModal,
  quotes = [],
  clients = [],
  templates = [],
  onImportFullArchive,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'integrations'>('profile');
  const [formData, setFormData] = useState<BusinessProfile>({ ...business });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Webhook settings state (persisted per business)
  const webhookStorageKey = `quoteforge_webhook_${business.id}`;
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem(webhookStorageKey) || '';
  });
  const [webhookEvents, setWebhookEvents] = useState({
    created: true,
    sent: true,
    viewed: true,
    accepted: true,
  });
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean;
    status: number;
    message: string;
    payload?: any;
  } | null>(null);

  // Embed snippet state
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedApiSnippet, setCopiedApiSnippet] = useState(false);
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string | null>(null);

  // Sync if business changes
  React.useEffect(() => {
    setFormData({ ...business });
    const savedUrl = localStorage.getItem(`quoteforge_webhook_${business.id}`) || '';
    setWebhookUrl(savedUrl);
    setWebhookTestResult(null);
  }, [business.id]);

  const handleChange = (field: keyof BusinessProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusiness(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveWebhook = () => {
    localStorage.setItem(webhookStorageKey, webhookUrl.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) return;
    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    const samplePayload = {
      quoteId: quotes[0]?.id || `quote_test_7781`,
      quoteNumber: quotes[0]?.quoteNumber || 'Q-2026-001',
      business: {
        id: business.id,
        name: business.name,
        trade: business.trade,
      },
      client: {
        name: clients[0]?.name || 'Arthur Pendelton',
        email: clients[0]?.email || 'arthur@example.com',
        phone: clients[0]?.phone || '(555) 234-5678',
        address: clients[0]?.serviceAddress || '123 Main St, Oakland, CA',
      },
      projectTitle: quotes[0]?.projectTitle || 'High-Efficiency System Installation',
      status: 'accepted',
      totalAmount: 3850.0,
      currency: business.currencySymbol || '$',
      event: 'quote.accepted',
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/integrations/webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl.trim(),
          event: 'quote.accepted',
          payload: samplePayload,
        }),
      });

      const data = await res.json();
      setWebhookTestResult({
        success: data.success,
        status: data.status || 200,
        message: data.message || 'Webhook successfully dispatched.',
        payload: data.dispatchedPayload || samplePayload,
      });
    } catch (err: any) {
      setWebhookTestResult({
        success: false,
        status: 500,
        message: `Network test failed: ${err.message}`,
        payload: samplePayload,
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const embedCode = `<iframe 
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.app'}/?embed=quote&biz=${business.id}" 
  width="100%" 
  height="750px" 
  style="border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.06);" 
  title="${business.name} Client Proposal Portal"
  allow="clipboard-write"
></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 3000);
  };

  const apiCurlSnippet = `curl -X POST "${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.app'}/api/quotes" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer qf_live_${business.id.slice(0, 12)}" \\
  -d '{
    "businessId": "${business.id}",
    "client": {
      "name": "Sarah Miller",
      "email": "sarah@millerproperties.com",
      "phone": "(510) 555-0144",
      "serviceAddress": "742 Evergreen Terrace, Oakland, CA"
    },
    "projectTitle": "${business.trade.toUpperCase()}: Complete System Replacement",
    "status": "sent"
  }'`;

  const handleCopyApiSnippet = () => {
    navigator.clipboard.writeText(apiCurlSnippet);
    setCopiedApiSnippet(true);
    setTimeout(() => setCopiedApiSnippet(false), 3000);
  };

  const handleExportFullArchive = () => {
    const archive = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      business,
      quotes: quotes.filter((q) => q.businessId === business.id),
      clients: clients.filter((c) => c.businessId === business.id),
      templates: templates.filter((t) => t.trade === business.trade),
    };

    const json = JSON.stringify(archive, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedBiz = business.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.download = `${sanitizedBiz}_system_archive_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setArchiveSuccessMsg('Complete company JSON package downloaded. Portable to any CRM, accounting software, or database.');
    setTimeout(() => setArchiveSuccessMsg(null), 5000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Company Workspace Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {business.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{business.name}</h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-800 rounded-md border border-blue-200 capitalize">
                {business.trade}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Workspace ID: <span className="font-mono text-slate-600">{business.id}</span> ·{' '}
              {business.licenseNumber || 'Licensed Contractor'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenNewCompanyModal && (
            <button
              type="button"
              onClick={onOpenNewCompanyModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Company</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center border-b border-slate-200 gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'profile'
              ? 'border-blue-900 text-blue-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profile & Legal Defaults</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('integrations')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'integrations'
              ? 'border-blue-900 text-blue-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Webhook className="w-4 h-4 text-indigo-600" />
          <span>Integrations, Webhooks & Developer API</span>
          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
            Universal Sync
          </span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Changes saved successfully to your company workspace and Firestore database.</span>
        </div>
      )}

      {archiveSuccessMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>{archiveSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: Business Profile & Legal Defaults */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Company Identity */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Company Identity & Trade
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Legal / DBA Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Trade Specialty
                </label>
                <select
                  value={formData.trade}
                  onChange={(e) => handleChange('trade', e.target.value as TradeType)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white capitalize"
                >
                  <option value="plumbing">Plumbing & Mechanical</option>
                  <option value="electrical">Electrical</option>
                  <option value="hvac">HVAC & Heat Pumps</option>
                  <option value="landscaping">Landscaping & Tree Service</option>
                  <option value="painting">Painting & Drywall</option>
                  <option value="roofing">Roofing & Gutters</option>
                  <option value="cleaning">Cleaning & Remediation</option>
                  <option value="handyman">Handyman Services</option>
                  <option value="auto_detailing">Auto Detailing</option>
                  <option value="general_contracting">General Contracting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Tagline / Specialty
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="e.g. Master Licensed Plumber"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimates / Contact Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Zip</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => handleChange('zip', e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Licenses & Insurance */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Licenses, Bonding & Insurance
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State Contractor License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  placeholder="e.g. CA C-36 Lic #1094821"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Insurance / Bond Verification
                </label>
                <input
                  type="text"
                  value={formData.insuranceInfo}
                  onChange={(e) => handleChange('insuranceInfo', e.target.value)}
                  placeholder="e.g. $2,000,000 General Liability Bonded"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Financial & Proposal Agreement Defaults */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Financial Calculations & Default Disclaimers
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Sales Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={formData.defaultTaxRate}
                  onChange={(e) => handleChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Upfront Deposit (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.defaultDepositPercent}
                  onChange={(e) =>
                    handleChange('defaultDepositPercent', parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Payment Agreement Text
                </label>
                <textarea
                  rows={2}
                  value={formData.defaultPaymentTerms}
                  onChange={(e) => handleChange('defaultPaymentTerms', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Craftsmanship Warranty Text
                </label>
                <textarea
                  rows={2}
                  value={formData.defaultWarrantyTerms}
                  onChange={(e) => handleChange('defaultWarrantyTerms', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3">
            <button
              type="button"
              onClick={resetToDemoData}
              className="text-xs text-rose-700 hover:text-rose-900 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database to Demo Seed</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Profile Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Integrations, Webhooks & Developer API */}
      {activeSubTab === 'integrations' && (
        <div className="space-y-6">
          {/* Webhook Automation Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                  <Webhook className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Webhook Automations (Zapier, Make, n8n, Slack, Custom CRM)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Receive immediate JSON event payloads whenever a quote is created, sent, viewed, or approved.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
                Live Dispatch Ready
              </span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Webhook Target Endpoint URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/... or https://api.yourcrm.com/webhooks/quotes"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={handleSaveWebhook}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  Save URL
                </button>
                <button
                  type="button"
                  disabled={!webhookUrl.trim() || isTestingWebhook}
                  onClick={handleTestWebhook}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTestingWebhook ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Test Ping</span>
                </button>
              </div>

              {/* Event Subscriptions */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Subscribed Event Triggers
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.created}
                      onChange={(e) =>
                        setWebhookEvents((prev) => ({ ...prev, created: e.target.checked }))
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 block">quote.created</span>
                      <span className="text-[10px] text-slate-500">Draft created</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.sent}
                      onChange={(e) =>
                        setWebhookEvents((prev) => ({ ...prev, sent: e.target.checked }))
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 block">quote.sent</span>
                      <span className="text-[10px] text-slate-500">Transmitted to client</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.viewed}
                      onChange={(e) =>
                        setWebhookEvents((prev) => ({ ...prev, viewed: e.target.checked }))
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 block">quote.viewed</span>
                      <span className="text-[10px] text-slate-500">Homeowner opened</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.accepted}
                      onChange={(e) =>
                        setWebhookEvents((prev) => ({ ...prev, accepted: e.target.checked }))
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    <div>
                      <span className="font-semibold text-emerald-900 block">quote.accepted</span>
                      <span className="text-[10px] text-emerald-700">Contract e-signed</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Webhook Test Diagnostic Panel */}
              {webhookTestResult && (
                <div
                  className={`mt-3 p-3.5 rounded-lg border text-xs space-y-2 ${
                    webhookTestResult.success
                      ? 'bg-slate-900 text-white border-slate-800'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{webhookTestResult.message}</span>
                    </span>
                    <span className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      HTTP {webhookTestResult.status}
                    </span>
                  </div>

                  <details className="mt-2 text-[11px]">
                    <summary className="cursor-pointer text-slate-400 hover:text-slate-200 font-mono">
                      View Dispatched JSON Payload
                    </summary>
                    <pre className="mt-2 p-2.5 bg-slate-950 rounded border border-slate-800 text-emerald-400 overflow-x-auto font-mono text-[10px]">
                      {JSON.stringify(webhookTestResult.payload, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>

          {/* 1-Click Website Embed Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Website Embed Widget (WordPress, Squarespace, Wix, Shopify)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Embed an interactive client proposal viewer or instant quote generator directly on your company website.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyEmbed}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer w-fit"
              >
                {copiedEmbed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Embed Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto">
                {embedCode}
              </pre>
              <p className="text-[11px] text-slate-500">
                Paste this snippet anywhere in your CMS (Custom HTML block). It adapts automatically to mobile screens and enables homeowners to review proposals without leaving your company domain.
              </p>
            </div>
          </div>

          {/* Developer REST API Specification */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Programmatic REST API & External CRM Integration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connect backend databases, mobile apps, or custom order management platforms.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyApiSnippet}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer w-fit"
              >
                {copiedApiSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">cURL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy cURL Command</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-200 overflow-x-auto">
                {apiCurlSnippet}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="font-bold text-slate-900 block font-mono">POST /api/quotes</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Auto-creates proposals from lead forms or external dispatch tools.
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="font-bold text-slate-900 block font-mono">GET /api/clients</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Synchronizes customer records with accounting software.
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="font-bold text-slate-900 block font-mono">POST /api/integrations/webhook/test</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Validates real-time delivery to your external endpoint.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full System Data Portability & Archive */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Full System Data Portability & Archive (JSON)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Export your entire business workspace (quotes, client records, price book templates, and company profile) in a single portable JSON file.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportFullArchive}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors cursor-pointer w-fit"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full Company JSON</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              You always own your data. This complete archive allows any new company to backup or migrate between systems, accounting software, and internal databases with zero lock-in.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
