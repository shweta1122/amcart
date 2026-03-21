import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchProductsDto } from './dto/search-products.dto';

/* ─────────────────────────────────────────────
   INDEX CONFIGURATION
───────────────────────────────────────────── */
const PRODUCTS_INDEX = 'amcart_products';

/* ─────────────────────────────────────────────
   PRODUCT DOCUMENT SHAPE (for indexing)
───────────────────────────────────────────── */
export interface ProductDocument {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  category_name: string;
  product_code: string;
  stock_quantity: number;
  images: string[];
  created_at: Date;
  updated_at: Date;
}

/* ─────────────────────────────────────────────
   SERVICE
───────────────────────────────────────────── */
@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly esService: ElasticsearchService) {}

  /* ──────────────────────────────────────────
     LIFECYCLE
  ────────────────────────────────────────── */
  async onModuleInit() {
    await this.createIndexIfNotExists();
  }

  private async createIndexIfNotExists() {
    try {
      const exists = await this.esService.indices.exists({
        index: PRODUCTS_INDEX,
      });

      if (!exists) {
        await this.esService.indices.create({
          index: PRODUCTS_INDEX,
          settings: {
            analysis: {
              analyzer: {
                autocomplete_analyzer: {
                  type: 'custom',
                  tokenizer: 'autocomplete_tokenizer',
                  filter: ['lowercase'],
                },
              },
              tokenizer: {
                autocomplete_tokenizer: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 15,
                  token_chars: ['letter', 'digit'],
                },
              },
            },
            number_of_shards: 1,
            number_of_replicas: 1,
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'autocomplete_analyzer',
                    search_analyzer: 'standard',
                  },
                },
              },
              description: { type: 'text', analyzer: 'standard' },
              price: { type: 'scaled_float', scaling_factor: 100 },
              category_id: { type: 'keyword' },
              category_name: { type: 'keyword' },
              product_code: { type: 'keyword' },
              stock_quantity: { type: 'integer' },
              images: { type: 'keyword', index: false },
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
            },
          },
        });
        this.logger.log(`Created index: ${PRODUCTS_INDEX}`);
      } else {
        this.logger.log(`Index ${PRODUCTS_INDEX} already exists`);
      }
    } catch (error) {
      this.logger.error('Failed to create Elasticsearch index', error);
    }
  }

  /* ──────────────────────────────────────────
     SEARCH — Full product search with filters
  ────────────────────────────────────────── */
  async searchProducts(dto: SearchProductsDto) {
    const { q, categoryId, minPrice, maxPrice, sortBy, page, limit } = dto;

    const from = ((page || 1) - 1) * (limit || 20);
    const size = limit || 20;

    const must: any[] = [];
    const filter: any[] = [];

    if (q && q.trim()) {
      must.push({
        multi_match: {
          query: q,
          fields: ['title^3', 'title.autocomplete^2', 'description'],
          type: 'best_fields',
          fuzziness: 'AUTO',
          prefix_length: 1,
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    if (categoryId) {
      filter.push({ term: { category_id: categoryId } });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const range: Record<string, number> = {};
      if (minPrice !== undefined) range.gte = minPrice;
      if (maxPrice !== undefined) range.lte = maxPrice;
      filter.push({ range: { price: range } });
    }

    filter.push({ range: { stock_quantity: { gt: 0 } } });

    let sort: any;
    switch (sortBy) {
      case 'price_asc':
        sort = [{ price: { order: 'asc' } }];
        break;
      case 'price_desc':
        sort = [{ price: { order: 'desc' } }];
        break;
      case 'newest':
        sort = [{ created_at: { order: 'desc' } }];
        break;
      case 'relevance':
      default:
        sort = q?.trim()
          ? [{ _score: { order: 'desc' } }]
          : [{ created_at: { order: 'desc' } }];
        break;
    }

    try {
      const result = await this.esService.search({
        index: PRODUCTS_INDEX,
        from,
        size,
        query: { bool: { must, filter } },
        sort,
        aggs: {
          categories: {
            terms: { field: 'category_name', size: 20 },
          },
          price_stats: {
            stats: { field: 'price' },
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { key: 'Under $50', to: 50 },
                { key: '$50 - $200', from: 50, to: 200 },
                { key: '$200 - $500', from: 200, to: 500 },
                { key: '$500 - $1000', from: 500, to: 1000 },
                { key: 'Over $1000', from: 1000 },
              ],
            },
          },
        },
        highlight: {
          fields: {
            title: { pre_tags: ['<mark>'], post_tags: ['</mark>'] },
            description: {
              pre_tags: ['<mark>'],
              post_tags: ['</mark>'],
              fragment_size: 150,
            },
          },
        },
      });

      const hits = result.hits.hits;
      const total =
        typeof result.hits.total === 'number'
          ? result.hits.total
          : result.hits.total?.value || 0;

      return {
        products: hits.map((hit: any) => ({
          ...hit._source,
          _score: hit._score,
          highlight: hit.highlight || {},
        })),
        total,
        page: page || 1,
        limit: size,
        totalPages: Math.ceil(total / size),
        aggregations: {
          categories: (result.aggregations?.categories as any)?.buckets || [],
          priceStats: result.aggregations?.price_stats || {},
          priceRanges:
            (result.aggregations?.price_ranges as any)?.buckets || [],
        },
      };
    } catch (error) {
      this.logger.error('Search failed', error);
      throw error;
    }
  }

  /* ──────────────────────────────────────────
     SUGGEST — Autocomplete for search bar
  ────────────────────────────────────────── */
  async suggest(query: string, limit: number = 5) {
    try {
      const result = await this.esService.search({
        index: PRODUCTS_INDEX,
        size: limit,
        query: {
          multi_match: {
            query,
            fields: ['title.autocomplete^2', 'title'],
            type: 'best_fields',
          },
        },
        _source: ['id', 'title', 'price', 'category_name', 'images'],
      });

      return result.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error('Suggest failed', error);
      return [];
    }
  }

  /* ──────────────────────────────────────────
     INDEXING — Called from product/ module
  ────────────────────────────────────────── */

  /** Index a single product (on create/update) */
  async indexProduct(product: ProductDocument) {
    try {
      const { id, ...doc } = product;
      await this.esService.index({
        index: PRODUCTS_INDEX,
        id,
        document: doc,
        refresh: 'wait_for',
      });
      this.logger.debug(`Indexed product: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to index product ${product.id}`, error);
    }
  }

  /** Remove a product from index (on delete) */
  async removeProduct(productId: string) {
    try {
      await this.esService.delete({
        index: PRODUCTS_INDEX,
        id: productId,
        refresh: 'wait_for',
      });
      this.logger.debug(`Removed from index: ${productId}`);
    } catch (error) {
      this.logger.error(`Failed to remove ${productId} from index`, error);
    }
  }

  /** Bulk index all products from PostgreSQL */
  async bulkIndexProducts(products: ProductDocument[]) {
    if (products.length === 0) return;

    const operations = products.flatMap((product) => {
      const { id, ...doc } = product;
      return [{ index: { _index: PRODUCTS_INDEX, _id: id } }, doc];
    });

    try {
      const result = await this.esService.bulk({
        refresh: true,
        operations,
      });

      const errors = result.items.filter((item: any) => item.index?.error);
      if (errors.length > 0) {
        this.logger.warn(
          `Bulk index: ${errors.length}/${products.length} errors`,
        );
      }
      this.logger.log(
        `Bulk indexed ${products.length - errors.length} products`,
      );
    } catch (error) {
      this.logger.error('Bulk indexing failed', error);
    }
  }

  /** Drop and recreate the index (admin reindex) */
  async reindex() {
    try {
      const exists = await this.esService.indices.exists({
        index: PRODUCTS_INDEX,
      });
      if (exists) {
        await this.esService.indices.delete({ index: PRODUCTS_INDEX });
        this.logger.log(`Deleted index: ${PRODUCTS_INDEX}`);
      }
      await this.createIndexIfNotExists();
    } catch (error) {
      this.logger.error('Reindex failed', error);
    }
  }
}