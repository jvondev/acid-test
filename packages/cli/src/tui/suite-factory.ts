import type { InvariantSuite } from '@acidtest/core';
import { createBillingSuite } from '@acidtest/billing';
import { createDbSuite } from '@acidtest/db';
import { createAuthSuite } from '@acidtest/auth';
import { createQueueSuite } from '@acidtest/queue';
import { createWebhookSuite } from '@acidtest/webhook';
import { createAiSuite } from '@acidtest/ai';
import { createEmailSuite } from '@acidtest/email';
import { createStorageSuite } from '@acidtest/storage';

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
