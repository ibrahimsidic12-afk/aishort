export async function handleStripeEvent(_event: unknown): Promise<void> {
  console.warn("[STRIPE] handleStripeEvent: stub");
}

export async function cancelSubscription(
  input: { subscriptionId: string }
): Promise<{ cancelled: boolean }> {
  console.warn("[STRIPE] cancelSubscription: stub");
  return { cancelled: true };
}
