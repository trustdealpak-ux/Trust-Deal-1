import { db } from './index.ts';
import { businesses, clients, quotes, templates } from './schema.ts';
import { eq } from 'drizzle-orm';

// Quotes
export async function getQuotesFromDb() {
  try {
    return await db.select().from(quotes);
  } catch (error) {
    console.error('Failed to get quotes from database:', error);
    throw new Error('Database query for quotes failed.', { cause: error });
  }
}

export async function saveQuoteToDb(data: any) {
  try {
    const existing = await db.select().from(quotes).where(eq(quotes.id, data.id));
    if (existing.length > 0) {
      const updated = await db
        .update(quotes)
        .set({
          quoteNumber: data.quoteNumber,
          businessId: data.businessId,
          status: data.status,
          projectTitle: data.projectTitle,
          projectScopeSummary: data.projectScopeSummary || null,
          client: data.client,
          isTiered: data.isTiered ?? false,
          singleItems: data.singleItems || [],
          tiers: data.tiers || [],
          selectedTierId: data.selectedTierId || null,
          discountType: data.discountType || 'none',
          discountValue: data.discountValue || 0,
          depositRequiredPercent: data.depositRequiredPercent || 30,
          estimatedStartDate: data.estimatedStartDate || null,
          estimatedDuration: data.estimatedDuration || null,
          termsAndConditions: data.termsAndConditions || null,
          warrantyTerms: data.warrantyTerms || null,
          notesToCustomer: data.notesToCustomer || null,
          clientSignature: data.clientSignature || null,
          sentAt: data.sentAt || null,
          viewedAt: data.viewedAt || null,
          acceptedAt: data.acceptedAt || null,
          validUntil: data.validUntil || null,
        })
        .where(eq(quotes.id, data.id))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(quotes)
        .values({
          id: data.id,
          quoteNumber: data.quoteNumber,
          businessId: data.businessId,
          status: data.status || 'draft',
          projectTitle: data.projectTitle,
          projectScopeSummary: data.projectScopeSummary || null,
          client: data.client,
          isTiered: data.isTiered ?? false,
          singleItems: data.singleItems || [],
          tiers: data.tiers || [],
          selectedTierId: data.selectedTierId || null,
          discountType: data.discountType || 'none',
          discountValue: data.discountValue || 0,
          depositRequiredPercent: data.depositRequiredPercent || 30,
          estimatedStartDate: data.estimatedStartDate || null,
          estimatedDuration: data.estimatedDuration || null,
          termsAndConditions: data.termsAndConditions || null,
          warrantyTerms: data.warrantyTerms || null,
          notesToCustomer: data.notesToCustomer || null,
          clientSignature: data.clientSignature || null,
          sentAt: data.sentAt || null,
          viewedAt: data.viewedAt || null,
          acceptedAt: data.acceptedAt || null,
          validUntil: data.validUntil || null,
        })
        .returning();
      return inserted[0];
    }
  } catch (error) {
    console.error(`Failed to save quote ${data.id}:`, error);
    throw new Error('Database operation for saving quote failed.', { cause: error });
  }
}

export async function deleteQuoteFromDb(id: string) {
  try {
    return await db.delete(quotes).where(eq(quotes.id, id)).returning();
  } catch (error) {
    console.error(`Failed to delete quote ${id}:`, error);
    throw new Error('Database operation for deleting quote failed.', { cause: error });
  }
}

// Clients
export async function getClientsFromDb() {
  try {
    return await db.select().from(clients);
  } catch (error) {
    console.error('Failed to get clients from database:', error);
    throw new Error('Database query for clients failed.', { cause: error });
  }
}

export async function saveClientToDb(data: any) {
  try {
    const existing = await db.select().from(clients).where(eq(clients.id, data.id));
    if (existing.length > 0) {
      const updated = await db
        .update(clients)
        .set({
          businessId: data.businessId,
          name: data.name,
          companyName: data.companyName || null,
          email: data.email,
          phone: data.phone,
          serviceAddress: data.serviceAddress,
          billingAddressSame: data.billingAddressSame ?? true,
          billingAddress: data.billingAddress || null,
          tag: data.tag || null,
          notes: data.notes || null,
        })
        .where(eq(clients.id, data.id))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(clients)
        .values({
          id: data.id,
          businessId: data.businessId,
          name: data.name,
          companyName: data.companyName || null,
          email: data.email,
          phone: data.phone,
          serviceAddress: data.serviceAddress,
          billingAddressSame: data.billingAddressSame ?? true,
          billingAddress: data.billingAddress || null,
          tag: data.tag || null,
          notes: data.notes || null,
        })
        .returning();
      return inserted[0];
    }
  } catch (error) {
    console.error(`Failed to save client ${data.id}:`, error);
    throw new Error('Database operation for saving client failed.', { cause: error });
  }
}

