export type ClerkEvent = {
  type: string;
  data: Record<string, unknown>;
};

export async function verifyClerkWebhook(
  _body: string,
  opts: { svixId: string; svixTimestamp: string; svixSignature: string }
): Promise<ClerkEvent | null> {
  console.warn("[CLERK_WEBHOOK] verifyClerkWebhook: stub", opts.svixId);
  // Svix verification would go here (svix package not installed — stub only)
  return null;
}
