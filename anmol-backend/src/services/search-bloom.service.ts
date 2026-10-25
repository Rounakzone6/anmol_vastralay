import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { BloomFilter } from '@backend/utils/bloom-filter';

@Injectable()
export class SearchBloomService implements OnModuleInit {
  private readonly logger = new Logger(SearchBloomService.name);
  private filter: BloomFilter;
  private isReady: boolean = false;
  private rebuildTimeout: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {
    // 50,000 estimated terms/prefixes with 1% false positive rate
    this.filter = new BloomFilter(50000, 0.01);
  }

  async onModuleInit() {
    // Build index in background without blocking server startup
    this.rebuildIndex().catch((err) => {
      this.logger.error(
        `Failed to initialize Search Bloom Filter: ${err.message}`,
        err.stack,
      );
    });
  }

  /**
   * Schedule a debounced rebuild (30s) to batch rapid catalog updates
   */
  public scheduleDebouncedRebuild(delayMs: number = 30000): void {
    if (this.rebuildTimeout) {
      clearTimeout(this.rebuildTimeout);
    }
    this.rebuildTimeout = setTimeout(() => {
      this.rebuildIndex().catch((err) => {
        this.logger.error(
          `Debounced Search Bloom Filter rebuild failed: ${err.message}`,
        );
      });
      this.rebuildTimeout = null;
    }, delayMs);
  }

  /**
   * Tokenize text into words and add both full words and their prefixes (>= 2 chars)
   */
  private addTextTokens(text?: string | null): void {
    if (!text) return;
    const words = text
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2);

    for (const word of words) {
      // Add prefixes from length 2 up to full length (e.g. "ku", "kur", "kurt", "kurti")
      for (let len = 2; len <= word.length; len++) {
        const prefix = word.substring(0, len);
        this.filter.add(prefix);
      }
    }
  }

  /**
   * Fully rebuild the Bloom filter index from all active products, categories & brands
   */
  public async rebuildIndex(): Promise<void> {
    try {
      this.logger.log('Rebuilding Search Bloom Filter index...');
      const newFilter = new BloomFilter(50000, 0.01);

      // 1. Fetch active products
      const products = await this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          name: true,
          brand: true,
          category: { select: { name: true } },
          subcategory: { select: { name: true } },
        },
      });

      // 2. Fetch active categories
      const categories = await this.prisma.category.findMany({
        where: { isActive: true },
        select: { name: true },
      });

      // Index categories
      for (const cat of categories) {
        this.addTextTokensToFilter(newFilter, cat.name);
      }

      // Index products
      for (const prod of products) {
        this.addTextTokensToFilter(newFilter, prod.name);
        this.addTextTokensToFilter(newFilter, prod.brand);
        this.addTextTokensToFilter(newFilter, prod.category?.name);
        this.addTextTokensToFilter(newFilter, prod.subcategory?.name);
      }

      this.filter = newFilter;
      this.isReady = true;

      const stats = this.filter.getStats();
      this.logger.log(
        `Search Bloom Filter ready! Indexed items: ${products.length} products, ${categories.length} categories. Total tokens: ${stats.estimatedItems}, Memory: ${(stats.sizeBytes / 1024).toFixed(1)} KB`,
      );
    } catch (err: any) {
      this.logger.warn(`Search Bloom Filter rebuild delayed: ${err.message}`);
    }
  }

  private addTextTokensToFilter(
    targetFilter: BloomFilter,
    text?: string | null,
  ): void {
    if (!text) return;
    const words = text
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2);

    for (const word of words) {
      for (let len = 2; len <= word.length; len++) {
        targetFilter.add(word.substring(0, len));
      }
    }
  }

  /**
   * Incrementally index a single product without full rebuild
   */
  public indexProduct(
    name: string,
    categoryName?: string,
    brand?: string,
  ): void {
    this.addTextTokens(name);
    this.addTextTokens(categoryName);
    this.addTextTokens(brand);
  }

  /**
   * Fast O(k) membership check for search queries.
   * If query is >= 2 chars and Bloom filter says false,
   * the term is GUARANTEED to NOT exist in any product, category, or brand.
   */
  public mightMatchQuery(query: string): boolean {
    if (!this.isReady) {
      // If index is still building, fail open so legitimate queries aren't blocked
      return true;
    }

    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return true;

    const words = trimmed
      .split(/[^a-z0-9]+/i)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2);

    if (words.length === 0) return true;

    // Check if at least one meaningful token prefix exists in the catalog
    // If every single word prefix fails the Bloom filter test, no match can exist.
    const anyTokenExists = words.some((word) => this.filter.has(word));
    return anyTokenExists;
  }

  public getStats() {
    return {
      ready: this.isReady,
      ...this.filter.getStats(),
    };
  }
}
