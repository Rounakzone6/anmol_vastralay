/**
 * High-performance, memory-efficient Bloom Filter implementation.
 * 
 * Uses the Kirsch-Mitzenmacher optimization (double hashing with FNV-1a & SDBM)
 * to generate k independent hash positions across m bits.
 * 
 * Mathematical properties:
 * - Zero False Negatives: If has(key) is false, the key is 100% GUARANTEED not in the set.
 * - Tunable False Positives: Default ~1% false positive probability.
 */
export class BloomFilter {
  private size: number; // m in bits
  private numHashes: number; // k hash functions
  private bitArray: Uint8Array;
  private count: number = 0;

  constructor(expectedItems: number = 20000, falsePositiveRate: number = 0.01) {
    // Optimal bit size: m = - (n * ln(p)) / (ln(2)^2)
    const m = Math.ceil(- (expectedItems * Math.log(falsePositiveRate)) / (Math.LN2 * Math.LN2));
    this.size = Math.max(m, 1024);

    // Optimal hash count: k = (m / n) * ln(2)
    const k = Math.round((this.size / expectedItems) * Math.LN2);
    this.numHashes = Math.max(2, Math.min(k, 12));

    this.bitArray = new Uint8Array(Math.ceil(this.size / 8));
  }

  // Primary Hash: FNV-1a 32-bit
  private hash1(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  // Secondary Hash: SDBM 32-bit
  private hash2(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash) >>> 0;
    }
    return hash >>> 0;
  }

  /**
   * Add a normalized string token into the Bloom filter
   */
  public add(item: string): void {
    const norm = item.trim().toLowerCase();
    if (!norm) return;

    const h1 = this.hash1(norm);
    const h2 = this.hash2(norm);

    for (let i = 0; i < this.numHashes; i++) {
      const bitIndex = (h1 + i * h2) % this.size;
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = bitIndex % 8;
      this.bitArray[byteIndex] |= (1 << bitOffset);
    }
    this.count++;
  }

  /**
   * Check if a token might exist in the Bloom filter.
   * Returns false if token is 100% NOT present.
   */
  public has(item: string): boolean {
    const norm = item.trim().toLowerCase();
    if (!norm) return false;

    const h1 = this.hash1(norm);
    const h2 = this.hash2(norm);

    for (let i = 0; i < this.numHashes; i++) {
      const bitIndex = (h1 + i * h2) % this.size;
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = bitIndex % 8;
      if ((this.bitArray[byteIndex] & (1 << bitOffset)) === 0) {
        return false; // Guaranteed absent
      }
    }
    return true; // Probable match
  }

  /**
   * Reset all bits to 0
   */
  public clear(): void {
    this.bitArray.fill(0);
    this.count = 0;
  }

  public getStats() {
    return {
      sizeBits: this.size,
      sizeBytes: this.bitArray.byteLength,
      numHashes: this.numHashes,
      estimatedItems: this.count,
    };
  }
}
