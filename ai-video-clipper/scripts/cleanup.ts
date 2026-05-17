/**
 * Cleanup script - removes old temp files and stale jobs
 * Run: npx tsx scripts/cleanup.ts
 */

import { runCleanupWorkflow } from "../app/workflows/cleanup-workflow";

async function main() {
  console.log("🧹 Running cleanup...");
  const results = await runCleanupWorkflow({ dryRun: false, retentionDays: 30 });
  console.log("✅ Cleanup complete:", results);
}

main().catch(console.error);
