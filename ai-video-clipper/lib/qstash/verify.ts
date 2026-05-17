/**
 * QStash signature verification bridge
 */

import { Receiver } from "@upstash/qstash";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

/**
 * Verify a QStash webhook signature
 * @returns true if the signature is valid, false otherwise
 */
export async function verifyQStashSignature(
  body: string,
  signature: string,
): Promise<boolean> {
  try {
    await receiver.verify({
      body,
      signature,
    });
    return true;
  } catch {
    return false;
  }
}
