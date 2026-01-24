/**
 * Shipping Zone Service
 *
 * Manages shipping zones and rate calculation.
 * Supports flat, weight-tiered, and price-tiered rates.
 */

import { BaseDocumentService } from './document-service';
import { YAPPR_STOREFRONT_CONTRACT_ID, STOREFRONT_DOCUMENT_TYPES } from '../constants';
import { identifierToBase58, stringToIdentifierBytes } from './sdk-helpers';
import type {
  ShippingZone,
  ShippingZoneDocument,
  ShippingRateType,
  ShippingTier,
  ShippingAddress
} from '../types';

class ShippingZoneService extends BaseDocumentService<ShippingZone> {
  constructor() {
    super(STOREFRONT_DOCUMENT_TYPES.SHIPPING_ZONE, YAPPR_STOREFRONT_CONTRACT_ID);
  }

  protected transformDocument(doc: Record<string, unknown>): ShippingZone {
    const data = (doc.data || doc) as ShippingZoneDocument;

    // Convert storeId from byte array to base58
    const storeId = identifierToBase58(data.storeId) || '';

    // Parse JSON fields - handle both string (from SDK query) and object (from state transition)
    let postalPatterns: string[] | undefined;
    if (data.postalPatterns) {
      if (Array.isArray(data.postalPatterns)) {
        postalPatterns = data.postalPatterns;
      } else if (typeof data.postalPatterns === 'string') {
        try {
          postalPatterns = JSON.parse(data.postalPatterns);
        } catch {
          console.error('Failed to parse postalPatterns:', data.postalPatterns);
        }
      }
    }

    let tiers: ShippingTier[] | undefined;
    if (data.tiers) {
      if (Array.isArray(data.tiers)) {
        tiers = data.tiers;
      } else if (typeof data.tiers === 'string') {
        try {
          tiers = JSON.parse(data.tiers);
        } catch {
          console.error('Failed to parse tiers:', data.tiers);
        }
      }
    }

    return {
      id: (doc.$id || doc.id) as string,
      ownerId: (doc.$ownerId || doc.ownerId) as string,
      storeId,
      createdAt: new Date((doc.$createdAt || doc.createdAt) as number),
      $revision: doc.$revision as number | undefined,
      name: data.name,
      postalPatterns,
      countryPattern: data.countryPattern,
      rateType: data.rateType,
      flatRate: data.flatRate,
      tiers,
      currency: data.currency,
      priority: data.priority || 0
    };
  }

  /**
   * Get zones for a store
   */
  async getByStore(storeId: string): Promise<ShippingZone[]> {
    const { documents } = await this.query({
      where: [['storeId', '==', storeId]],
      orderBy: [['storeId', 'asc'], ['priority', 'asc']],
      limit: 100
    });

    return documents;
  }

  /**
   * Create a new shipping zone
   */
  async createZone(
    ownerId: string,
    storeId: string,
    data: {
      name: string;
      postalPatterns?: string[];
      countryPattern?: string;
      rateType: ShippingRateType;
      flatRate?: number;
      tiers?: ShippingTier[];
      currency?: string;
      priority?: number;
    }
  ): Promise<ShippingZone> {
    const documentData: Record<string, unknown> = {
      storeId: stringToIdentifierBytes(storeId),
      name: data.name,
      rateType: data.rateType
    };

    if (data.postalPatterns) documentData.postalPatterns = JSON.stringify(data.postalPatterns);
    if (data.countryPattern) documentData.countryPattern = data.countryPattern;
    if (data.flatRate !== undefined) documentData.flatRate = data.flatRate;
    if (data.tiers) documentData.tiers = JSON.stringify(data.tiers);
    if (data.currency) documentData.currency = data.currency;
    if (data.priority !== undefined) documentData.priority = data.priority;

    return this.create(ownerId, documentData);
  }

  /**
   * Update a shipping zone
   */
  async updateZone(
    zoneId: string,
    ownerId: string,
    storeId: string,
    data: Partial<{
      name: string;
      postalPatterns: string[];
      countryPattern: string;
      rateType: ShippingRateType;
      flatRate: number;
      tiers: ShippingTier[];
      currency: string;
      priority: number;
    }>
  ): Promise<ShippingZone> {
    // Fetch existing zone to preserve required fields
    const existing = await this.get(zoneId);
    if (!existing) {
      throw new Error('Shipping zone not found');
    }

    const documentData: Record<string, unknown> = {
      storeId: stringToIdentifierBytes(storeId),
      name: data.name ?? existing.name,
      rateType: data.rateType ?? existing.rateType
    };

    if (data.postalPatterns !== undefined) documentData.postalPatterns = JSON.stringify(data.postalPatterns);
    if (data.countryPattern !== undefined) documentData.countryPattern = data.countryPattern;
    if (data.flatRate !== undefined) documentData.flatRate = data.flatRate;
    if (data.tiers !== undefined) documentData.tiers = JSON.stringify(data.tiers);
    if (data.currency !== undefined) documentData.currency = data.currency;
    if (data.priority !== undefined) documentData.priority = data.priority;

    return this.update(zoneId, ownerId, documentData);
  }

