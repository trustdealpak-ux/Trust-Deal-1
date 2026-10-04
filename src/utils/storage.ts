import { BusinessProfile, CatalogTemplate, ClientRecord, ServiceQuote } from '../types';
import { INITIAL_BUSINESSES, INITIAL_CLIENTS, INITIAL_QUOTES, INITIAL_TEMPLATES } from '../data/initialData';

const STORAGE_KEYS = {
  BUSINESSES: 'quoteforge_businesses_v1',
  ACTIVE_BUSINESS_ID: 'quoteforge_active_biz_id_v1',
  QUOTES: 'quoteforge_quotes_v1',
  TEMPLATES: 'quoteforge_templates_v1',
  CLIENTS: 'quoteforge_clients_v1',
};

export function loadBusinesses(): BusinessProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUSINESSES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load businesses:', err);
  }
  saveBusinesses(INITIAL_BUSINESSES);
  return INITIAL_BUSINESSES;
}

export function saveBusinesses(businesses: BusinessProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(businesses));
  } catch (err) {
    console.error('Failed to save businesses:', err);
  }
}

export function loadActiveBusinessId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_BUSINESS_ID);
    if (id) return id;
  } catch (err) {
    console.error('Failed to load active business ID:', err);
  }
  return INITIAL_BUSINESSES[0].id;
}

export function saveActiveBusinessId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BUSINESS_ID, id);
  } catch (err) {
    console.error('Failed to save active business ID:', err);
  }
}

export function loadQuotes(): ServiceQuote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load quotes:', err);
  }
  saveQuotes(INITIAL_QUOTES);
  return INITIAL_QUOTES;
}

export function saveQuotes(quotes: ServiceQuote[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  } catch (err) {
    console.error('Failed to save quotes:', err);
  }
}

export function loadTemplates(): CatalogTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load templates:', err);
  }
  saveTemplates(INITIAL_TEMPLATES);
  return INITIAL_TEMPLATES;
}

export function saveTemplates(templates: CatalogTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save templates:', err);
  }
}

export function loadClients(): ClientRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load clients:', err);
  }
  saveClients(INITIAL_CLIENTS);
  return INITIAL_CLIENTS;
}

export function saveClients(clients: ClientRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  } catch (err) {
    console.error('Failed to save clients:', err);
  }
}

export function resetToDemoData(): void {
  localStorage.removeItem(STORAGE_KEYS.BUSINESSES);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_BUSINESS_ID);
  localStorage.removeItem(STORAGE_KEYS.QUOTES);
  localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
  localStorage.removeItem(STORAGE_KEYS.CLIENTS);
  window.location.reload();
}