export async function deleteClientFromDb(id: string) {
  try {
    return await db.delete(clients).where(eq(clients.id, id)).returning();
  } catch (error) {
    console.error(`Failed to delete client ${id}:`, error);
    throw new Error('Database operation for deleting client failed.', { cause: error });
  }
}

// Businesses
export async function getBusinessesFromDb() {
  try {
    return await db.select().from(businesses);
  } catch (error) {
    console.error('Failed to get businesses from database:', error);
    throw new Error('Database query for businesses failed.', { cause: error });
  }
}

export async function saveBusinessToDb(data: any) {
  try {
    const existing = await db.select().from(businesses).where(eq(businesses.id, data.id));
    if (existing.length > 0) {
      const updated = await db
        .update(businesses)
        .set({
          name: data.name,
          tagline: data.tagline || null,
          trade: data.trade,
          logoUrl: data.logoUrl || null,
          accentColor: data.accentColor || null,
          phone: data.phone,
          email: data.email,
          website: data.website || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip: data.zip || null,
          licenseNumber: data.licenseNumber || null,
          insuranceInfo: data.insuranceInfo || null,
          currencySymbol: data.currencySymbol || '$',
          defaultTaxRate: data.defaultTaxRate || 8.5,
          defaultDepositPercent: data.defaultDepositPercent || 30,
          defaultPaymentTerms: data.defaultPaymentTerms || null,
          defaultWarrantyTerms: data.defaultWarrantyTerms || null,
        })
        .where(eq(businesses.id, data.id))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(businesses)
        .values({
          id: data.id,
          userId: data.userId || null,
          name: data.name,
          tagline: data.tagline || null,
          trade: data.trade,
          logoUrl: data.logoUrl || null,
          accentColor: data.accentColor || null,
          phone: data.phone,
          email: data.email,
          website: data.website || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip: data.zip || null,
          licenseNumber: data.licenseNumber || null,
          insuranceInfo: data.insuranceInfo || null,
          currencySymbol: data.currencySymbol || '$',
          defaultTaxRate: data.defaultTaxRate || 8.5,
          defaultDepositPercent: data.defaultDepositPercent || 30,
          defaultPaymentTerms: data.defaultPaymentTerms || null,
          defaultWarrantyTerms: data.defaultWarrantyTerms || null,
        })
        .returning();
      return inserted[0];
    }
  } catch (error) {
    console.error(`Failed to save business ${data.id}:`, error);
    throw new Error('Database operation for saving business failed.', { cause: error });
  }
}

// Templates
export async function getTemplatesFromDb() {
  try {
    return await db.select().from(templates);
  } catch (error) {
    console.error('Failed to get templates from database:', error);
    throw new Error('Database query for templates failed.', { cause: error });
  }
}

export async function saveTemplateToDb(data: any) {
  try {
    const existing = await db.select().from(templates).where(eq(templates.id, data.id));
    if (existing.length > 0) {
      const updated = await db
        .update(templates)
        .set({
          trade: data.trade,
          title: data.title,
          description: data.description || null,
          category: data.category,
          defaultQuantity: data.defaultQuantity || 1,
          defaultUnit: data.defaultUnit || 'units',
          defaultPrice: data.defaultPrice,
          defaultCost: data.defaultCost,
          taxable: data.taxable ?? true,
          isPopular: data.isPopular ?? false,
        })
        .where(eq(templates.id, data.id))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(templates)
        .values({
          id: data.id,
          trade: data.trade,
          title: data.title,
          description: data.description || null,
          category: data.category,
          defaultQuantity: data.defaultQuantity || 1,
          defaultUnit: data.defaultUnit || 'units',
          defaultPrice: data.defaultPrice,
          defaultCost: data.defaultCost,
          taxable: data.taxable ?? true,
          isPopular: data.isPopular ?? false,
        })
        .returning();
      return inserted[0];
    }
  } catch (error) {
    console.error(`Failed to save template ${data.id}:`, error);
    throw new Error('Database operation for saving template failed.', { cause: error });
  }
}

export async function deleteTemplateFromDb(id: string) {
  try {
    return await db.delete(templates).where(eq(templates.id, id)).returning();
  } catch (error) {
    console.error(`Failed to delete template ${id}:`, error);
    throw new Error('Database operation for deleting template failed.', { cause: error });
  }
}
