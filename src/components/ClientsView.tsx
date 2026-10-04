import React, { useState, useMemo } from 'react';
import {
  BusinessProfile,
  ClientRecord,
  ClientTag,
  ServiceQuote,
} from '../types';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  FilePlus,
  DollarSign,
  Tag,
  StickyNote,
  X,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Download,
  FileSpreadsheet,
  ChevronDown,
  Upload,
} from 'lucide-react';
import { calculateQuote, formatCurrency, formatDate } from '../utils/calculations';
import { ImportClientsModal } from './ImportClientsModal';

interface ClientsViewProps {
  clients: ClientRecord[];
  business: BusinessProfile;
  quotes: ServiceQuote[];
  onSaveClient: (client: ClientRecord) => void;
  onDeleteClient: (clientId: string) => void;
  onCreateQuoteForClient: (client: ClientRecord) => void;
  onViewQuoteInPortal: (quote: ServiceQuote) => void;
  onEditQuote: (quote: ServiceQuote) => void;
}

const TAG_CONFIG: Record<ClientTag, { label: string; bg: string; text: string; border: string }> = {
  residential: {
    label: 'Residential',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  commercial: {
    label: 'Commercial',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  vip: {
    label: 'VIP Client',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  property_manager: {
    label: 'Property Mgr',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  lead: {
    label: 'New Lead',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
};

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  business,
  quotes,
  onSaveClient,
  onDeleteClient,
  onCreateQuoteForClient,
  onViewQuoteInPortal,
  onEditQuote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'quotes' | 'value'>('recent');

  // Modal states
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState<ClientRecord | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formServiceAddress, setFormServiceAddress] = useState('');
  const [formTag, setFormTag] = useState<ClientTag>('residential');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // CSV Export & Import states
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Map quotes to client records (fuzzy match by client name or email)
  const clientStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalQuotes: number;
        acceptedQuotes: number;
        totalQuotedValue: number;
        acceptedValue: number;
        quotes: ServiceQuote[];
        latestQuoteDate: string | null;
      }
    >();

    clients.forEach((client) => {
      const clientNameLower = client.name.trim().toLowerCase();
      const clientEmailLower = client.email.trim().toLowerCase();

      const matchedQuotes = quotes.filter((q) => {
        const qName = q.client.name.trim().toLowerCase();
        const qEmail = q.client.email.trim().toLowerCase();
        return (
          (clientEmailLower && qEmail === clientEmailLower) ||
          (clientNameLower && qName === clientNameLower)
        );
      });

      const accepted = matchedQuotes.filter((q) => q.status === 'accepted');
      const totalQuotedValue = matchedQuotes.reduce(
        (sum, q) => sum + calculateQuote(q, business.defaultTaxRate).total,
        0
      );
      const acceptedValue = accepted.reduce(
        (sum, q) => sum + calculateQuote(q, business.defaultTaxRate).total,
        0
      );

      // find newest
      let latestQuoteDate: string | null = null;
      if (matchedQuotes.length > 0) {
        const sorted = [...matchedQuotes].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        latestQuoteDate = sorted[0].createdAt;
      }

      map.set(client.id, {
        totalQuotes: matchedQuotes.length,
        acceptedQuotes: accepted.length,
        totalQuotedValue,
        acceptedValue,
        quotes: matchedQuotes,
        latestQuoteDate,
      });
    });

    return map;
  }, [clients, quotes]);

  // Aggregate stats
  const aggregateMetrics = useMemo(() => {
    let totalPipeline = 0;
    let totalAccepted = 0;
    let totalClientQuotes = 0;

    clientStatsMap.forEach((stats) => {
      totalPipeline += stats.totalQuotedValue;
      totalAccepted += stats.acceptedValue;
      totalClientQuotes += stats.totalQuotes;
    });

    const residentialCount = clients.filter(
      (c) => !c.tag || c.tag === 'residential' || c.tag === 'vip'
    ).length;
    const commercialCount = clients.filter(
      (c) => c.tag === 'commercial' || c.tag === 'property_manager'
    ).length;

    return {
      totalClients: clients.length,
      totalPipeline,
      totalAccepted,
      totalClientQuotes,
      residentialCount,
      commercialCount,
    };
  }, [clients, clientStatsMap]);

  // Filtered & sorted list
  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          client.name.toLowerCase().includes(query) ||
          (client.companyName && client.companyName.toLowerCase().includes(query)) ||
          client.email.toLowerCase().includes(query) ||
          client.phone.includes(query) ||
          client.serviceAddress.toLowerCase().includes(query) ||
          (client.notes && client.notes.toLowerCase().includes(query));

        const matchesTag =
          selectedTag === 'all' || (client.tag || 'residential') === selectedTag;

        return matchesQuery && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'quotes') {
          const aCount = clientStatsMap.get(a.id)?.totalQuotes || 0;
          const bCount = clientStatsMap.get(b.id)?.totalQuotes || 0;
          return bCount - aCount;
        }
        if (sortBy === 'value') {
          const aVal = clientStatsMap.get(a.id)?.totalQuotedValue || 0;
          const bVal = clientStatsMap.get(b.id)?.totalQuotedValue || 0;
          return bVal - aVal;
        }
        // recent
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [clients, searchQuery, selectedTag, sortBy, clientStatsMap]);

  // Open Add/Edit Modal
  const openAddModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormCompany('');
    setFormEmail('');
    setFormPhone('');
    setFormServiceAddress('');
    setFormTag('residential');
    setFormNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: ClientRecord) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormCompany(client.companyName || '');
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormServiceAddress(client.serviceAddress);
    setFormTag(client.tag || 'residential');
    setFormNotes(client.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveForm = (andCreateQuote = false) => {
    if (!formName.trim()) {
      setFormError('Client name is required');
      return;
    }
    if (!formServiceAddress.trim()) {
      setFormError('Service address is required');
      return;
    }

    const clientRecord: ClientRecord = {
      id: editingClient ? editingClient.id : `client_${Date.now()}`,
      businessId: business.id,
      name: formName.trim(),
      companyName: formCompany.trim() || undefined,
      email: formEmail.trim(),
      phone: formPhone.trim(),
      serviceAddress: formServiceAddress.trim(),
      billingAddressSame: true,
      tag: formTag,
      notes: formNotes.trim() || undefined,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString(),
    };

    onSaveClient(clientRecord);
    setIsModalOpen(false);

    if (andCreateQuote) {
      onCreateQuoteForClient(clientRecord);
    }
  };

  // Export clients list to RFC-4180 compliant CSV for CRM & Accounting software
  const handleExportCSV = (exportMode: 'all' | 'filtered' = 'all') => {
    const recordsToExport = exportMode === 'filtered' ? filteredClients : clients;
    if (recordsToExport.length === 0) return;

    const headers = [
      'Client ID',
      'Customer Name',
      'Company / Organization',
      'Email Address',
      'Phone Number',
      'Service Address',
      'Billing Address',
      'Client Category',
      'Date Added',
      'Total Proposals',
      'Accepted Proposals',
      'Total Quoted Value ($)',
      'Total Won Revenue ($)',
      'Last Quote Date',
      'Internal Notes',
      'Contractor Business',
    ];

    const escapeCell = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();
      // Excel & Google Sheets formula injection mitigation
      if (/^[=+@-]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = recordsToExport.map((client) => {
      const stats = clientStatsMap.get(client.id) || {
        totalQuotes: 0,
        acceptedQuotes: 0,
        totalQuotedValue: 0,
        acceptedValue: 0,
        latestQuoteDate: null,
      };

      const billingAddr = client.billingAddressSame
        ? client.serviceAddress
        : client.billingAddress || client.serviceAddress;

      const tagLabel =
        TAG_CONFIG[client.tag || 'residential']?.label || client.tag || 'Residential';

      const dateAdded = client.createdAt ? client.createdAt.split('T')[0] : '';
      const latestQuoteDate = stats.latestQuoteDate
        ? stats.latestQuoteDate.split('T')[0]
        : '';

      return [
        escapeCell(client.id),
        escapeCell(client.name),
        escapeCell(client.companyName || ''),
        escapeCell(client.email),
        escapeCell(client.phone),
        escapeCell(client.serviceAddress),
        escapeCell(billingAddr),
        escapeCell(tagLabel),
        escapeCell(dateAdded),
        escapeCell(stats.totalQuotes),
        escapeCell(stats.acceptedQuotes),
        escapeCell(stats.totalQuotedValue.toFixed(2)),
        escapeCell(stats.acceptedValue.toFixed(2)),
        escapeCell(latestQuoteDate),
        escapeCell(client.notes || ''),
        escapeCell(business.name),
      ].join(',');
    });

    // \uFEFF Byte Order Mark ensures Excel correctly opens UTF-8 encoded files
    const csvContent =
      '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedBiz = business.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const dateStamp = new Date().toISOString().split('T')[0];
    const suffix = exportMode === 'filtered' ? '_filtered' : '';
    link.download = `${sanitizedBiz}_clients${suffix}_${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExportMenuOpen(false);
    setExportNotice(
      `Exported ${recordsToExport.length} client record${
        recordsToExport.length === 1 ? '' : 's'
      } to CSV (${exportMode === 'filtered' ? 'filtered results' : 'entire client list'}). Formatted for QuickBooks, Xero, Jobber, Housecall Pro, and Excel.`
    );
    setTimeout(() => {
      setExportNotice(null);
    }, 6000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Customer & Client Directory
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-800 rounded-full border border-blue-200">
              {clients.length} Saved
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your client database for{' '}
            <span className="font-semibold text-slate-700">{business.name}</span>. Fast
            auto-fill for new quotes and lifetime quote history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export to CSV Action */}
          <div className="relative">
            {filteredClients.length !== clients.length ? (
              <div className="inline-flex rounded-md shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleExportCSV('all')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-l-md transition-colors cursor-pointer"
                  title="Download all client records as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export to CSV</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                    All ({clients.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen((prev) => !prev)}
                  className="px-2 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-t border-b border-r border-slate-300 rounded-r-md transition-colors cursor-pointer"
                  title="Export options"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleExportCSV('all')}
                disabled={clients.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download entire client list as CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export to CSV</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                  {clients.length}
                </span>
              </button>
            )}

            {/* Dropdown Menu when filtered */}
            {isExportMenuOpen && filteredClients.length !== clients.length && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-30">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    CSV Export Options
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCSV('all')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                      <div>
                        <div className="font-medium text-slate-900">Entire Client Database</div>
                        <div className="text-[10px] text-slate-500">All registered clients ({clients.length})</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {clients.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCSV('filtered')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer border-t border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-900">Filtered Search Results</div>
                        <div className="text-[10px] text-slate-500">Currently active filters ({filteredClients.length})</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {filteredClients.length}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Import from CSV Action */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer"
            title="Import customer list from QuickBooks, Jobber, Housecall Pro, or CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Export notification banner */}
      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Clients</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {aggregateMetrics.totalClients}
          </p>
          <div className="text-[11px] text-slate-500 mt-1 flex gap-2">
            <span>{aggregateMetrics.residentialCount} Res.</span>
            <span>•</span>
            <span>{aggregateMetrics.commercialCount} Comm.</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Quotes Built</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {aggregateMetrics.totalClientQuotes}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Linked to client accounts
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Quoted Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(aggregateMetrics.totalPipeline)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Across all proposals
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Accepted Work</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">
            {formatCurrency(aggregateMetrics.totalAccepted)}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Converted revenue</span>
          </p>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, email, phone, street address, or notes..."
              className="w-full text-xs pl-9 pr-8 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-slate-500 font-medium">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="recent">Recently Added</option>
              <option value="name">Name (A-Z)</option>
              <option value="quotes">Most Quotes</option>
              <option value="value">Highest Total Quoted</option>
            </select>
          </div>
        </div>

        {/* Tag Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Filter:
          </span>
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedTag === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Clients ({clients.length})
          </button>
          {(['residential', 'commercial', 'vip', 'property_manager', 'lead'] as ClientTag[]).map(
            (tag) => {
              const count = clients.filter((c) => (c.tag || 'residential') === tag).length;
              const config = TAG_CONFIG[tag];
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? `${config.bg} ${config.text} font-bold ring-1 ring-inset ring-current`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {config.label} ({count})
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Clients List / Cards */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No clients found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || selectedTag !== 'all'
              ? 'Try adjusting your search criteria or tag filter.'
              : 'Add your first customer to the directory or build a quote to start saving client records.'}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const stats = clientStatsMap.get(client.id) || {
              totalQuotes: 0,
              acceptedQuotes: 0,
              totalQuotedValue: 0,
              acceptedValue: 0,
              quotes: [],
              latestQuoteDate: null,
            };
            const tagConfig = TAG_CONFIG[client.tag || 'residential'];

            return (
              <div
                key={client.id}
                className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4"
              >
                {/* Header & Tag */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-800 shrink-0">
                        {client.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                          {client.name}
                        </h3>
                        {client.companyName && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[180px]">{client.companyName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${tagConfig.bg} ${tagConfig.text} ${tagConfig.border}`}
                    >
                      {tagConfig.label}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`tel:${client.phone}`}
                          className="hover:text-blue-900 transition-colors"
                        >
                          {client.phone}
                        </a>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`mailto:${client.email}`}
                          className="hover:text-blue-900 truncate transition-colors"
                        >
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.serviceAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-slate-700">
                          {client.serviceAddress}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes / Special Instructions */}
                  {client.notes && (
                    <div className="mt-3 p-2 bg-amber-50/70 border border-amber-200/80 rounded-md text-[11px] text-amber-900 flex items-start gap-1.5">
                      <StickyNote className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{client.notes}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Stats & Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center bg-slate-50/80 p-2 rounded-md border border-slate-100">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Quotes</p>
                      <button
                        onClick={() => setHistoryClient(client)}
                        className="text-xs font-bold text-blue-900 hover:underline cursor-pointer"
                        title="View quote history"
                      >
                        {stats.totalQuotes}{' '}
                        {stats.acceptedQuotes > 0 && (
                          <span className="text-emerald-700 font-semibold">
                            ({stats.acceptedQuotes} won)
                          </span>
                        )}
                      </button>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Total Value</p>
                      <p className="text-xs font-bold text-slate-900 tabular-nums">
                        {formatCurrency(stats.totalQuotedValue)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onCreateQuoteForClient(client)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs transition-colors cursor-pointer"
                      title="Generate a new service quote for this client"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>New Quote</span>
                    </button>

                    <button
                      onClick={() => setHistoryClient(client)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
                      title="View all past quotes for this client"
                    >
                      <span>History ({stats.totalQuotes})</span>
                    </button>

                    <button
                      onClick={() => openEditModal(client)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      title="Edit client details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete client "${client.name}"? Existing quotes will remain saved.`
                          )
                        ) {
                          onDeleteClient(client.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Delete client"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingClient ? 'Edit Client Details' : 'Add New Client to Directory'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
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
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="e.g. Hilltop Properties LLC"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service / Job Property Address *
                </label>
                <input
                  type="text"
                  value={formServiceAddress}
                  onChange={(e) => setFormServiceAddress(e.target.value)}
                  placeholder="1742 Skyline Blvd, Oakland, CA 94611"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Category / Tag
                </label>
                <select
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value as ClientTag)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                >
                  <option value="residential">Residential Customer</option>
                  <option value="commercial">Commercial / Business</option>
                  <option value="vip">VIP / High-Value Client</option>
                  <option value="property_manager">Property Manager / Landlord</option>
                  <option value="lead">New Inquiry / Lead</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Site Notes & Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Gate code #4829, dog in backyard, prefers morning visits..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveForm(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                {editingClient ? 'Save Changes' : 'Save Client'}
              </button>
              {!editingClient && (
                <button
                  type="button"
                  onClick={() => handleSaveForm(true)}
                  className="px-4 py-2 text-xs font-semibold text-blue-950 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors cursor-pointer"
                >
                  Save & Create Quote
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quote History Modal */}
      {historyClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Quote History: {historyClient.name}
                  </h3>
                  {historyClient.companyName && (
                    <span className="text-xs text-slate-500">
                      ({historyClient.companyName})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {historyClient.serviceAddress} · {historyClient.phone}
                </p>
              </div>
              <button
                onClick={() => setHistoryClient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Quotes */}
            {(() => {
              const matchedQuotes = (clientStatsMap.get(historyClient.id)?.quotes || []).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );

              if (matchedQuotes.length === 0) {
                return (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-slate-500">
                      No quotes have been generated for {historyClient.name} yet.
                    </p>
                    <button
                      onClick={() => {
                        const target = historyClient;
                        setHistoryClient(null);
                        onCreateQuoteForClient(target);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create First Quote for {historyClient.name}</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {matchedQuotes.map((quote) => {
                    const statusColors: Record<string, { bg: string; text: string }> = {
                      draft: { bg: 'bg-slate-100', text: 'text-slate-700' },
                      sent: { bg: 'bg-blue-50', text: 'text-blue-700' },
                      viewed: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
                      accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
                      declined: { bg: 'bg-rose-50', text: 'text-rose-700' },
                      invoiced: { bg: 'bg-purple-50', text: 'text-purple-700' },
                    };
                    const color = statusColors[quote.status] || statusColors.draft;

                    return (
                      <div
                        key={quote.id}
                        className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {quote.quoteNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${color.bg} ${color.text}`}
                            >
                              {quote.status}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(quote.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800">
                            {quote.projectTitle}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {quote.projectScopeSummary}
                          </p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                          <span className="text-sm font-bold text-slate-900 tabular-nums">
                            {formatCurrency(calculateQuote(quote, business.defaultTaxRate).total)}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setHistoryClient(null);
                                onViewQuoteInPortal(quote);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                              title="Preview client proposal"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View Proposal</span>
                            </button>

                            <button
                              onClick={() => {
                                setHistoryClient(null);
                                onEditQuote(quote);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                              title="Edit in Quote Builder"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const target = historyClient;
                  setHistoryClient(null);
                  onCreateQuoteForClient(target);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Quote for {historyClient.name}</span>
              </button>

              <button
                onClick={() => setHistoryClient(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Import Clients from CSV Modal */}
      <ImportClientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        businessId={business.id}
        onImportClients={(newClients) => {
          newClients.forEach((c) => onSaveClient(c));
          setExportNotice(
            `Successfully imported ${newClients.length} clients from CSV into ${business.name}.`
          );
          setTimeout(() => setExportNotice(null), 6000);
        }}
      />
    </div>
  );
};
