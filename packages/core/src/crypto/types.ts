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
