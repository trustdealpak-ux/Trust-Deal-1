import React, { useState } from 'react';
import {
  BusinessProfile,
  CatalogTemplate,
  ClientRecord,
  LineItem,
  LineItemCategory,
  QuoteTier,
  ServiceQuote,
  UnitType,
} from '../types';
import { calculateItemsTotals, formatCurrency } from '../utils/calculations';
import { CatalogPickerModal } from './CatalogPickerModal';
import { AIQuoteAssistantModal } from './AIQuoteAssistantModal';
import { AIQuoteAuditorModal } from './AIQuoteAuditorModal';
import { AIPhotoEstimatorModal } from './AIPhotoEstimatorModal';
import { AIFollowUpDrawer } from './AIFollowUpDrawer';
import {
  Plus,
  Trash2,
  BookOpen,
  Eye,
  Check,
  Percent,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  Clock,
  Sparkles,
  Wand2,
  Users,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Camera,
  MessageSquare,
} from 'lucide-react';

interface QuoteBuilderProps {
  initialQuote?: ServiceQuote | null;
  business: BusinessProfile;
  catalogTemplates: CatalogTemplate[];
  clients?: ClientRecord[];
  onSaveClient?: (client: ClientRecord) => void;
  onSaveQuote: (quote: ServiceQuote, action: 'save' | 'preview' | 'send') => void;
  onCancel: () => void;
  onOpenFollowUpRadar?: (quote: ServiceQuote) => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  initialQuote,
  business,
  catalogTemplates,
  clients = [],
  onSaveClient,
  onSaveQuote,
  onCancel,
}) => {
  // Quote core fields
  const [quoteNumber, setQuoteNumber] = useState(
    initialQuote?.quoteNumber || `Q-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [validDays, setValidDays] = useState(30);
  const [status] = useState(initialQuote?.status || 'draft');

  // Client info
  const [clientName, setClientName] = useState(initialQuote?.client.name || '');
  const [companyName, setCompanyName] = useState(initialQuote?.client.companyName || '');
  const [clientEmail, setClientEmail] = useState(initialQuote?.client.email || '');
  const [clientPhone, setClientPhone] = useState(initialQuote?.client.phone || '');
  const [serviceAddress, setServiceAddress] = useState(initialQuote?.client.serviceAddress || '');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSaveStatus, setClientSaveStatus] = useState<string | null>(null);

  // Sync client state if initialQuote changes
  React.useEffect(() => {
    if (initialQuote) {
      setQuoteNumber(initialQuote.quoteNumber);
      setClientName(initialQuote.client.name || '');
      setCompanyName(initialQuote.client.companyName || '');
      setClientEmail(initialQuote.client.email || '');
      setClientPhone(initialQuote.client.phone || '');
      setServiceAddress(initialQuote.client.serviceAddress || '');
      setProjectTitle(initialQuote.projectTitle || '');
      setProjectScopeSummary(initialQuote.projectScopeSummary || '');
      if (initialQuote.singleItems && initialQuote.singleItems.length > 0) {
        setSingleItems(initialQuote.singleItems);
      }
      if (initialQuote.tiers && initialQuote.tiers.length > 0) {
        setTiers(initialQuote.tiers);
      }
    }
  }, [initialQuote]);

  // Project info
  const [projectTitle, setProjectTitle] = useState(
    initialQuote?.projectTitle || ''
  );
  const [projectScopeSummary, setProjectScopeSummary] = useState(
    initialQuote?.projectScopeSummary || ''
  );
  const [estimatedStartDate, setEstimatedStartDate] = useState(
    initialQuote?.estimatedStartDate || ''
  );
  const [estimatedDuration, setEstimatedDuration] = useState(
    initialQuote?.estimatedDuration || '1-2 Days'
  );

  // Mode: Single Scope vs 3-Tier Options
  const [isTiered, setIsTiered] = useState(initialQuote?.isTiered || false);

  // Single line items
  const [singleItems, setSingleItems] = useState<LineItem[]>(() => {
    if (initialQuote?.singleItems && initialQuote.singleItems.length > 0) {
      return initialQuote.singleItems;
    }
    // Default starter item
    return [
      {
        id: `item_${Date.now()}_1`,
        category: 'labor',
        description: 'Licensed Trade Journeyman Labor & System Diagnostic',
        quantity: 3,
        unit: 'hours',
        unitPrice: 165.0,
        unitCost: 75.0,
        taxable: false,
        isOptional: false,
        selected: true,
      },
      {
        id: `item_${Date.now()}_2`,
        category: 'materials',
        description: 'Primary Replacement Unit & Premium Copper/Brass Fittings',
        quantity: 1,
        unit: 'units',
        unitPrice: 850.0,
        unitCost: 450.0,
        taxable: true,
        isOptional: false,
        selected: true,
      },
    ];
  });

  // Tiers (if tiered)
  const [tiers, setTiers] = useState<QuoteTier[]>(() => {
    if (initialQuote?.tiers && initialQuote.tiers.length > 0) {
      return initialQuote.tiers;
    }
    return [
      {
        id: 'tier_good',
        name: 'Good: Essential Scope',
        tagline: 'Direct repair & standard components to restore full operation.',
        isRecommended: false,
        warrantyYears: 1,
        items: [
          {
            id: 'tg_1',
            category: 'labor',
            description: 'Standard Labor & Diagnostic Assessment',
            quantity: 3,
            unit: 'hours',
            unitPrice: 165,
            unitCost: 75,
            taxable: false,
          },
          {
            id: 'tg_2',
            category: 'materials',
            description: 'Standard Grade OEM Replacement Unit',
            quantity: 1,
            unit: 'units',
            unitPrice: 750,
            unitCost: 420,
            taxable: true,
          },
        ],
      },
      {
        id: 'tier_better',
        name: 'Better: High Efficiency',
        tagline: 'Recommended: Upgraded performance, longer lifespan & energy savings.',
        isRecommended: true,
        warrantyYears: 3,
        items: [
          {
            id: 'tb_1',
            category: 'labor',
            description: 'Precision Installation & System Optimization',
            quantity: 5,
            unit: 'hours',
            unitPrice: 165,
            unitCost: 75,
            taxable: false,
          },
          {
            id: 'tb_2',
            category: 'materials',
            description: 'High-Efficiency Premium System Unit',
            quantity: 1,
            unit: 'units',
            unitPrice: 1450,
            unitCost: 820,
            taxable: true,
          },
          {
            id: 'tb_3',
            category: 'permits_equipment',
            description: 'Municipal Permit Submission & Inspection Handling',
            quantity: 1,
            unit: 'flat rate',
            unitPrice: 285,
            unitCost: 195,
            taxable: false,
          },
        ],
      },
      {
        id: 'tier_best',
        name: 'Best: Complete Turnkey System',
        tagline: 'Maximum durability, extended warranty, and comprehensive protection.',
        isRecommended: false,
        warrantyYears: 10,
        items: [
          {
            id: 'tbest_1',
            category: 'labor',
            description: 'Master Installation & White-Glove System Commissioning',
            quantity: 7,
            unit: 'hours',
            unitPrice: 165,
            unitCost: 75,
            taxable: false,
          },
          {
            id: 'tbest_2',
            category: 'materials',
            description: 'Commercial Ultra-Grade Unit + Surge & Scale Protection',
            quantity: 1,
            unit: 'units',
            unitPrice: 2150,
            unitCost: 1180,
            taxable: true,
          },
          {
            id: 'tbest_3',
            category: 'permits_equipment',
            description: 'Full City Permitting & Inspection Coordination',
            quantity: 1,
            unit: 'flat rate',
            unitPrice: 285,
            unitCost: 195,
            taxable: false,
          },
        ],
      },
    ];
  });
  const [activeTierTab, setActiveTierTab] = useState<string>('tier_better');

  // Financial modifiers
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed'>(
    initialQuote?.discountType || 'none'
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialQuote?.discountValue || 0
  );
  const [taxRate, setTaxRate] = useState<number>(
    initialQuote?.customTaxRate !== undefined ? initialQuote.customTaxRate : business.defaultTaxRate
  );
  const [depositPercent, setDepositPercent] = useState<number>(
    initialQuote?.depositRequiredPercent !== undefined
      ? initialQuote.depositRequiredPercent
      : business.defaultDepositPercent
  );

  // Terms and legal
  const [termsAndConditions, setTermsAndConditions] = useState(
    initialQuote?.termsAndConditions || business.defaultPaymentTerms
  );
  const [warrantyTerms, setWarrantyTerms] = useState(
    initialQuote?.warrantyTerms || business.defaultWarrantyTerms
  );
  const [notesToCustomer, setNotesToCustomer] = useState(
    initialQuote?.notesToCustomer || ''
  );

  // Catalog picker modal
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showAIAssistantModal, setShowAIAssistantModal] = useState(false);
  const [showAuditorModal, setShowAuditorModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showFollowUpDrawer, setShowFollowUpDrawer] = useState(false);
  const [isPolishingScope, setIsPolishingScope] = useState(false);

  const handleAddAuditorItem = (item: LineItem) => {
    if (isTiered) {
      setTiers((prev) =>
        prev.map((t) => (t.id === activeTierTab ? { ...t, items: [...t.items, item] } : t))
      );
    } else {
      setSingleItems((prev) => [...prev, item]);
    }
  };

  const handleApplyVisionItems = (newItems: LineItem[], recommendedScope?: string) => {
    if (isTiered) {
      setTiers((prev) =>
        prev.map((t) => (t.id === activeTierTab ? { ...t, items: [...t.items, ...newItems] } : t))
      );
    } else {
      setSingleItems((prev) => [...prev, ...newItems]);
    }
    if (recommendedScope && !projectScopeSummary) {
      setProjectScopeSummary(recommendedScope);
    }
  };

  const handlePolishScope = async () => {
    if (!projectScopeSummary.trim()) {
      alert('Please enter some rough scope notes first to polish.');
      return;
    }
    setIsPolishingScope(true);
    try {
      const res = await fetch('/api/ai/polish-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roughScope: projectScopeSummary,
          projectTitle,
          trade: business.trade,
        }),
      });
      const data = await res.json();
      if (data.polishedScope) {
        setProjectScopeSummary(data.polishedScope);
      }
    } catch (err) {
      console.error('Failed to polish scope:', err);
    } finally {
      setIsPolishingScope(false);
    }
  };

  const handleApplyAIDraft = (draft: any) => {
    if (draft.clientName) setClientName(draft.clientName);
    if (draft.companyName) setCompanyName(draft.companyName);
    if (draft.email) setClientEmail(draft.email);
    if (draft.phone) setClientPhone(draft.phone);
    if (draft.serviceAddress) setServiceAddress(draft.serviceAddress);
    if (draft.projectTitle) setProjectTitle(draft.projectTitle);
    if (draft.projectScopeSummary) setProjectScopeSummary(draft.projectScopeSummary);
    if (draft.estimatedStartDate) setEstimatedStartDate(draft.estimatedStartDate);
    if (draft.estimatedDuration) setEstimatedDuration(draft.estimatedDuration);
    if (draft.depositRequiredPercent) setDepositPercent(draft.depositRequiredPercent);
    if (draft.notesToCustomer) setNotesToCustomer(draft.notesToCustomer);

    if (draft.isTiered && draft.tiers && draft.tiers.length > 0) {
      setIsTiered(true);
      setTiers(draft.tiers);
      const recommended = draft.tiers.find((t: any) => t.isRecommended);
      setActiveTierTab(recommended ? recommended.id : draft.tiers[0].id);
    } else if (draft.singleItems && draft.singleItems.length > 0) {
      setIsTiered(false);
      setSingleItems(draft.singleItems);
    }
  };

  // Active items for live calculation
  const currentItems = isTiered
    ? (tiers.find((t) => t.id === activeTierTab)?.items || tiers[0]?.items || [])
    : singleItems;

  const calculations = calculateItemsTotals(
    currentItems,
    taxRate,
    discountType,
    discountValue,
    depositPercent
  );

  // Line item manipulation helpers
  const handleAddItem = (category: LineItemCategory = 'labor') => {
    const newItem: LineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      category,
      description: '',
      quantity: 1,
      unit: category === 'labor' ? 'hours' : 'units',
      unitPrice: 100,
      unitCost: 50,
      taxable: category === 'materials',
      isOptional: false,
      selected: true,
    };

    if (isTiered) {
      setTiers((prev) =>
        prev.map((t) => (t.id === activeTierTab ? { ...t, items: [...t.items, newItem] } : t))
      );
    } else {
      setSingleItems((prev) => [...prev, newItem]);
    }
  };

  const handleUpdateItem = (itemId: string, field: keyof LineItem, val: any) => {
    if (isTiered) {
      setTiers((prev) =>
        prev.map((t) =>
          t.id === activeTierTab
            ? {
                ...t,
                items: t.items.map((i) => (i.id === itemId ? { ...i, [field]: val } : i)),
              }
            : t
        )
      );
    } else {
      setSingleItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, [field]: val } : i))
      );
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (isTiered) {
      setTiers((prev) =>
        prev.map((t) =>
          t.id === activeTierTab
            ? { ...t, items: t.items.filter((i) => i.id !== itemId) }
            : t
        )
      );
    } else {
      setSingleItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const handleCatalogAdd = (newItems: LineItem[]) => {
    if (isTiered) {
      setTiers((prev) =>
        prev.map((t) =>
          t.id === activeTierTab ? { ...t, items: [...t.items, ...newItems] } : t
        )
      );
    } else {
      setSingleItems((prev) => [...prev, ...newItems]);
    }
  };

  // Compile final ServiceQuote object
  const buildQuoteObject = (): ServiceQuote => {
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validDays);

    return {
      id: initialQuote?.id || `quote_${Date.now()}`,
      quoteNumber: quoteNumber.trim() || `Q-${Date.now()}`,
      businessId: business.id,
      createdAt: initialQuote?.createdAt || new Date().toISOString(),
      validUntil: validUntilDate.toISOString().split('T')[0],
      status: initialQuote?.status || 'draft',
      client: {
        name: clientName.trim() || 'Valued Client',
        companyName: companyName.trim() || undefined,
        email: clientEmail.trim(),
        phone: clientPhone.trim(),
        serviceAddress: serviceAddress.trim(),
        billingAddressSame: true,
      },
      projectTitle: projectTitle.trim() || 'Service Project',
      projectScopeSummary: projectScopeSummary.trim(),
      isTiered,
      singleItems: isTiered ? [] : singleItems,
      tiers: isTiered ? tiers : undefined,
      selectedTierId: isTiered ? activeTierTab : undefined,
      discountType,
      discountValue: Number(discountValue) || 0,
      customTaxRate: Number(taxRate) || 0,
      depositRequiredPercent: Number(depositPercent) || 0,
      estimatedStartDate: estimatedStartDate || undefined,
      estimatedDuration: estimatedDuration || undefined,
      termsAndConditions,
      warrantyTerms,
      notesToCustomer,
      clientSignature: initialQuote?.clientSignature,
      sentAt: initialQuote?.sentAt,
      viewedAt: initialQuote?.viewedAt,
      acceptedAt: initialQuote?.acceptedAt,
    };
  };

  const handleSubmit = (action: 'save' | 'preview' | 'send') => {
    if (!clientName.trim()) {
      alert('Please provide the client name.');
      return;
    }
    if (!projectTitle.trim()) {
      alert('Please enter a project title.');
      return;
    }
    const compiled = buildQuoteObject();
    if (action === 'send' && compiled.status === 'draft') {
      compiled.status = 'sent';
      compiled.sentAt = new Date().toISOString();
    }
    onSaveQuote(compiled, action);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              {initialQuote ? 'Edit Existing Quote' : 'New Service Proposal'}
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-xs text-blue-900 font-semibold">
              {quoteNumber}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {projectTitle || 'Untitled Project Scope'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Vision Estimator */}
          <button
            type="button"
            onClick={() => setShowPhotoModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-md inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Upload or pick a job site photo to auto-detect materials & equipment"
          >
            <Camera className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">Photo Estimator</span>
            <span className="sm:hidden">Photo</span>
          </button>

          {/* AI Intelligence & Risk Auditor */}
          <button
            type="button"
            onClick={() => setShowAuditorModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Audit missing items, code compliance, liability risks, and win probability"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>AI Quote Audit</span>
          </button>

          {/* AI Follow-Up Radar (for existing quote) */}
          {initialQuote && (
            <button
              type="button"
              onClick={() => setShowFollowUpDrawer(true)}
              className="px-3 py-1.5 text-xs font-semibold text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-md inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Autonomous multi-touch follow-up cadence & objection resolution"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-800" />
              <span>Follow-Up Closer</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAIAssistantModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            title="Write notes in simple language and let AI build the itemized quote draft"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-800" />
            <span>Draft with AI</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 bg-white border border-slate-300 rounded-md cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('preview')}
            className="px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 bg-white border border-slate-300 rounded-md inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Preview Proposal</span>
            <span className="sm:hidden">Preview</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('save')}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Quote</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('send')}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-md shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Save & Mark Sent</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Main Form (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Client & Project Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-900" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Client & Property Details
                </h2>
              </div>

              {/* Quick Auto-Fill Selector from Saved Database */}
              {clients && clients.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                    Auto-Fill Saved Client:
                  </span>
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedClientId(id);
                      const found = clients.find((c) => c.id === id);
                      if (found) {
                        setClientName(found.name);
                        setCompanyName(found.companyName || '');
                        setClientEmail(found.email);
                        setClientPhone(found.phone);
                        setServiceAddress(found.serviceAddress);
                        setClientSaveStatus(`Auto-filled from ${found.name}`);
                        setTimeout(() => setClientSaveStatus(null), 3500);
                      }
                    }}
                    className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-slate-50 hover:bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-900 max-w-[210px] truncate"
                  >
                    <option value="">-- Select Client from Database --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Notification / Auto-fill Feedback */}
            {clientSaveStatus && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>{clientSaveStatus}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setClientSaveStatus(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (selectedClientId) setSelectedClientId('');
                  }}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization (Optional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Hilltop Properties LLC"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Email Address
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="eleanor@example.com"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Phone / Mobile
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(510) 555-8392"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job / Service Property Address *
                </label>
                <input
                  type="text"
                  value={serviceAddress}
                  onChange={(e) => setServiceAddress(e.target.value)}
                  placeholder="1742 Skyline Blvd, Oakland, CA 94611"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            {/* Quick action to save this client into the database directory */}
            {onSaveClient && clientName.trim() && (
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                <span className="text-slate-500 text-[11px]">
                  Want to store this customer for future quotes?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!clientName.trim() || !serviceAddress.trim()) {
                      alert('Please provide at least a Client Name and Service Address to save.');
                      return;
                    }
                    const newClient: ClientRecord = {
                      id: selectedClientId || `client_${Date.now()}`,
                      businessId: business.id,
                      name: clientName.trim(),
                      companyName: companyName.trim() || undefined,
                      email: clientEmail.trim(),
                      phone: clientPhone.trim(),
                      serviceAddress: serviceAddress.trim(),
                      billingAddressSame: true,
                      tag: companyName ? 'commercial' : 'residential',
                      createdAt: new Date().toISOString(),
                    };
                    onSaveClient(newClient);
                    setSelectedClientId(newClient.id);
                    setClientSaveStatus(`Saved "${clientName}" to Client Directory!`);
                    setTimeout(() => setClientSaveStatus(null), 3500);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-blue-950 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-blue-800" />
                  <span>Save / Update in Client Directory</span>
                </button>
              </div>
            )}
          </div>

          {/* Project Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Scope & Timeline
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. 50-Gal Water Heater Replacement & Thermal Expansion Tank"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Scope of Work Narrative
                  </label>
                  <button
                    type="button"
                    disabled={isPolishingScope || !projectScopeSummary.trim()}
                    onClick={handlePolishScope}
                    className="text-[11px] font-medium text-blue-800 hover:text-blue-950 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Convert rough bullet points or quick notes into a crisp professional contractor specification"
                  >
                    <Wand2 className={`w-3 h-3 text-blue-700 ${isPolishingScope ? 'animate-spin' : ''}`} />
                    <span>{isPolishingScope ? 'Polishing scope with AI...' : 'Polish Scope with AI'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={projectScopeSummary}
                  onChange={(e) => setProjectScopeSummary(e.target.value)}
                  placeholder="Describe the trade service scope, teardown, materials to be installed, and customer expectations..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Est. Start Date
                  </label>
                  <input
                    type="date"
                    value={estimatedStartDate}
                    onChange={(e) => setEstimatedStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Est. Duration
                  </label>
                  <input
                    type="text"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g. 1 Day, 4-6 Hours"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quote Valid For
                  </label>
                  <select
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                  >
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Model: Single vs Tiered */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Pricing Structure & Line Items
                </h2>
                <p className="text-xs text-slate-500">
                  Choose between standard itemized scope or tiered Good / Better / Best packages.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsTiered(false)}
                  className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-colors cursor-pointer ${
                    !isTiered
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Single Scope
                </button>
                <button
                  type="button"
                  onClick={() => setIsTiered(true)}
                  className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-1 ${
                    isTiered
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-blue-800" />
                  <span>3-Tier Matrix</span>
                </button>
              </div>
            </div>

            {/* If Tiered: Tier Tab Switcher */}
            {isTiered && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-800" />
                    <span>Tier Packages (Customer Chooses in Proposal)</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {tiers.map((tier) => {
                    const isCurrent = activeTierTab === tier.id;
                    const tierTotal = tier.items.reduce(
                      (sum, i) => sum + (i.quantity || 0) * (i.unitPrice || 0),
                      0
                    );
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setActiveTierTab(tier.id)}
                        className={`p-2.5 rounded-md border text-left cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-white border-blue-900 shadow-2xs ring-1 ring-blue-900'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {tier.name}
                          </span>
                          {tier.isRecommended && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded">
                              Rec
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs font-bold text-slate-900 mt-1 tabular-nums">
                          {formatCurrency(tierTotal, business.currencySymbol)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items Table Header Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-slate-700">
                {isTiered
                  ? `Line items for: ${tiers.find((t) => t.id === activeTierTab)?.name}`
                  : 'Itemized Breakdown'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span>+ From Price Book</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('labor')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-3">
              {currentItems.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                  No line items yet. Click &quot;Add Line&quot; or &quot;+ From Price Book&quot; to insert services.
                </div>
              ) : (
                currentItems.map((item, idx) => {
                  const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                  const lineCost = (item.quantity || 0) * (item.unitCost || 0);
                  const lineProfit = lineTotal - lineCost;

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-lg border border-slate-200 space-y-2 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        {/* Category & Description */}
                        <div className="flex items-center gap-2 flex-1 w-full">
                          <select
                            value={item.category}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'category', e.target.value as LineItemCategory)
                            }
                            className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 capitalize font-medium cursor-pointer"
                          >
                            <option value="labor">Labor</option>
                            <option value="materials">Materials</option>
                            <option value="permits_equipment">Permits / Equip</option>
                            <option value="service_fee">Service Fee</option>
                            <option value="other">Other</option>
                          </select>

                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'description', e.target.value)
                            }
                            placeholder="Service task or item description..."
                            className="flex-1 text-xs px-2.5 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-900"
                          />
                        </div>

                        {/* Delete line item */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors self-end sm:self-auto"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Item Inputs & Financials */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Quantity</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono tabular-nums text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">Unit</label>
                          <select
                            value={item.unit}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'unit', e.target.value as UnitType)
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          >
                            <option value="hours">Hours</option>
                            <option value="units">Units</option>
                            <option value="flat rate">Flat Rate</option>
                            <option value="sq ft">Sq Ft</option>
                            <option value="linear ft">Linear Ft</option>
                            <option value="days">Days</option>
                            <option value="rooms">Rooms</option>
                            <option value="trips">Trips</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">
                            Client Rate ({business.currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono tabular-nums text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block" title="Internal contractor cost">
                            Your Cost ({business.currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitCost || 0}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono tabular-nums text-xs text-slate-600"
                          />
                        </div>

                        {/* Options checkboxes */}
                        <div className="flex items-center gap-3 pt-4 sm:col-span-1">
                          <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.taxable}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'taxable', e.target.checked)
                              }
                              className="rounded border-slate-300 text-blue-900"
                            />
                            <span>Tax</span>
                          </label>

                          <label
                            className="flex items-center gap-1 text-[11px] text-amber-700 cursor-pointer"
                            title="Allows customer to toggle this item in proposal"
                          >
                            <input
                              type="checkbox"
                              checked={item.isOptional || false}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'isOptional', e.target.checked)
                              }
                              className="rounded border-slate-300 text-amber-600"
                            />
                            <span>Optional</span>
                          </label>
                        </div>

                        {/* Calculated Line Subtotal */}
                        <div className="text-right pt-2 sm:pt-0">
                          <label className="text-[10px] text-slate-500 block">Line Total</label>
                          <span className="font-mono font-bold text-slate-900 tabular-nums text-xs">
                            {formatCurrency(lineTotal, business.currencySymbol)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Terms, Warranties & Customer Disclaimers */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              4. Payment Terms & Warranty Disclaimers
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Agreement & Schedule
                </label>
                <textarea
                  rows={2}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warranty & Craftsmanship Guarantee
                </label>
                <textarea
                  rows={2}
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Private / Special Notes for Customer
                </label>
                <input
                  type="text"
                  value={notesToCustomer}
                  onChange={(e) => setNotesToCustomer(e.target.value)}
                  placeholder="e.g. Please secure pets during service visit; water will be temporarily shut off at 10 AM."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Financial & Margin Intelligence Rail (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-5">
            {/* Live Financial Calculation Box */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Quote Investment Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(calculations.subtotal, business.currencySymbol)}
                  </span>
                </div>

                {/* Discount Editor */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Apply Discount</span>
                    <div className="flex items-center gap-1">
                      <select
                        value={discountType}
                        onChange={(e) =>
                          setDiscountType(e.target.value as 'none' | 'percent' | 'fixed')
                        }
                        className="text-[11px] px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded"
                      >
                        <option value="none">None</option>
                        <option value="percent">% Percent</option>
                        <option value="fixed">$ Fixed</option>
                      </select>
                      {discountType !== 'none' && (
                        <input
                          type="number"
                          min="0"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          className="w-16 text-right px-1.5 py-0.5 border border-slate-200 rounded font-mono text-[11px] tabular-nums"
                        />
                      )}
                    </div>
                  </div>
                  {calculations.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount Total</span>
                      <span className="font-mono tabular-nums">
                        -{formatCurrency(calculations.discountAmount, business.currencySymbol)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tax Rate Editor */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span>Sales Tax</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-12 text-right px-1 py-0.5 border border-slate-200 rounded font-mono text-[11px] tabular-nums"
                    />
                    <span className="text-[11px]">%</span>
                  </div>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(calculations.taxAmount, business.currencySymbol)}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-lg tabular-nums">
                    {formatCurrency(calculations.total, business.currencySymbol)}
                  </span>
                </div>

                {/* Deposit Configuration */}
                <div className="pt-3 border-t border-dashed border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-900 font-semibold text-xs">Required Deposit</span>
                    <div className="flex items-center gap-1">
                      <select
                        value={depositPercent}
                        onChange={(e) => setDepositPercent(Number(e.target.value))}
                        className="text-[11px] px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-900 font-medium"
                      >
                        <option value={20}>20%</option>
                        <option value={25}>25%</option>
                        <option value={30}>30%</option>
                        <option value={35}>35%</option>
                        <option value={50}>50%</option>
                        <option value={100}>100%</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between text-blue-950 font-bold font-mono text-xs tabular-nums">
                    <span>Deposit Due</span>
                    <span>{formatCurrency(calculations.depositRequired, business.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px] font-mono tabular-nums">
                    <span>Balance at Completion</span>
                    <span>{formatCurrency(calculations.balanceDue, business.currencySymbol)}</span>
                  </div>
                </div>
              </div>

              {/* Primary submit action */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSubmit('preview')}
                  className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Proposal as Client</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('save')}
                  className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
              </div>
            </div>

            {/* Contractor Gross Margin Intelligence (Private Internal Metric) */}
            <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Internal Profit Margin
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Private</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Job Revenue</span>
                  <span className="font-mono tabular-nums text-white">
                    {formatCurrency(calculations.total - calculations.taxAmount, business.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Direct Costs</span>
                  <span className="font-mono tabular-nums text-rose-300">
                    -{formatCurrency(calculations.estimatedCost, business.currencySymbol)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline font-bold">
                  <span className="text-slate-300">Estimated Gross Profit</span>
                  <span className="font-mono tabular-nums text-emerald-400 text-sm">
                    {formatCurrency(calculations.grossProfit, business.currencySymbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 text-[11px]">Gross Margin</span>
                  <span
                    className={`font-mono text-xs font-bold tabular-nums ${
                      calculations.grossMarginPercent >= 45
                        ? 'text-emerald-400'
                        : calculations.grossMarginPercent >= 30
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {calculations.grossMarginPercent.toFixed(1)}%
                  </span>
                </div>

                {/* Margin Health Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${
                      calculations.grossMarginPercent >= 45
                        ? 'bg-emerald-500'
                        : calculations.grossMarginPercent >= 30
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, calculations.grossMarginPercent))}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 pt-1 leading-normal">
                  {calculations.grossMarginPercent >= 45
                    ? 'Healthy margin for trade service overhead & net profit.'
                    : 'Consider reviewing labor hours or material markup.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Modal */}
      {showCatalogModal && (
        <CatalogPickerModal
          templates={catalogTemplates}
          currencySymbol={business.currencySymbol}
          onAddItems={handleCatalogAdd}
          onClose={() => setShowCatalogModal(false)}
        />
      )}

      {/* AI Quote Assistant Modal */}
      {showAIAssistantModal && (
        <AIQuoteAssistantModal
          business={business}
          isOpen={showAIAssistantModal}
          onClose={() => setShowAIAssistantModal(false)}
          onApplyDraft={handleApplyAIDraft}
        />
      )}

      {/* AI Quote Auditor Modal */}
      {showAuditorModal && (
        <AIQuoteAuditorModal
          isOpen={showAuditorModal}
          onClose={() => setShowAuditorModal(false)}
          business={business}
          projectTitle={projectTitle}
          projectScopeSummary={projectScopeSummary}
          items={isTiered ? (tiers.find((t) => t.id === activeTierTab)?.items || []) : singleItems}
          isTiered={isTiered}
          total={calculations.total}
          onAddMissingItem={handleAddAuditorItem}
        />
      )}

      {/* AI Photo Vision Estimator Modal */}
      {showPhotoModal && (
        <AIPhotoEstimatorModal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          business={business}
          onApplyItems={handleApplyVisionItems}
        />
      )}

      {/* AI Follow-Up Closer Radar Drawer */}
      {showFollowUpDrawer && (
        <AIFollowUpDrawer
          isOpen={showFollowUpDrawer}
          onClose={() => setShowFollowUpDrawer(false)}
          business={business}
          quote={
            initialQuote || {
              id: `quote_${Date.now()}`,
              quoteNumber,
              businessId: business.id,
              createdAt: new Date().toISOString(),
              validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
              status: 'sent',
              client: {
                name: clientName || 'Valued Customer',
                companyName,
                email: clientEmail,
                phone: clientPhone,
                serviceAddress,
                billingAddressSame: true,
              },
              projectTitle: projectTitle || 'Service Project',
              projectScopeSummary,
              isTiered,
              singleItems,
              tiers,
              selectedTierId: activeTierTab,
              discountType,
              discountValue,
              customTaxRate: taxRate,
              depositRequiredPercent: depositPercent,
              termsAndConditions,
              warrantyTerms,
            }
          }
        />
      )}
    </div>
  );
};
