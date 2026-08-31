import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';

export type SupportedProvider =
  | 'stripe'
  | 'shopify'
  | 'slack'
  | 'svix'
  | 'github'
  | 'resend'
  | 'paddle'
  | 'lemonsqueezy'
  | 'discord'
  | 'clerk'
  | 'custom';

export interface SignatureHeaderOptions {
  provider: SupportedProvider;
  secret: string;
  payload: string | Buffer;
  timestamp?: number;
  msgId?: string;
}

export interface SignatureResult {
  headerName: string;
  headerValue: string;
  timestamp: number;
  rawSignature: string;
}

export class MultiProviderHmacEngine {
  /**
   * Generates real cryptographic HMAC signatures for any supported cloud provider
   */
  static sign(options: SignatureHeaderOptions): SignatureResult {
    const { provider, secret, payload } = options;
    const rawBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
    const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
    const msgId = options.msgId ?? `msg_${Math.random().toString(36).substring(2, 12)}`;

    switch (provider) {
      case 'stripe': {
        const signaturePayload = `${timestamp}.${rawBuffer.toString('utf8')}`;
        const signature = createHmac('sha256', secret).update(signaturePayload).digest('hex');
        return {
          headerName: 'stripe-signature',
          headerValue: `t=${timestamp},v1=${signature}`,
          timestamp,
          rawSignature: signature,
        };
      }

      case 'shopify': {
        const signature = createHmac('sha256', secret).update(rawBuffer).digest('base64');
        return {
          headerName: 'x-shopify-hmac-sha256',
          headerValue: signature,
          timestamp,
          rawSignature: signature,
        };
      }

      case 'slack': {
        const sigBaseString = `v0:${timestamp}:${rawBuffer.toString('utf8')}`;
        const signature = `v0=${createHmac('sha256', secret).update(sigBaseString).digest('hex')}`;
        return {
          headerName: 'x-slack-signature',
          headerValue: signature,
          timestamp,
          rawSignature: signature,
        };
      }

      case 'svix':
      case 'resend': {
        const toSign = `${msgId}.${timestamp}.${rawBuffer.toString('utf8')}`;
        // Svix secrets may be prefixed with 'whsec_'
        const cleanSecret = secret.startsWith('whsec_')
          ? Buffer.from(secret.slice(6), 'base64')
          : secret;
        const signature = createHmac('sha256', cleanSecret).update(toSign).digest('base64');
        return {
          headerName: 'svix-signature',
          headerValue: `v1,${signature}`,
          timestamp,
          rawSignature: signature,
        };
      }

      case 'github': {
        const signature = `sha256=${createHmac('sha256', secret).update(rawBuffer).digest('hex')}`;
        return {
          headerName: 'x-hub-signature-256',
          headerValue: signature,
          timestamp,
          rawSignature: signature,
        };
      }

      case 'paddle': {
        const signature = createHmac('sha256', secret).update(rawBuffer).digest('hex');
        return {
          headerName: 'paddle-signature',
          headerValue: `ts=${timestamp};h1=${signature}`,
          timestamp,
          rawSignature: signature,
        };
      }

      case 'lemonsqueezy': {
        const signature = createHmac('sha256', secret).update(rawBuffer).digest('hex');
        return {
          headerName: 'x-signature',
          headerValue: signature,
          timestamp,
          rawSignature: signature,
        };
      }

      case 'discord':
      case 'clerk':
      case 'custom':
      default: {
        const signature = createHmac('sha256', secret).update(rawBuffer).digest('hex');
        return {
          headerName: 'x-acidtest-signature',
          headerValue: `sha256=${signature}`,
          timestamp,
          rawSignature: signature,
        };
      }
    }
  }

  /**
   * Constant-time comparison between two buffers/strings to prevent side-channel timing attacks
   */
  static safeCompare(a: string | Buffer, b: string | Buffer): boolean {
    const bufA = Buffer.isBuffer(a) ? a : Buffer.from(a);
    const bufB = Buffer.isBuffer(b) ? b : Buffer.from(b);

    if (bufA.length !== bufB.length) {
      return false;
    }
    return nodeTimingSafeEqual(bufA, bufB);
  }

  /**
   * Checks whether a target verification implementation appears vulnerable to timing side-channels
   */
  static testTimingSafeEqualVulnerability(
    verifierFn: (sig: string) => boolean,
    correctSig: string,
    iterations = 1000
  ): { isVulnerable: boolean; deltaMicroseconds: number } {
    const length = correctSig.length;
    // Prefix match: matches 80% of signature
    const prefixMatch = correctSig.slice(0, Math.floor(length * 0.8)) + '0'.repeat(Math.ceil(length * 0.2));
    // Completely mismatched signature
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
    const deltaNs = Math.abs(avgPrefixNs - avgZeroNs);
    const deltaUs = deltaNs / 1000;

    // Standard string equality (===) fails early on mismatch, creating a measurable timing delta
    const isVulnerable = deltaUs > 1.5;

    return {
      isVulnerable,
      deltaMicroseconds: deltaUs,
    };
  }
}
