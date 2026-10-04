import React, { useState } from 'react';
import { BusinessProfile, CatalogTemplate, TradeType } from '../types';
import {
  Building2,
  X,
  Check,
  Sparkles,
  Shield,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Briefcase,
  FileSpreadsheet,
} from 'lucide-react';

interface NewCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBusiness: (
    business: BusinessProfile,
    starterTemplates: CatalogTemplate[]
  ) => void;
}

const TRADE_STARTERS: Record<
  TradeType,
  {
    tagline: string;
    defaultDeposit: number;
    defaultTax: number;
    starterItems: Array<{
      title: string;
      description: string;
      category: 'labor' | 'materials' | 'permits_equipment' | 'service_fee';
      defaultPrice: number;
      defaultCost: number;
      defaultUnit: 'hours' | 'units' | 'flat rate' | 'sq ft' | 'days';
      taxable: boolean;
      isPopular?: boolean;
    }>;
  }
> = {
  plumbing: {
    tagline: 'Licensed Residential & Commercial Master Plumbers',
    defaultDeposit: 30,
    defaultTax: 8.5,
    starterItems: [
      {
        title: 'Master Plumber Diagnostic & Hourly Labor',
        description: 'Certified master plumber on-site diagnosis and repair execution.',
        category: 'labor',
        defaultPrice: 165,
        defaultCost: 75,
        defaultUnit: 'hours',
        taxable: false,
        isPopular: true,
      },
      {
        title: 'Standard Water Heater Replacement',
        description: '50-Gal high-efficiency unit with new brass valves and copper flex lines.',
        category: 'materials',
        defaultPrice: 1250,
        defaultCost: 720,
        defaultUnit: 'units',
        taxable: true,
        isPopular: true,
      },
      {
        title: 'Municipal Plumbing Permit & Inspection Filing',
        description: 'City permit acquisition and on-site building inspector sign-off.',
        category: 'permits_equipment',
        defaultPrice: 285,
        defaultCost: 195,
        defaultUnit: 'flat rate',
        taxable: false,
      },
    ],
  },
  electrical: {
    tagline: 'Licensed Master Electricians & Smart Home Specialists',
    defaultDeposit: 30,
    defaultTax: 8.25,
    starterItems: [
      {
        title: 'Journeyman Electrician Labor',
        description: 'Licensed wireman hourly rate for panel, branch circuit, and fixture installs.',
        category: 'labor',
        defaultPrice: 155,
        defaultCost: 70,
        defaultUnit: 'hours',
        taxable: false,
        isPopular: true,
      },
      {
        title: 'Level 2 EV Charger Dedicated 50A Circuit',
        description: 'NEMA 14-50 receptacle, 6/3 Romex up to 40ft, 50A GFCI dual-pole breaker.',
        category: 'materials',
        defaultPrice: 850,
        defaultCost: 320,
        defaultUnit: 'flat rate',
        taxable: true,
        isPopular: true,
      },
      {
        title: 'Main Service Panel 200A Modernization',
        description: '200A 40-circuit outdoor panel, whole-home surge protector, grounding rods.',
        category: 'materials',
        defaultPrice: 2450,
        defaultCost: 980,
        defaultUnit: 'units',
        taxable: true,
        isPopular: true,
      },
    ],
  },
  hvac: {
    tagline: 'High-Efficiency Heating, Cooling & Air Quality',
    defaultDeposit: 35,
    defaultTax: 8.0,
    starterItems: [
      {
        title: 'Certified HVAC Field Diagnostic & Labor',
        description: 'EPA certified technician refrigerant leak check, airflow check, and tune-up.',
        category: 'labor',
        defaultPrice: 175,
        defaultCost: 80,
        defaultUnit: 'hours',
        taxable: false,
        isPopular: true,
      },
      {
        title: 'Inverter Heat Pump 3-Ton System Install',
        description: '18 SEER2 dual-stage heat pump, variable speed air handler, smart thermostat.',
        category: 'materials',
        defaultPrice: 6800,
        defaultCost: 3900,
        defaultUnit: 'units',
        taxable: true,
        isPopular: true,
      },
      {
        title: 'EcoBee Smart Thermostat with Remote Sensors',
        description: 'Programmable WiFi thermostat with whole-home room averaging sensors.',
        category: 'materials',
        defaultPrice: 380,
        defaultCost: 190,
        defaultUnit: 'units',
        taxable: true,
      },
    ],
  },
  landscaping: {
    tagline: 'Artisan Hardscapes, Irrigation & Estate Maintenance',
    defaultDeposit: 35,
    defaultTax: 8.25,
    starterItems: [
      {
        title: 'Landscape Crew Labor (3-Person Team)',
        description: 'Per-hour rate for trimming, grading, bed weeding, and cleanup.',
        category: 'labor',
        defaultPrice: 180,
        defaultCost: 90,
        defaultUnit: 'hours',
        taxable: false,
        isPopular: true,
      },
      {
        title: 'Premium Organic Dark Bark Mulch',
        description: 'Triple-shredded hardwood mulch delivered and installed at 3-inch depth.',
        category: 'materials',
        defaultPrice: 85,
        defaultCost: 38,
        defaultUnit: 'units',
        taxable: true,
      },
      {
        title: 'Automated Drip Irrigation Zone Retrofit',
        description: 'Rain Bird pressure regulator valve, backflow preventer, 200ft emitter lines.',
        category: 'materials',
        defaultPrice: 650,
        defaultCost: 240,
        defaultUnit: 'flat rate',
        taxable: true,
        isPopular: true,
      },
    ],
  },
  painting: {
    tagline: 'Precision Interior & Exterior Architectural Coatings',
    defaultDeposit: 25,
    defaultTax: 7.5,
    starterItems: [
      {
        title: 'Interior Wall & Ceiling Prep and 2-Coat Spray/Roll',
        description: 'Sanding, patching drywall defects, priming, and 2 finish coats Benjamin Moore/Sherwin Williams.',
        category: 'labor',
        defaultPrice: 2.75,
        defaultCost: 1.1,
        defaultUnit: 'sq ft',
        taxable: false,
        isPopular: true,
      },
      {
        title: 'Premium Zero-VOC Latex Architectural Paint',
        description: 'Sherwin Williams Duration / Emerald Interior Satin/Eggshell per gallon.',
        category: 'materials',
        defaultPrice: 78,
        defaultCost: 45,
        defaultUnit: 'units',
        taxable: true,
      },
    ],
  },
  roofing: {
    tagline: 'Lifetime Architectural Shingles & Commercial Gutters',
    defaultDeposit: 40,
    defaultTax: 7.0,
    starterItems: [
      {
        title: 'Tear-Off & Lifetime Shingle Installation',
        description: 'Complete strip to deck, synthetic underlayment, ice & water shield, GAF Timberline HDZ shingles.',
        category: 'materials',
        defaultPrice: 450,
        defaultCost: 220,
        defaultUnit: 'units',
        taxable: true,
        isPopular: true,
      },
      {
        title: 'Roofing Crew Tear-Off & Skilled Install Labor',
        description: 'Certified crew installation, ridge vent framing, nail guns, and magnetic sweep.',
        category: 'labor',
        defaultPrice: 195,
        defaultCost: 95,
        defaultUnit: 'hours',
        taxable: false,
      },
    ],
  },
  general_contracting: {
    tagline: 'Turnkey Residential Remodels & Commercial Buildouts',
    defaultDeposit: 30,
    defaultTax: 8.0,
    starterItems: [
      {
        title: 'General Contractor Site Management & Supervision',
        description: 'Daily project coordination, trade scheduling, quality control, and safety inspections.',
        category: 'labor',
        defaultPrice: 145,
        defaultCost: 65,
        defaultUnit: 'hours',
        taxable: false,
        isPopular: true,
      },
      {
        title: 'Dumpster Rental & Jobsite Disposal (20-Yard)',
        description: 'Delivered roll-off container, 4-ton allowance, and transfer station disposal fees.',
        category: 'permits_equipment',
        defaultPrice: 650,
        defaultCost: 480,
        defaultUnit: 'flat rate',
        taxable: false,
      },
    ],
  },
  handyman: {
    tagline: 'Reliable Home Repairs, Carpentry & Fixture Replacements',
    defaultDeposit: 25,
    defaultTax: 7.5,
    starterItems: [
      {
        title: 'Skilled Handyman Hourly Service',
        description: 'General drywall, hardware, door adjustments, caulking, and assembly.',
        category: 'labor',
        defaultPrice: 95,
        defaultCost: 40,
        defaultUnit: 'hours',
        taxable: false,
        isPopular: true,
      },
    ],
  },
  cleaning: {
    tagline: 'Deep Sanitization, Turnover & Post-Construction Cleaning',
    defaultDeposit: 20,
    defaultTax: 7.0,
    starterItems: [
      {
        title: 'Deep Cleaning Crew (per hour)',
        description: 'Commercial HEPA vacuums, eco-friendly degreasers, glass polishing, baseboards.',
        category: 'labor',
        defaultPrice: 85,
        defaultCost: 35,
        defaultUnit: 'hours',
        taxable: false,
        isPopular: true,
      },
    ],
  },
  auto_detailing: {
    tagline: 'Mobile Ceramic Coating & Concierge Auto Detailing',
    defaultDeposit: 25,
    defaultTax: 7.0,
    starterItems: [
      {
        title: 'Multi-Stage Paint Correction & Ceramic Coating',
        description: 'Decontamination clay bar, 2-stage machine polish, 5-year 9H ceramic coating layer.',
        category: 'service_fee',
        defaultPrice: 850,
        defaultCost: 220,
        defaultUnit: 'flat rate',
        taxable: true,
        isPopular: true,
      },
    ],
  },
};

