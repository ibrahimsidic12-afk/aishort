import { prisma } from "../db/prisma";

export async function deleteClipAssets(input: { storageKey: string | null }): Promise<void> {
  console.warn("[STORAGE] deleteClipAssets: stub", input.storageKey);
}
