import React, { useState, useEffect } from 'react';
import {
  BusinessProfile,
  CatalogTemplate,
  ClientRecord,
  QuoteStatus,
  ServiceQuote,
} from './types';
import {
  loadActiveBusinessId,
  loadBusinesses,
  loadClients,
  loadQuotes,
  loadTemplates,
  saveActiveBusinessId,
  saveBusinesses,
  saveClients,
  saveQuotes,
  saveTemplates,
} from './utils/storage';
import {
  testConnection,
  seedInitialFirestoreData,
  saveFirestoreQuote,
  deleteFirestoreQuote,
  saveFirestoreClient,
  deleteFirestoreClient,
  saveFirestoreTemplate,
  saveFirestoreBusiness,
} from './firebase';
import { Header } from './components/Header';
import { PipelineView } from './components/PipelineView';
import { QuoteBuilder } from './components/QuoteBuilder';
import { ClientsView } from './components/ClientsView';
import { ClientPortal } from './components/ClientPortal';
import { CatalogManager } from './components/CatalogManager';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { ShareModal } from './components/ShareModal';
import { GuidelinesView } from './components/GuidelinesView';
import { AIQuoteAssistantModal } from './components/AIQuoteAssistantModal';
import { AIFollowUpDrawer } from './components/AIFollowUpDrawer';
import { NewCompanyModal } from './components/NewCompanyModal';

