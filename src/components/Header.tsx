import React from 'react';
import { BusinessProfile } from '../types';
import { Plus, Building2, ChevronDown, Check, BookOpen, Sparkles, Cloud } from 'lucide-react';

interface HeaderProps {
  activeTab: 'pipeline' | 'builder' | 'clients' | 'catalog' | 'analytics' | 'settings' | 'guide';
  setActiveTab: (tab: 'pipeline' | 'builder' | 'clients' | 'catalog' | 'analytics' | 'settings' | 'guide') => void;
  businesses: BusinessProfile[];
  activeBusiness: BusinessProfile;
  onSelectBusiness: (biz: BusinessProfile) => void;
  onNewQuote: () => void;
  onOpenAIDraft?: () => void;
  isFirebaseConnected?: boolean;
  onOpenNewCompanyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  businesses,
  activeBusiness,
  onSelectBusiness,
  onNewQuote,
  onOpenAIDraft,
  isFirebaseConnected = true,
  onOpenNewCompanyModal,
}) => {
  const [showBizDropdown, setShowBizDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBizDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('pipeline')}
              className="text-left group cursor-pointer"
            >
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                QuoteForge<span className="text-blue-700">.</span>
              </span>
            </button>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`transition-colors pb-1 border-b-2 cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'border-blue-900 text-blue-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Quotes & Pipeline
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`transition-colors pb-1 border-b-2 cursor-pointer ${
                activeTab === 'builder'
                  ? 'border-blue-900 text-blue-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Quote Generator
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`transition-colors pb-1 border-b-2 cursor-pointer ${
                activeTab === 'clients'
                  ? 'border-blue-900 text-blue-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Clients
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`transition-colors pb-1 border-b-2 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'border-blue-900 text-blue-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Price Book & Catalog
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`transition-colors pb-1 border-b-2 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-blue-900 text-blue-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue Insights
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`transition-colors pb-1 border-b-2 cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-blue-900 text-blue-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Business Settings
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`transition-colors pb-1 border-b-2 cursor-pointer inline-flex items-center gap-1 ${
                activeTab === 'guide'
                  ? 'border-blue-900 text-blue-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guidelines</span>
            </button>
          </nav>

          {/* Zone 3: Actions (Business Switcher & CTA) */}
          <div className="flex items-center gap-3">
            {/* Business Profile Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowBizDropdown(!showBizDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                title="Switch Business Profile"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="font-medium max-w-[140px] truncate sm:max-w-[180px]">
                  {activeBusiness.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showBizDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Active Business Workspace
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {businesses.map((biz) => {
                      const isCurrent = biz.id === activeBusiness.id;
                      return (
                        <button
                          key={biz.id}
                          onClick={() => {
                            onSelectBusiness(biz);
                            setShowBizDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            isCurrent ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {biz.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {biz.city}, {biz.state} · {biz.trade}
                            </p>
                          </div>
                          {isCurrent && (
                            <Check className="w-4 h-4 text-blue-800 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 mt-1 pt-1.5 px-3 space-y-1">
                    {onOpenNewCompanyModal && (
                      <button
                        onClick={() => {
                          setShowBizDropdown(false);
                          onOpenNewCompanyModal();
                        }}
                        className="text-xs text-blue-700 hover:text-blue-900 font-semibold py-1 flex items-center gap-1.5 w-full text-left cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-700" />
                        <span>Register New Company</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowBizDropdown(false);
                        setActiveTab('settings');
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium py-1 block w-full text-left cursor-pointer"
                    >
                      Settings & Integrations Hub
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Assistant Quick Trigger */}
            {onOpenAIDraft && (
              <button
                type="button"
                onClick={onOpenAIDraft}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                title="Open AI Natural Language Quote Generator"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-800" />
                <span>AI Assistant</span>
              </button>
            )}

            {/* Primary Action Button */}
            <button
              onClick={onNewQuote}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Quote</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
