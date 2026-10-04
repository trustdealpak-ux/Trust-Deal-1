import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import {
  BusinessProfile,
  CatalogTemplate,
  ClientRecord,
  ServiceQuote,
} from './types';
import {
  INITIAL_BUSINESSES,
  INITIAL_CLIENTS,
  INITIAL_QUOTES,
  INITIAL_TEMPLATES,
} from './data/initialData';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Test connection on boot as mandated by Firebase specification
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: Client is offline.');
      return false;
    }
    // Expected if 'test/connection' doc doesn't exist yet, but server was reached
    return true;
  }
}

// Execute connection test
testConnection();

// Collection References
export const COLLECTIONS = {
  QUOTES: 'quotes',
  CLIENTS: 'clients',
  BUSINESSES: 'businesses',
  TEMPLATES: 'templates',
};

/**
 * Fetch all quotes from Firestore
 */
export async function fetchFirestoreQuotes(): Promise<ServiceQuote[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.QUOTES));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as ServiceQuote);
  } catch (err) {
    console.error('Error fetching quotes from Firestore:', err);
    return [];
  }
}

/**
 * Save or update a quote in Firestore
 */
export async function saveFirestoreQuote(quote: ServiceQuote): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.QUOTES, quote.id), quote, { merge: true });
  } catch (err) {
    console.error(`Error saving quote ${quote.id} to Firestore:`, err);
  }
}

/**
 * Delete a quote from Firestore
 */
export async function deleteFirestoreQuote(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.QUOTES, id));
  } catch (err) {
    console.error(`Error deleting quote ${id} from Firestore:`, err);
  }
}

/**
 * Fetch all clients from Firestore
 */
export async function fetchFirestoreClients(): Promise<ClientRecord[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.CLIENTS));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as ClientRecord);
  } catch (err) {
    console.error('Error fetching clients from Firestore:', err);
    return [];
  }
}

/**
 * Save or update a client in Firestore
 */
export async function saveFirestoreClient(client: ClientRecord): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.CLIENTS, client.id), client, { merge: true });
  } catch (err) {
    console.error(`Error saving client ${client.id} to Firestore:`, err);
  }
}

/**
 * Delete a client from Firestore
 */
export async function deleteFirestoreClient(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CLIENTS, id));
  } catch (err) {
    console.error(`Error deleting client ${id} from Firestore:`, err);
  }
}

/**
 * Fetch all templates from Firestore
 */
export async function fetchFirestoreTemplates(): Promise<CatalogTemplate[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.TEMPLATES));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as CatalogTemplate);
  } catch (err) {
    console.error('Error fetching templates from Firestore:', err);
    return [];
  }
}

/**
 * Save or update a template in Firestore
 */
export async function saveFirestoreTemplate(template: CatalogTemplate): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.TEMPLATES, template.id), template, { merge: true });
  } catch (err) {
    console.error(`Error saving template ${template.id} to Firestore:`, err);
  }
}

/**
 * Delete a template from Firestore
 */
export async function deleteFirestoreTemplate(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TEMPLATES, id));
  } catch (err) {
    console.error(`Error deleting template ${id} from Firestore:`, err);
  }
}

/**
 * Fetch all businesses from Firestore
 */
export async function fetchFirestoreBusinesses(): Promise<BusinessProfile[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.BUSINESSES));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as BusinessProfile);
  } catch (err) {
    console.error('Error fetching businesses from Firestore:', err);
    return [];
  }
}

/**
 * Save or update a business in Firestore
 */
export async function saveFirestoreBusiness(business: BusinessProfile): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.BUSINESSES, business.id), business, { merge: true });
  } catch (err) {
    console.error(`Error saving business ${business.id} to Firestore:`, err);
  }
}

/**
 * Seeds initial data into Firestore if collections are currently empty
 */
export async function seedInitialFirestoreData(): Promise<{
  quotes: ServiceQuote[];
  clients: ClientRecord[];
  templates: CatalogTemplate[];
  businesses: BusinessProfile[];
}> {
  try {
    const existingQuotes = await fetchFirestoreQuotes();
    const existingClients = await fetchFirestoreClients();
    const existingTemplates = await fetchFirestoreTemplates();
    const existingBusinesses = await fetchFirestoreBusinesses();

    let quotes = existingQuotes;
    let clients = existingClients;
    let templates = existingTemplates;
    let businesses = existingBusinesses;

    // Seed Quotes if empty
    if (quotes.length === 0) {
      quotes = INITIAL_QUOTES;
      for (const q of INITIAL_QUOTES) {
        await saveFirestoreQuote(q);
      }
    }

    // Seed Clients if empty
    if (clients.length === 0) {
      clients = INITIAL_CLIENTS;
      for (const c of INITIAL_CLIENTS) {
        await saveFirestoreClient(c);
      }
    }

    // Seed Templates if empty
    if (templates.length === 0) {
      templates = INITIAL_TEMPLATES;
      for (const t of INITIAL_TEMPLATES) {
        await saveFirestoreTemplate(t);
      }
    }

    // Seed Businesses if empty
    if (businesses.length === 0) {
      businesses = INITIAL_BUSINESSES;
      for (const b of INITIAL_BUSINESSES) {
        await saveFirestoreBusiness(b);
      }
    }

    return { quotes, clients, templates, businesses };
  } catch (err) {
    console.error('Failed to seed initial Firestore data:', err);
    return {
      quotes: INITIAL_QUOTES,
      clients: INITIAL_CLIENTS,
      templates: INITIAL_TEMPLATES,
      businesses: INITIAL_BUSINESSES,
    };
  }
}
