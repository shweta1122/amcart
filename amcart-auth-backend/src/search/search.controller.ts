import { Controller, Get, Post, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchSeedService } from './search-seed.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { SuggestDto } from './dto/suggest.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly seedService: SearchSeedService,
  ) {}

  /**
   * GET /search
   *
   * Full-text product search with filters, sorting, pagination.
   * Returns products + aggregations for faceted filter UI.
   *
   * Example:
   *   GET /search?q=running+shoes&categoryId=abc&minPrice=50&sortBy=price_asc&page=1
   */
  @Get()
  @ApiOperation({ summary: 'Search products with full-text and filters' })
  @ApiResponse({ status: 200, description: 'Search results with aggregations' })
  async search(@Query() dto: SearchProductsDto) {
    return this.searchService.searchProducts(dto);
  }

  /**
   * GET /search/suggest
   *
   * Lightweight autocomplete suggestions for the search bar.
   *
   * Example:
   *   GET /search/suggest?q=run&limit=5
   */
  @Get('suggest')
  @ApiOperation({ summary: 'Autocomplete search suggestions' })
  async suggest(@Query() dto: SuggestDto) {
    return this.searchService.suggest(dto.q, dto.limit);
  }

  /**
   * POST /search/seed
   *
   * Fetch products from Platzi Fake Store API and index them.
   * Only seeds if the index is empty. Safe to call multiple times.
   *
   * TODO: Protect with @UseGuards(AdminGuard) in production.
   */
  @Post('seed')
  @HttpCode(200)
  @ApiOperation({ summary: 'Seed search index from Platzi API (if empty)' })
  async seed() {
    return this.seedService.seedIfEmpty();
  }

  /**
   * POST /search/force-seed
   *
   * Drop all indexed data and reseed from Platzi API.
   * Destructive — use with caution.
   *
   * TODO: Protect with @UseGuards(AdminGuard) in production.
   */
  @Post('force-seed')
  @HttpCode(200)
  @ApiOperation({ summary: 'Drop index and reseed from Platzi API' })
  async forceSeed() {
    return this.seedService.forceSeed();
  }

  /**
   * POST /search/reindex
   *
   * Drop and recreate the empty index (no data).
   * Use force-seed to recreate AND repopulate.
   */
  @Post('reindex')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rebuild empty search index' })
  async reindex() {
    await this.searchService.reindex();
    return { message: 'Index recreated (empty). Call POST /search/seed to populate.' };
  }
}