export default function App() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>(() => loadBusinesses());
  const [activeBizId, setActiveBizId] = useState<string>(() => loadActiveBusinessId());
  const [allQuotes, setAllQuotes] = useState<ServiceQuote[]>(() => loadQuotes());
  const [allClients, setAllClients] = useState<ClientRecord[]>(() => loadClients());
  const [catalogTemplates, setCatalogTemplates] = useState<CatalogTemplate[]>(() =>
    loadTemplates()
  );

  const [activeTab, setActiveTab] = useState<
    'pipeline' | 'builder' | 'clients' | 'catalog' | 'analytics' | 'settings' | 'guide'
  >('pipeline');

  // Currently active quote being edited in builder
  const [editingQuote, setEditingQuote] = useState<ServiceQuote | null>(null);

  // Quote currently being viewed in the Client Portal proposal view
  const [portalQuote, setPortalQuote] = useState<ServiceQuote | null>(null);

  // Quote currently opened in the Share modal
  const [shareModalQuote, setShareModalQuote] = useState<ServiceQuote | null>(null);

  // Quote currently opened in the AI Follow-Up Closer Radar Drawer
  const [followUpModalQuote, setFollowUpModalQuote] = useState<ServiceQuote | null>(null);

  // Global AI Quote Assistant modal
  const [isGlobalAIDraftOpen, setIsGlobalAIDraftOpen] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);

  // Initialize and sync with Firebase Firestore on mount
  useEffect(() => {
    async function initFirestore() {
      try {
        const isOk = await testConnection();
        setIsFirebaseConnected(isOk);
        const data = await seedInitialFirestoreData();
        if (data.quotes.length > 0) setAllQuotes(data.quotes);
        if (data.clients.length > 0) setAllClients(data.clients);
        if (data.templates.length > 0) setCatalogTemplates(data.templates);
        if (data.businesses.length > 0) setBusinesses(data.businesses);
      } catch (err) {
        console.error('Failed to sync with Firebase Firestore:', err);
      }
    }
    initFirestore();
  }, []);

  // Persist state changes
  useEffect(() => {
    saveBusinesses(businesses);
  }, [businesses]);

  useEffect(() => {
    saveActiveBusinessId(activeBizId);
  }, [activeBizId]);

  useEffect(() => {
    saveQuotes(allQuotes);
  }, [allQuotes]);

  useEffect(() => {
    saveTemplates(catalogTemplates);
  }, [catalogTemplates]);

  useEffect(() => {
    saveClients(allClients);
  }, [allClients]);

  // Active business entity
  const activeBusiness =
    businesses.find((b) => b.id === activeBizId) || businesses[0];

  // Quotes relevant to current active business
  const businessQuotes = allQuotes.filter((q) => q.businessId === activeBusiness.id);

  // Clients relevant to current active business
  const businessClients = allClients.filter((c) => c.businessId === activeBusiness.id);

  // Handlers
  const handleSelectBusiness = (biz: BusinessProfile) => {
    setActiveBizId(biz.id);
  };

  const handleSaveClient = (client: ClientRecord) => {
    setAllClients((prev) => {
      const index = prev.findIndex((c) => c.id === client.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = client;
        return copy;
      }
      return [client, ...prev];
    });
    saveFirestoreClient(client);
  };

  const handleDeleteClient = (clientId: string) => {
    setAllClients((prev) => prev.filter((c) => c.id !== clientId));
    deleteFirestoreClient(clientId);
  };

  const handleCreateQuoteForClient = (client: ClientRecord) => {
    const quoteNumber = `Q-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const starterQuote: ServiceQuote = {
      id: `quote_${Date.now()}`,
      businessId: activeBusiness.id,
      quoteNumber,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      status: 'draft',
      client: {
        name: client.name,
        companyName: client.companyName,
        email: client.email,
        phone: client.phone,
        serviceAddress: client.serviceAddress,
        billingAddressSame: client.billingAddressSame ?? true,
        billingAddress: client.billingAddress,
      },
      projectTitle: `${client.companyName || client.name} - Service Request`,
      projectScopeSummary: client.notes ? `Special job instructions: ${client.notes}` : '',
      estimatedDuration: '1-2 Days',
      isTiered: false,
      singleItems: [
        {
          id: `item_${Date.now()}_1`,
          category: 'labor',
          description: 'Standard Labor & Diagnostic Assessment',
          quantity: 2,
          unit: 'hours',
          unitPrice: 165.0,
          unitCost: 75.0,
          taxable: false,
          isOptional: false,
          selected: true,
        },
      ],
      selectedTierId: 'tier_better',
      tiers: [],
      discountType: 'none',
      discountValue: 0,
      depositRequiredPercent: activeBusiness.defaultDepositPercent,
      termsAndConditions: activeBusiness.defaultPaymentTerms,
      warrantyTerms: activeBusiness.defaultWarrantyTerms,
    };
    setEditingQuote(starterQuote);
    setPortalQuote(null);
    setActiveTab('builder');
  };

  const handleNewQuote = () => {
    setEditingQuote(null);
    setPortalQuote(null);
    setActiveTab('builder');
  };

  const handleEditQuote = (quote: ServiceQuote) => {
    setEditingQuote(quote);
    setPortalQuote(null);
    setActiveTab('builder');
  };

  const handleSelectQuoteForPortal = (quote: ServiceQuote) => {
    setPortalQuote(quote);
  };

  const handleSaveQuote = (
    saved: ServiceQuote,
    action: 'save' | 'preview' | 'send'
  ) => {
    const exists = allQuotes.some((q) => q.id === saved.id);
    let updatedQuotes: ServiceQuote[] = [];

    if (exists) {
      updatedQuotes = allQuotes.map((q) => (q.id === saved.id ? saved : q));
    } else {
      updatedQuotes = [saved, ...allQuotes];
    }

    setAllQuotes(updatedQuotes);
    saveFirestoreQuote(saved);

    // Auto-sync client to client directory if name is present
    if (saved.client?.name && saved.client.name.trim()) {
      setAllClients((prev) => {
        const existingIndex = prev.findIndex(
          (c) =>
            c.businessId === saved.businessId &&
            ((saved.client.email && c.email.toLowerCase() === saved.client.email.toLowerCase()) ||
              c.name.toLowerCase() === saved.client.name.toLowerCase())
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          const updatedClient = {
            ...updated[existingIndex],
            name: saved.client.name,
            companyName: saved.client.companyName || updated[existingIndex].companyName,
            email: saved.client.email || updated[existingIndex].email,
            phone: saved.client.phone || updated[existingIndex].phone,
            serviceAddress: saved.client.serviceAddress || updated[existingIndex].serviceAddress,
          };
          updated[existingIndex] = updatedClient;
          saveFirestoreClient(updatedClient);
          return updated;
        } else {
          const newRecord: ClientRecord = {
            id: `client_${Date.now()}`,
            businessId: saved.businessId,
            name: saved.client.name,
            companyName: saved.client.companyName,
            email: saved.client.email,
            phone: saved.client.phone,
            serviceAddress: saved.client.serviceAddress,
            billingAddressSame: saved.client.billingAddressSame ?? true,
            billingAddress: saved.client.billingAddress,
            tag: saved.client.companyName ? 'commercial' : 'residential',
            createdAt: new Date().toISOString(),
          };
          saveFirestoreClient(newRecord);
          return [newRecord, ...prev];
        }
      });
    }

    if (action === 'preview') {
      setPortalQuote(saved);
    } else if (action === 'send') {
      setPortalQuote(null);
      setEditingQuote(null);
      setActiveTab('pipeline');
      setShareModalQuote(saved);
    } else {
      setPortalQuote(null);
      setEditingQuote(null);
      setActiveTab('pipeline');
    }
  };

  const handleDeleteQuote = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this quote?')) {
      const updated = allQuotes.filter((q) => q.id !== id);
      setAllQuotes(updated);
      deleteFirestoreQuote(id);
      if (portalQuote?.id === id) setPortalQuote(null);
      if (editingQuote?.id === id) setEditingQuote(null);
    }
  };

  const handleDuplicateQuote = (quote: ServiceQuote) => {
    const duplicated: ServiceQuote = {
      ...quote,
      id: `quote_${Date.now()}`,
      quoteNumber: `Q-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      status: 'draft',
      clientSignature: undefined,
      sentAt: undefined,
      viewedAt: undefined,
      acceptedAt: undefined,
    };
    setAllQuotes([duplicated, ...allQuotes]);
    saveFirestoreQuote(duplicated);
    setEditingQuote(duplicated);
    setActiveTab('builder');
  };

  const handleUpdateStatus = (id: string, status: QuoteStatus) => {
    const updated = allQuotes.map((q) => {
      if (q.id === id) {
        const u = { ...q, status };
        saveFirestoreQuote(u);
        return u;
      }
      return q;
    });
    setAllQuotes(updated);
  };

  const handleUpdateQuoteFromPortal = (updated: ServiceQuote) => {
    const newQuotes = allQuotes.map((q) => (q.id === updated.id ? updated : q));
    setAllQuotes(newQuotes);
    setPortalQuote(updated);
    saveFirestoreQuote(updated);
  };

  const handleUpdateBusiness = (updated: BusinessProfile) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    saveFirestoreBusiness(updated);
  };

  const handleCreateBusiness = (
    newBusiness: BusinessProfile,
    starterTemplates: CatalogTemplate[]
  ) => {
    setBusinesses((prev) => [newBusiness, ...prev]);
    setActiveBizId(newBusiness.id);
    saveFirestoreBusiness(newBusiness);
    saveActiveBusinessId(newBusiness.id);

    if (starterTemplates.length > 0) {
      setCatalogTemplates((prev) => [...starterTemplates, ...prev]);
      for (const t of starterTemplates) {
        saveFirestoreTemplate(t);
      }
    }
  };

  const handleUpdateTemplates = (updated: CatalogTemplate[]) => {
    setCatalogTemplates(updated);
    for (const t of updated) {
      saveFirestoreTemplate(t);
    }
  };

  const handleApplyGlobalAIDraft = (draft: any) => {
    const newQuote: ServiceQuote = {
      id: `quote_${Date.now()}`,
      quoteNumber: `Q-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      businessId: activeBusiness.id,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'draft',
      client: {
        name: draft.clientName || 'Valued Client',
        companyName: draft.companyName || undefined,
        email: draft.email || '',
        phone: draft.phone || '',
        serviceAddress: draft.serviceAddress || '',
        billingAddressSame: true,
      },
      projectTitle: draft.projectTitle || 'Service Job',
      projectScopeSummary: draft.projectScopeSummary || '',
      isTiered: !!draft.isTiered,
      singleItems: (draft.singleItems || []).map((item: any, idx: number) => ({
        id: `ai_item_${Date.now()}_${idx}`,
        category: item.category || 'labor',
        description: item.description || 'Service line item',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'hours',
        unitPrice: Number(item.unitPrice) || 100,
        unitCost: Number(item.unitCost) || 50,
        taxable: item.taxable !== undefined ? item.taxable : item.category === 'materials',
        isOptional: !!item.isOptional,
        selected: true,
      })),
      tiers: (draft.tiers || []).map((tier: any, tIdx: number) => ({
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
          unit: item.unit || 'hours',
          unitPrice: Number(item.unitPrice) || 100,
          unitCost: Number(item.unitCost) || 50,
          taxable: item.taxable !== undefined ? item.taxable : item.category === 'materials',
          isOptional: false,
          selected: true,
        })),
      })),
      selectedTierId: draft.isTiered && draft.tiers?.length ? (draft.tiers.find((t: any) => t.isRecommended)?.id || draft.tiers[0].id) : undefined,
      discountType: 'none',
      discountValue: 0,
      customTaxRate: activeBusiness.defaultTaxRate,
      depositRequiredPercent: draft.depositRequiredPercent || activeBusiness.defaultDepositPercent,
      estimatedStartDate: draft.estimatedStartDate,
      estimatedDuration: draft.estimatedDuration || '1-2 Days',
      termsAndConditions: activeBusiness.defaultPaymentTerms,
      warrantyTerms: activeBusiness.defaultWarrantyTerms,
      notesToCustomer: draft.notesToCustomer || '',
    };

    setEditingQuote(newQuote);
    setActiveTab('builder');
    setIsGlobalAIDraftOpen(false);
  };

  // If Client Portal view is active, render the customer proposal experience
  if (portalQuote) {
    return (
      <ClientPortal
        quote={portalQuote}
        business={activeBusiness}
        onUpdateQuote={handleUpdateQuoteFromPortal}
        onBackToDashboard={() => setPortalQuote(null)}
        onOpenShareModal={(q) => setShareModalQuote(q)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setEditingQuote(null);
          setPortalQuote(null);
          setActiveTab(tab);
        }}
        businesses={businesses}
        activeBusiness={activeBusiness}
        onSelectBusiness={handleSelectBusiness}
        onNewQuote={handleNewQuote}
        onOpenAIDraft={() => setIsGlobalAIDraftOpen(true)}
        isFirebaseConnected={isFirebaseConnected}
        onOpenNewCompanyModal={() => setIsNewCompanyModalOpen(true)}
      />

      {/* Main SaaS Workspace Content */}
      <main className="flex-1">
        {activeTab === 'pipeline' && (
          <PipelineView
            quotes={businessQuotes}
            allQuotes={allQuotes}
            clients={businessClients}
            business={activeBusiness}
            onSelectQuote={handleSelectQuoteForPortal}
            onEditQuote={handleEditQuote}
            onNewQuote={handleNewQuote}
            onDeleteQuote={handleDeleteQuote}
            onDuplicateQuote={handleDuplicateQuote}
            onUpdateStatus={handleUpdateStatus}
            onOpenShareModal={(q) => setShareModalQuote(q)}
            onOpenAIDraft={() => setIsGlobalAIDraftOpen(true)}
            onOpenFollowUpRadar={(q) => setFollowUpModalQuote(q)}
          />
        )}

        {activeTab === 'builder' && (
          <QuoteBuilder
            initialQuote={editingQuote}
            business={activeBusiness}
            catalogTemplates={catalogTemplates}
            clients={businessClients}
            onSaveClient={handleSaveClient}
            onSaveQuote={handleSaveQuote}
            onCancel={() => {
              setEditingQuote(null);
              setActiveTab('pipeline');
            }}
            onOpenFollowUpRadar={(q) => setFollowUpModalQuote(q)}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={businessClients}
            business={activeBusiness}
            quotes={businessQuotes}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
            onCreateQuoteForClient={handleCreateQuoteForClient}
            onViewQuoteInPortal={handleSelectQuoteForPortal}
            onEditQuote={handleEditQuote}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogManager
            templates={catalogTemplates}
            business={activeBusiness}
            onUpdateTemplates={handleUpdateTemplates}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView quotes={businessQuotes} business={activeBusiness} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            business={activeBusiness}
            businesses={businesses}
            onUpdateBusiness={handleUpdateBusiness}
            onOpenNewCompanyModal={() => setIsNewCompanyModalOpen(true)}
            quotes={allQuotes}
            clients={allClients}
            templates={catalogTemplates}
          />
        )}

        {activeTab === 'guide' && (
          <GuidelinesView
            business={activeBusiness}
            onNavigate={(tab) => {
              setEditingQuote(null);
              setPortalQuote(null);
              setActiveTab(tab);
            }}
            onOpenAIDraft={() => setIsGlobalAIDraftOpen(true)}
          />
        )}
      </main>

      {/* Global AI Quote Assistant Modal */}
      {isGlobalAIDraftOpen && (
        <AIQuoteAssistantModal
          business={activeBusiness}
          isOpen={isGlobalAIDraftOpen}
          onClose={() => setIsGlobalAIDraftOpen(false)}
          onApplyDraft={handleApplyGlobalAIDraft}
        />
      )}

      {/* Register New Company Workspace Modal */}
      <NewCompanyModal
        isOpen={isNewCompanyModalOpen}
        onClose={() => setIsNewCompanyModalOpen(false)}
        onCreateBusiness={handleCreateBusiness}
      />

      {/* Share / SMS / Email modal */}
      {shareModalQuote && (
        <ShareModal
          quote={shareModalQuote}
          business={activeBusiness}
          onClose={() => setShareModalQuote(null)}
          onOpenPortal={(q) => {
            setShareModalQuote(null);
            setPortalQuote(q);
          }}
        />
      )}

      {/* AI Follow-Up Closer Radar Drawer */}
      {followUpModalQuote && (
        <AIFollowUpDrawer
          quote={followUpModalQuote}
          business={activeBusiness}
          isOpen={!!followUpModalQuote}
          onClose={() => setFollowUpModalQuote(null)}
          onOpenPortal={(q) => {
            setFollowUpModalQuote(null);
            setPortalQuote(q);
          }}
        />
      )}
    </div>
  );
}