export const NewCompanyModal: React.FC<NewCompanyModalProps> = ({
  isOpen,
  onClose,
  onCreateBusiness,
}) => {
  const [name, setName] = useState('');
  const [trade, setTrade] = useState<TradeType>('plumbing');
  const [tagline, setTagline] = useState(TRADE_STARTERS.plumbing.tagline);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('CA');
  const [zip, setZip] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insuranceInfo, setInsuranceInfo] = useState('$1,000,000 Commercial General Liability');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(TRADE_STARTERS.plumbing.defaultTax);
  const [defaultDepositPercent, setDefaultDepositPercent] = useState<number>(
    TRADE_STARTERS.plumbing.defaultDeposit
  );
  const [seedTemplates, setSeedTemplates] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTradeChange = (newTrade: TradeType) => {
    setTrade(newTrade);
    const starter = TRADE_STARTERS[newTrade];
    if (starter) {
      setTagline(starter.tagline);
      setDefaultTaxRate(starter.defaultTax);
      setDefaultDepositPercent(starter.defaultDeposit);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name is required');
      return;
    }
    if (!email.trim() || !phone.trim()) {
      setError('Company email and phone number are required');
      return;
    }

    const businessId = `biz_${Date.now()}`;
    const newBusiness: BusinessProfile = {
      id: businessId,
      name: name.trim(),
      tagline: tagline.trim() || `${trade.toUpperCase()} Specialists`,
      trade,
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim() || `www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      accentColor: '#1e3a8a',
      address: address.trim() || 'Headquarters',
      city: city.trim() || 'Metro',
      state: state.trim() || 'CA',
      zip: zip.trim() || '90001',
      licenseNumber: licenseNumber.trim() || `${state} Lic #Pending`,
      insuranceInfo: insuranceInfo.trim(),
      currencySymbol: currencySymbol.trim() || '$',
      defaultTaxRate: Number(defaultTaxRate) || 0,
      defaultDepositPercent: Number(defaultDepositPercent) || 30,
      defaultPaymentTerms: `${defaultDepositPercent}% deposit required upon quote acceptance. Balance due upon completion and final walkthrough.`,
      defaultWarrantyTerms: '1-Year comprehensive warranty on all craftsmanship. Manufacturer warranties apply on installed equipment.',
    };

    let generatedTemplates: CatalogTemplate[] = [];
    if (seedTemplates && TRADE_STARTERS[trade]) {
      generatedTemplates = TRADE_STARTERS[trade].starterItems.map((item, idx) => ({
        id: `tmpl_${businessId}_${idx + 1}`,
        trade,
        title: item.title,
        description: item.description,
        category: item.category,
        defaultQuantity: 1,
        defaultUnit: item.defaultUnit,
        defaultPrice: item.defaultPrice,
        defaultCost: item.defaultCost,
        taxable: item.taxable,
        isPopular: !!item.isPopular,
      }));
    }

    onCreateBusiness(newBusiness, generatedTemplates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Add New Company Workspace
              </h2>
              <p className="text-xs text-slate-400">
                Configure your contractor business identity, trade, and rates in seconds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Legal / DBA Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sierra Peak Roofing & Mechanical"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Trade Specialty *
              </label>
              <select
                value={trade}
                onChange={(e) => handleTradeChange(e.target.value as TradeType)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white capitalize"
              >
                <option value="plumbing">Plumbing & Mechanical</option>
                <option value="electrical">Electrical & EV Charging</option>
                <option value="hvac">HVAC & Heat Pumps</option>
                <option value="landscaping">Landscaping & Hardscaping</option>
                <option value="painting">Painting & Drywall</option>
                <option value="roofing">Roofing & Gutters</option>
                <option value="general_contracting">General Contracting</option>
                <option value="handyman">Handyman Services</option>
                <option value="cleaning">Cleaning & Turnover</option>
                <option value="auto_detailing">Auto Detailing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline / Specialty
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="text"
                required
                placeholder="(555) 234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email *
              </label>
              <input
                type="email"
                required
                placeholder="estimates@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                placeholder="100 Commercial Blvd, Suite 200"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City, State, Zip
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-xs px-2.5 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="text-xs px-2.5 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 uppercase"
                />
                <input
                  type="text"
                  placeholder="Zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="text-xs px-2.5 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contractor License #
              </label>
              <input
                type="text"
                placeholder="e.g. CSLB #1094821"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            {/* Financial defaults */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 font-mono"
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
                value={defaultDepositPercent}
                onChange={(e) => setDefaultDepositPercent(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 font-mono"
              />
            </div>
          </div>

          {/* Starter Pricebook Checkbox */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 flex items-start gap-3">
            <input
              id="seedTemplates"
              type="checkbox"
              checked={seedTemplates}
              onChange={(e) => setSeedTemplates(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-blue-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
            />
            <label htmlFor="seedTemplates" className="cursor-pointer text-xs">
              <span className="font-bold text-slate-900 block">
                Pre-load Starter Price Book for {trade.toUpperCase()}
              </span>
              <span className="text-slate-600 block mt-0.5">
                Automatically populates standard trade labor rates, certified materials, and common service items so you can start generating client quotes immediately.
              </span>
            </label>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Create Company & Open Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
