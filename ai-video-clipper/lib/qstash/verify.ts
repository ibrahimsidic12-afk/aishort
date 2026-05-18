import { Receiver } from "@upstash/qstash";

/**
 * Verify a QStash webhook signature
 */
export async function verifyQStashSignature(
  body: string,
  signature?: string | null
): Promise<boolean> {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  // Skip verification if keys aren't configured (dev mode)
  if (!currentSigningKey || !nextSigningKey) {
    console.warn("[QSTASH] Signing keys not configured, skipping verification");
    return process.env.NODE_ENV === "development";
  }

  if (!signature) {
    console.error("[QSTASH] No signature provided");
    return false;
  }

  try {
    const receiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });

    const isValid = await receiver.verify({
      body,
      signature,
    });

    return isValid;
  } catch (error) {
    console.error("[QSTASH] Verification failed:", error);
    return false;
  }
}
