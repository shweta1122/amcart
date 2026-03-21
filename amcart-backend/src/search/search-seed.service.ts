import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SearchService, ProductDocument } from './search.service';
import { ConfigService } from '@nestjs/config';

/**
 * SearchSeedService
 * ─────────────────────────────────────────────
 * Fetches products from Platzi Fake Store API and
 * bulk indexes them into Elasticsearch.
 *
 * Runs automatically on app startup if SEED_SEARCH=true
 * in your .env file. Only seeds if the index is empty.
 *
 * To force a reseed, hit: POST /api/search/seed
 *
 * When you build the real Product module later,
 * delete this file and use bulkIndexProducts()
 * from your ProductService instead.
 */

const PLATZI_API = 'https://api.escuelajs.co/api/v1/products';
const BATCH_SIZE = 50; // Platzi API limit per request
const TOTAL_TO_FETCH = 200; // How many products to seed

interface PlatziProduct {
  id: number;
  title: string;
  slug: string;
  price: number;
  description: string;
  category: {
    id: number;
    name: string;
    slug: string;
    image: string;
  };
  images: string[];
  creationAt?: string;
  updatedAt?: string;
}

@Injectable()
export class SearchSeedService implements OnModuleInit {
  private readonly logger = new Logger(SearchSeedService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    // Auto-seed on startup if SEED_SEARCH=true
    const shouldSeed = this.config.get('SEED_SEARCH', 'false') === 'true';
    if (shouldSeed) {
      // Small delay to let Elasticsearch index creation finish
      setTimeout(() => this.seedIfEmpty(), 3000);
    }
  }

  /**
   * Only seeds if the index has zero documents.
   * Safe to call multiple times.
   */
  async seedIfEmpty(): Promise<{ seeded: boolean; count: number }> {
    try {
      // Check if index already has data
      const result = await this.searchService.searchProducts({
        page: 1,
        limit: 1,
      });

      if (result.total > 0) {
        this.logger.log(
          `Index already has ${result.total} products, skipping seed`,
        );
        return { seeded: false, count: result.total };
      }

      return this.seed();
    } catch (error) {
      this.logger.error('Seed check failed, attempting seed anyway', error);
      return this.seed();
    }
  }

  /**
   * Force seed — drops existing data and reindexes.
   */
  async forceSeed(): Promise<{ seeded: boolean; count: number }> {
    await this.searchService.reindex();
    // Wait a moment for index recreation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return this.seed();
  }

  /**
   * Fetch from Platzi API and bulk index into Elasticsearch.
   */
  private async seed(): Promise<{ seeded: boolean; count: number }> {
    this.logger.log('Seeding Elasticsearch from Platzi Fake Store API...');

    const allProducts: ProductDocument[] = [];

    // Fetch in batches
    for (let offset = 0; offset < TOTAL_TO_FETCH; offset += BATCH_SIZE) {
      try {
        const url = `${PLATZI_API}?offset=${offset}&limit=${BATCH_SIZE}`;
        const response = await fetch(url);

        if (!response.ok) {
          this.logger.warn(`Platzi API returned ${response.status} at offset ${offset}`);
          break;
        }

        const products: PlatziProduct[] = await response.json();

        if (products.length === 0) break;

        // Map Platzi shape → our ProductDocument shape
        const mapped = products
          .filter((p) => p.title && p.price >= 0) // skip invalid
          .map((p) => this.mapToProductDocument(p));

        allProducts.push(...mapped);

        this.logger.log(
          `Fetched batch: offset=${offset}, got ${products.length} products`,
        );
      } catch (error) {
        this.logger.error(`Failed to fetch batch at offset ${offset}`, error);
        break;
      }
    }

    if (allProducts.length === 0) {
      this.logger.warn('No products fetched from Platzi API');
      return { seeded: false, count: 0 };
    }

    // Bulk index into Elasticsearch
    await this.searchService.bulkIndexProducts(allProducts);

    this.logger.log(`Seed complete: ${allProducts.length} products indexed`);
    return { seeded: true, count: allProducts.length };
  }

  /**
   * Map a Platzi API product to our Elasticsearch document shape.
   */
  private mapToProductDocument(p: PlatziProduct): ProductDocument {
    // Clean image URLs — Platzi sometimes returns malformed ones
    const cleanImages = (p.images || []).map((img) => {
      if (!img) return 'https://placehold.co/400x400?text=No+Image';
      const cleaned = img.replace(/^\[?"?/, '').replace(/"?\]?$/, '');
      return cleaned.startsWith('http')
        ? cleaned
        : 'https://placehold.co/400x400?text=No+Image';
    });

    return {
      id: String(p.id),
      title: p.title,
      description: p.description || '',
      price: p.price,
      category_id: String(p.category?.id || 0),
      category_name: p.category?.name || 'Uncategorized',
      product_code: `PLATZI-${p.id}`,
      stock_quantity: Math.floor(Math.random() * 100) + 1, // Platzi has no stock, so random
      images: cleanImages,
      created_at: p.creationAt ? new Date(p.creationAt) : new Date(),
      updated_at: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    };
  }
}