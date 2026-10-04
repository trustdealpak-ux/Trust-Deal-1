import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users table (maps Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Businesses table
export const businesses = pgTable('businesses', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  tagline: text('tagline'),
  trade: text('trade').notNull(),
  logoUrl: text('logo_url'),
  accentColor: text('accent_color'),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  website: text('website'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  licenseNumber: text('license_number'),
  insuranceInfo: text('insurance_info'),
  currencySymbol: text('currency_symbol').default('$'),
  defaultTaxRate: doublePrecision('default_tax_rate').default(8.5),
  defaultDepositPercent: integer('default_deposit_percent').default(30),
  defaultPaymentTerms: text('default_payment_terms'),
  defaultWarrantyTerms: text('default_warranty_terms'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Clients table
export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull(),
  name: text('name').notNull(),
  companyName: text('company_name'),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  serviceAddress: text('service_address').notNull(),
  billingAddressSame: boolean('billing_address_same').default(true),
  billingAddress: text('billing_address'),
  tag: text('tag'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Quotes table
export const quotes = pgTable('quotes', {
  id: text('id').primaryKey(),
  quoteNumber: text('quote_number').notNull(),
  businessId: text('business_id').notNull(),
  status: text('status').notNull().default('draft'),
  projectTitle: text('project_title').notNull(),
  projectScopeSummary: text('project_scope_summary'),
  client: jsonb('client').notNull(),
  isTiered: boolean('is_tiered').default(false),
  singleItems: jsonb('single_items'),
  tiers: jsonb('tiers'),
  selectedTierId: text('selected_tier_id'),
  discountType: text('discount_type').default('none'),
  discountValue: doublePrecision('discount_value').default(0),
  depositRequiredPercent: integer('deposit_required_percent').default(30),
  estimatedStartDate: text('estimated_start_date'),
  estimatedDuration: text('estimated_duration'),
  termsAndConditions: text('terms_and_conditions'),
  warrantyTerms: text('warranty_terms'),
  notesToCustomer: text('notes_to_customer'),
  clientSignature: jsonb('client_signature'),
  sentAt: text('sent_at'),
  viewedAt: text('viewed_at'),
  acceptedAt: text('accepted_at'),
  validUntil: text('valid_until'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Templates table (Catalog line items)
export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  trade: text('trade').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  defaultQuantity: doublePrecision('default_quantity').default(1),
  defaultUnit: text('default_unit').default('units'),
  defaultPrice: doublePrecision('default_price').notNull(),
  defaultCost: doublePrecision('default_cost').notNull(),
  taxable: boolean('taxable').default(true),
  isPopular: boolean('is_popular').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ many }) => ({
  clients: many(clients),
  quotes: many(quotes),
}));

export const clientsRelations = relations(clients, ({ one }) => ({
  business: one(businesses, {
    fields: [clients.businessId],
    references: [businesses.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  business: one(businesses, {
    fields: [quotes.businessId],
    references: [businesses.id],
  }),
}));
