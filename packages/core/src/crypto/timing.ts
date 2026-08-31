import { timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';

export class CryptoTimingGuard {
  static safeCompare(a: string | Buffer, b: string | Buffer): boolean {
    const bufA = Buffer.isBuffer(a) ? a : Buffer.from(a);
    const bufB = Buffer.isBuffer(b) ? b : Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return nodeTimingSafeEqual(bufA, bufB);
  }

  static testTimingSafeEqualVulnerability(
    verifierFn: (sig: string) => boolean,
    correctSig: string,
    iterations = 1000
  ): { isVulnerable: boolean; deltaMicroseconds: number } {
    const length = correctSig.length;
    const prefixMatch = correctSig.slice(0, Math.floor(length * 0.8)) + '0'.repeat(Math.ceil(length * 0.2));
    const zeroMatch = '0'.repeat(length);

    let prefixTimeTotal = 0n;
    let zeroTimeTotal = 0n;

    for (let i = 0; i < iterations; i++) {
      const t0 = process.hrtime.bigint();
      verifierFn(prefixMatch);
      const t1 = process.hrtime.bigint();
      prefixTimeTotal += t1 - t0;

      const t2 = process.hrtime.bigint();
      verifierFn(zeroMatch);
      const t3 = process.hrtime.bigint();
      zeroTimeTotal += t3 - t2;
    }

    const avgPrefixNs = Number(prefixTimeTotal / BigInt(iterations));
    const avgZeroNs = Number(zeroTimeTotal / BigInt(iterations));
    const deltaUs = Math.abs(avgPrefixNs - avgZeroNs) / 1000;

    return { isVulnerable: deltaUs > 1.5, deltaMicroseconds: deltaUs };
  }
}
