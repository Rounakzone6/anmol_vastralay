import { BloomFilter } from './bloom-filter';

describe('BloomFilter Data Structure', () => {
  it('guarantees ZERO false negatives across all inserted tokens', () => {
    const ITEMS_COUNT = 3000;
    const filter = new BloomFilter(ITEMS_COUNT, 0.01);

    const inserted: string[] = [];
    for (let i = 0; i < ITEMS_COUNT; i++) {
      const term = `ethnic_apparel_token_${i}_banarasi_silk`;
      inserted.push(term);
      filter.add(term);
    }

    // Mathematical Guarantee: Every single inserted item MUST test positive
    for (const term of inserted) {
      expect(filter.has(term)).toBe(true);
    }
  });

  it('keeps the empirical false positive rate under the target threshold (<= 2%)', () => {
    const CAPACITY = 5000;
    const TARGET_FPR = 0.01; // 1%
    const filter = new BloomFilter(CAPACITY, TARGET_FPR);

    // 1. Insert 5,000 items
    for (let i = 0; i < CAPACITY; i++) {
      filter.add(`catalog_product_id_${i}`);
    }

    // 2. Query 10,000 items that were NEVER inserted
    const TEST_SAMPLES = 10000;
    let falsePositives = 0;

    for (let i = 0; i < TEST_SAMPLES; i++) {
      const nonExistent = `definitely_uninserted_query_${i}_xyz_random`;
      if (filter.has(nonExistent)) {
        falsePositives++;
      }
    }

    const empiricalFpr = falsePositives / TEST_SAMPLES;
    console.log(
      `Measured False Positive Rate: ${(empiricalFpr * 100).toFixed(2)}% (${falsePositives}/${TEST_SAMPLES})`,
    );

    // Measured FPR should stay within reasonable probabilistic bounds (<= 2% when p=0.01)
    expect(empiricalFpr).toBeLessThanOrEqual(0.02);
  });

  it('handles case-insensitivity, whitespace, and empty input cleanly', () => {
    const filter = new BloomFilter(100, 0.01);

    filter.add('  Banarasi Silk  ');
    expect(filter.has('banarasi silk')).toBe(true);
    expect(filter.has('BANARASI SILK')).toBe(true);
    expect(filter.has('  banarasi silk  ')).toBe(true);

    filter.add('');
    filter.add('   ');
    expect(filter.has('')).toBe(false);
  });
});
