export type TradeType =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'landscaping'
  | 'painting'
  | 'roofing'
  | 'cleaning'
  | 'handyman'
  | 'auto_detailing'
  | 'general_contracting';

export type LineItemCategory =
  | 'labor'
  | 'materials'
  | 'permits_equipment'
  | 'service_fee'
  | 'other';

export type UnitType =
  | 'hours'
  | 'sq ft'
  | 'units'
  | 'flat rate'
  | 'linear ft'
  | 'days'
  | 'rooms'
  | 'trips';

export interface LineItem {
  id: string;
  category: LineItemCategory;
  description: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  unitCost?: number; // internal contractor cost for margin calculation
  taxable: boolean;
  isOptional?: boolean; // Client can check/uncheck in proposal
  selected?: boolean; // If optional, whether it's currently selected
}

export interface QuoteTier {
  id: string;
  name: string; // e.g. "Standard Repair", "Full Overhaul", "Premium High-Efficiency"
  tagline: string;
  isRecommended?: boolean;
  items: LineItem[];
  warrantyYears?: number;
  notes?: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'invoiced';

export interface ClientInfo {
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  serviceAddress: string;
  billingAddressSame: boolean;
  billingAddress?: string;
}

export type ClientTag = 'residential' | 'commercial' | 'vip' | 'property_manager' | 'lead';

export interface ClientRecord {
  id: string;
  businessId: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  serviceAddress: string;
  billingAddressSame: boolean;
  billingAddress?: string;
  tag?: ClientTag;
  notes?: string;
  createdAt: string;
}

export interface ClientSignature {
  signerName: string;
  signedAt: string;
  signatureDataUrl?: string;
  termsAccepted: boolean;
}

export interface ServiceQuote {
  id: string;
  quoteNumber: string;
  businessId: string;
  createdAt: string;
  validUntil: string;
  status: QuoteStatus;
  
  // Client and Project details
  client: ClientInfo;
  projectTitle: string;
  projectScopeSummary: string;
  
  // Pricing Structure
  isTiered: boolean;
  singleItems: LineItem[];
  tiers?: QuoteTier[];
  selectedTierId?: string; // which tier was selected by client or contractor
  
  // Financial modifiers
  discountType: 'none' | 'percent' | 'fixed';
  discountValue: number;
  customTaxRate?: number; // overrides business default if set
  depositRequiredPercent: number; // e.g. 25, 30, 50%
  
  // Timeline and Execution
  estimatedStartDate?: string;
  estimatedDuration?: string; // e.g. "1-2 Business Days", "3-5 Hours"
  
  // Legal & Warranty
  termsAndConditions: string;
  warrantyTerms: string;
  notesToCustomer?: string;
  
  // Client Interaction
  clientSignature?: ClientSignature;
  clientNotes?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  tagline: string;
  trade: TradeType;
  logoUrl?: string;
  accentColor: string; // HEX color code
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  licenseNumber: string;
  insuranceInfo: string;
  currencySymbol: string;
  defaultTaxRate: number; // percentage
  defaultDepositPercent: number;
  defaultPaymentTerms: string;
  defaultWarrantyTerms: string;
}

export interface CatalogTemplate {
  id: string;
  trade: TradeType;
  title: string;
  description: string;
  category: LineItemCategory;
  defaultQuantity: number;
  defaultUnit: UnitType;
  defaultPrice: number;
  defaultCost: number;
  taxable: boolean;
  isPopular?: boolean;
}

export interface QuoteCalculations {
  subtotal: number;
  optionalAddonsTotal: number;
  selectedOptionalTotal: number;
  discountAmount: number;
  netTaxableSubtotal: number;
  taxAmount: number;
  total: number;
  depositRequired: number;
  balanceDue: number;
  estimatedCost: number;
  grossProfit: number;
  grossMarginPercent: number;
}
