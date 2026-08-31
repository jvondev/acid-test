export class RawBufferUtils {
  /**
   * Modifies whitespace without changing JSON semantics to test raw-buffer vs parsed-json verifiers
   */
  static mutateJsonWhitespace(obj: Record<string, unknown>): string {
    const raw = JSON.stringify(obj);
    // Introduce irregular spacing around keys, colons and braces
    return raw
      .replace(/\{/g, '{\n  ')
      .replace(/:/g, ' :  ')
      .replace(/,/g, ' ,\n  ')
      .replace(/\}/g, '\n}');
  }

  /**
   * Generates poison pill payloads for queue and ingress fuzzing
   */
  static generatePoisonPill(type: 'circular' | 'null_byte' | 'massive_5mb' | 'malformed_json' | 'schema_invalid'): string | Buffer {
    switch (type) {
      case 'circular': {
        // String representation of a circular structure that crashes unhandled serializers
        return '{"name":"root","child":{"name":"child_1","parent":"[Circular *1]"}}';
      }

      case 'null_byte': {
        // Injects null bytes into strings to crash C-bindings or Postgres UTF-8 decoders
        return JSON.stringify({
          event: 'user.created\u0000_injection',
          id: 'usr_null_\u0000_byte',
          email: 'admin\u0000@company.internal',
          metadata: { note: 'test\u0000zero' },
        });
      }

      case 'massive_5mb': {
        // Generates 5MB payload to test memory limits & body parsers
        const filler = 'X'.repeat(5 * 1024 * 1024);
        return JSON.stringify({
          event: 'payload.overflow',
          filler,
          timestamp: Date.now(),
        });
      }

      case 'malformed_json': {
        // Missing trailing brackets or trailing commas
        return '{"id":"evt_12345","type":"payment_intent.succeeded","amount":5000,';
      }

      case 'schema_invalid': {
        // Incorrect types (string for number, boolean for array)
        return JSON.stringify({
          id: 12345, // should be string
          amount: 'five_hundred_dollars', // should be number
          customer: false, // should be object
          created: 'not_a_timestamp',
        });
      }
    }
  }

  /**
   * Mutates a specific field inside an existing payload while preserving all other keys
   */
  static mutateField(jsonPayload: string, fieldName: string, newValue: unknown): string {
    try {
      const parsed = JSON.parse(jsonPayload);
      parsed[fieldName] = newValue;
      return JSON.stringify(parsed);
    } catch {
      return jsonPayload;
    }
  }
}
