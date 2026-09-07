import { createHmac } from 'node:crypto';
import type { SupportedProvider, SignatureHeaderOptions, SignatureResult } from './types.js';
import { CryptoTimingGuard } from './timing.js';

export * from './types.js';
export * from './timing.js';

export class MultiProviderHmacEngine {
  static sign(options: SignatureHeaderOptions): SignatureResult {
    const { provider, secret, payload } = options;
    const rawBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
    const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
    const msgId = options.msgId ?? `msg_${Math.random().toString(36).substring(2, 12)}`;

    switch (provider) {
      case 'stripe': {
        const signature = createHmac('sha256', secret).update(`${timestamp}.${rawBuffer.toString('utf8')}`).digest('hex');
        return { headerName: 'stripe-signature', headerValue: `t=${timestamp},v1=${signature}`, timestamp, rawSignature: signature };
      }
      case 'shopify': {
        const signature = createHmac('sha256', secret).update(rawBuffer).digest('base64');
        return { headerName: 'x-shopify-hmac-sha256', headerValue: signature, timestamp, rawSignature: signature };
      }
      case 'slack': {
        const signature = `v0=${createHmac('sha256', secret).update(`v0:${timestamp}:${rawBuffer.toString('utf8')}`).digest('hex')}`;
        return { headerName: 'x-slack-signature', headerValue: signature, timestamp, rawSignature: signature };
      }
      case 'svix':
      case 'resend': {
        const cleanSecret = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : secret;
        const signature = createHmac('sha256', cleanSecret).update(`${msgId}.${timestamp}.${rawBuffer.toString('utf8')}`).digest('base64');
        return { headerName: 'svix-signature', headerValue: `v1,${signature}`, timestamp, rawSignature: signature };
      }
      case 'github': {
        const signature = `sha256=${createHmac('sha256', secret).update(rawBuffer).digest('hex')}`;
        return { headerName: 'x-hub-signature-256', headerValue: signature, timestamp, rawSignature: signature };
      }
      case 'paddle': {
        const signature = createHmac('sha256', secret).update(rawBuffer).digest('hex');
        return { headerName: 'paddle-signature', headerValue: `ts=${timestamp};h1=${signature}`, timestamp, rawSignature: signature };
      }
      case 'lemonsqueezy': {
        const signature = createHmac('sha256', secret).update(rawBuffer).digest('hex');
        return { headerName: 'x-signature', headerValue: signature, timestamp, rawSignature: signature };
      }
      default: {
        const signature = createHmac('sha256', secret).update(rawBuffer).digest('hex');
        return { headerName: 'x-acid-test-signature', headerValue: `sha256=${signature}`, timestamp, rawSignature: signature };
      }
    }
  }

  static safeCompare(a: string | Buffer, b: string | Buffer): boolean {
    return CryptoTimingGuard.safeCompare(a, b);
  }

  static testTimingSafeEqualVulnerability(verifierFn: (sig: string) => boolean, correctSig: string, iterations = 1000) {
    return CryptoTimingGuard.testTimingSafeEqualVulnerability(verifierFn, correctSig, iterations);
  }
}
