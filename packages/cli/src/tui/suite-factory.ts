import type { InvariantSuite } from '@acid-test/core';
import { createBillingSuite } from '@acid-test/billing';
import { createDbSuite } from '@acid-test/db';
import { createAuthSuite } from '@acid-test/auth';
import { createQueueSuite } from '@acid-test/queue';
import { createWebhookSuite } from '@acid-test/webhook';
import { createAiSuite } from '@acid-test/ai';
import { createEmailSuite } from '@acid-test/email';
import { createStorageSuite } from '@acid-test/storage';

export function getAllDomainSuites(): InvariantSuite[] {
  return [
    createBillingSuite(),
    createDbSuite(),
    createAuthSuite(),
    createQueueSuite(),
    createWebhookSuite(),
    createAiSuite(),
    createEmailSuite(),
    createStorageSuite(),
  ];
}
