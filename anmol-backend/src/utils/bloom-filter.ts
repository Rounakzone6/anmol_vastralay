/**
 * High-performance, memory-efficient Bloom Filter implementation.
 * 
 * Uses Kirsch-Mitzenmacher optimization (double hashing) with 32-bit modular
 * stepping to generate k independent, uniformly distributed bit positions across m bits.
 * 
 * Mathematical properties:
 * - Zero False Negatives: If has(key) is false, the key is 100% GUARANTEED not in the set.
 * - Measured False Positives: Accurately targets p <= 0.01 (1%).
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
    this.numHashes = Math.max(2, Math.min(k, 14));

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

  // Secondary Hash: Murmur-style mixer with alternate seed
  private hash2(str: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x5bd1e995);
      hash ^= hash >>> 15;
    }
    // Ensure step size is non-zero and odd for maximal cycle length
    return ((hash >>> 0) | 1) >>> 0;
  }

  /**
   * Add a normalized string token into the Bloom filter
   */
  public add(item: string): void {
    const norm = item.trim().toLowerCase();
    if (!norm) return;

    const h1 = this.hash1(norm);
    const h2 = this.hash2(norm);

    let combined = h1;
    for (let i = 0; i < this.numHashes; i++) {
      const bitIndex = (combined >>> 0) % this.size;
      const byteIndex = (bitIndex / 8) | 0;
      const bitOffset = bitIndex % 8;
      this.bitArray[byteIndex] |= (1 << bitOffset);
      combined = (combined + h2) >>> 0;
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

    let combined = h1;
    for (let i = 0; i < this.numHashes; i++) {
      const bitIndex = (combined >>> 0) % this.size;
      const byteIndex = (bitIndex / 8) | 0;
      const bitOffset = bitIndex % 8;
      if ((this.bitArray[byteIndex] & (1 << bitOffset)) === 0) {
        return false;
      }
      combined = (combined + h2) >>> 0;
    }

    return true;
  }

  public getStats() {
    return {
      sizeBits: this.size,
      sizeBytes: this.bitArray.length,
      numHashes: this.numHashes,
      estimatedItems: this.count,
    };
  }
}
