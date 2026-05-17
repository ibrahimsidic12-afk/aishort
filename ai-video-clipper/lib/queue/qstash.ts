/**
 * QStash client setup
 */

import { Client } from "@upstash/qstash";

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export { qstashClient };

/**
 * Publish a message to a QStash endpoint
 */
export async function publishMessage(
  url: string,
  body: Record<string, unknown>,
  options?: {
    delay?: number; // seconds
    retries?: number;
    deduplicationId?: string;
  },
) {
  return qstashClient.publishJSON({
    url,
    body,
    delay: options?.delay,
    retries: options?.retries ?? 3,
    deduplicationId: options?.deduplicationId,
  });
}

/**
 * Schedule a recurring message
 */
export async function scheduleMessage(
  url: string,
  body: Record<string, unknown>,
  cron: string,
) {
  return qstashClient.publishJSON({
    url,
    body,
    cron,
  });
}
