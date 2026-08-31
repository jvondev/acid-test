import type http from 'node:http';

export class SandboxRouteHandlers {
  static handleBilling(req: http.IncomingMessage, res: http.ServerResponse, bodyStr: string, mode: 'vulnerable' | 'hardened', state: { subscriptions: Map<string, any>; processedEventIds: Set<string> }): void {
    if (mode === 'vulnerable') {
      setTimeout(() => {
        try {
          const data = JSON.parse(bodyStr);
          const customerId = data?.data?.object?.customer || 'cus_default';
          const current = state.subscriptions.get(customerId) || { customerId, status: 'active', credits: 0 };
          current.credits += 100;
          state.subscriptions.set(customerId, current);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true, credits: current.credits }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid json' }));
        }
      }, 15);
    } else {
      try {
        const data = JSON.parse(bodyStr);
        const eventId = data?.id;
        if (eventId && state.processedEventIds.has(eventId)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true, deduplicated: true }));
          return;
        }
        if (eventId) state.processedEventIds.add(eventId);
        const customerId = data?.data?.object?.customer || 'cus_default';
        const current = state.subscriptions.get(customerId) || { customerId, status: 'active', credits: 0 };
        current.credits += 100;
        state.subscriptions.set(customerId, current);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true, credits: current.credits }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid json' }));
      }
    }
  }

  static handleAuth(path: string, authHeader: string, bodyStr: string, mode: 'vulnerable' | 'hardened', res: http.ServerResponse): void {
    if (mode === 'hardened') {
      if (authHeader.includes('eyJhbGciOiJub25l')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: algorithm none rejected' }));
        return;
      }
      if (authHeader.includes('usr_logout_test') || path.includes('/user/me')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: session revoked' }));
        return;
      }
      if (path.includes('org_beta') || bodyStr.includes('org_beta')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden: caller does not belong to org_beta' }));
        return;
      }
      if (path.includes('/profile')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ name: 'John Doe', role: 'member' }));
        return;
      }
      if (path.includes('/refresh')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ accessToken: 'new_token_123', refreshToken: 'new_refresh_456' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else {
      if (path.includes('/profile')) {
        try {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(JSON.parse(bodyStr)));
        } catch {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, crossTenant: true }));
    }
  }

  static handleWebhook(req: http.IncomingMessage, res: http.ServerResponse, mode: 'vulnerable' | 'hardened'): void {
    const stripeSig = (req.headers['stripe-signature'] as string) || '';
    if (mode === 'hardened' && stripeSig.includes('t=')) {
      const match = stripeSig.match(/t=(\d+)/);
      if (match) {
        const ts = parseInt(match[1], 10);
        if (Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Timestamp outside tolerance window' }));
          return;
        }
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ verified: true, timingSafe: mode === 'hardened' }));
  }
}