  /**
   * Delete a shipping zone
   */
  async deleteZone(zoneId: string, ownerId: string): Promise<boolean> {
    return this.delete(zoneId, ownerId);
  }

  // =========================================================================
  // Rate Calculation Methods
  // =========================================================================

  /**
   * Find the matching zone for a shipping address
   */
  findMatchingZone(zones: ShippingZone[], address: ShippingAddress): ShippingZone | null {
    // Sort by priority (lower = higher priority)
    const sortedZones = [...zones].sort((a, b) => a.priority - b.priority);

    for (const zone of sortedZones) {
      const matchesPostal = this.matchesPostalPatterns(zone.postalPatterns, address.postalCode);
      const matchesCountry = this.matchesCountryPattern(zone.countryPattern, address.country, address.state);

      if (matchesPostal && matchesCountry) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Check if postal code matches any of the patterns
   */
  private matchesPostalPatterns(patterns: string[] | undefined, postalCode: string): boolean {
    if (!patterns || patterns.length === 0) {
      return true; // No patterns = matches all
    }

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(postalCode)) {
          return true;
        }
      } catch {
        console.error('Invalid postal pattern:', pattern);
      }
    }

    return false;
  }

  /**
   * Check if country (and optionally state) matches the pattern
   * Pattern formats:
   *   "US"      - matches country US (any state)
   *   "US|CA"   - regex: matches US OR CA
   *   "US.IL"   - matches US, state IL specifically
   *   "US.IL|US.CA" - regex: matches (US, IL) OR (US, CA)
   */
  private matchesCountryPattern(pattern: string | undefined, country: string, state?: string): boolean {
    if (!pattern) {
      return true; // No pattern = matches all
    }

    // Check if pattern uses dot notation for country.state
    // We need to handle this before regex to properly escape dots
    if (pattern.includes('.')) {
      // Convert "US.IL" to a test function, handle regex OR patterns like "US.IL|US.CA"
      const parts = pattern.split('|');
      for (const part of parts) {
        if (part.includes('.')) {
          const [patternCountry, patternState] = part.split('.');
          const countryMatches = patternCountry.toUpperCase() === country.toUpperCase();
          const stateMatches = state ? patternState.toUpperCase() === state.toUpperCase() : false;
          if (countryMatches && stateMatches) {
            return true;
          }
        } else {
          // Part without dot - just match country
          if (part.toUpperCase() === country.toUpperCase()) {
            return true;
          }
        }
      }
      return false;
    }

    // No dots - use regex matching (supports patterns like "US|CA")
    try {
      const regex = new RegExp(`^(${pattern})$`, 'i');
      return regex.test(country);
    } catch {
      console.error('Invalid country pattern:', pattern);
      return false;
    }
  }

  /**
   * Calculate shipping rate for a zone
   */
  calculateRate(zone: ShippingZone, params: { totalWeight?: number; subtotal?: number }): number {
    switch (zone.rateType) {
      case 'flat':
        return zone.flatRate || 0;

      case 'weight_tiered':
        return this.findTierRate(zone.tiers, params.totalWeight || 0);

      case 'price_tiered':
        return this.findTierRate(zone.tiers, params.subtotal || 0);

      default:
        return 0;
    }
  }

  /**
   * Find the rate for a value within tiers
   */
  private findTierRate(tiers: ShippingTier[] | undefined, value: number): number {
    if (!tiers || tiers.length === 0) {
      return 0;
    }

    // Sort tiers by min value
    const sortedTiers = [...tiers].sort((a, b) => a.min - b.min);

    for (const tier of sortedTiers) {
      if (value >= tier.min && value <= tier.max) {
        return tier.rate;
      }
    }

    // If above all tiers, use the highest tier's rate
    const highestTier = sortedTiers[sortedTiers.length - 1];
    if (value > highestTier.max) {
      return highestTier.rate;
    }

    // If below all tiers, use the lowest tier's rate
    return sortedTiers[0].rate;
  }

  /**
   * Calculate shipping cost for an order
   */
  async calculateShipping(
    storeId: string,
    address: ShippingAddress,
    params: { totalWeight?: number; subtotal?: number }
  ): Promise<{ zone: ShippingZone | null; cost: number }> {
    const zones = await this.getByStore(storeId);
    const zone = this.findMatchingZone(zones, address);

    if (!zone) {
      return { zone: null, cost: 0 };
    }

    const cost = this.calculateRate(zone, params);
    return { zone, cost };
  }
}

export const shippingZoneService = new ShippingZoneService();
