/**
 * Cleanup Worker
 *
 * Runs periodic cleanup tasks:
 * - Delete temporary processing files
 * - Remove expired upload artifacts
 * - Cancel stale jobs
 */

import { runCleanupWorkflow } from "../../app/workflows/cleanup-workflow";

interface CleanupJob {
  dryRun?: boolean;
  retentionDays?: number;
}

export async function processCleanupJob(job: CleanupJob = {}) {
  console.log("[Cleanup Worker] Starting cleanup...");

  const results = await runCleanupWorkflow({
    dryRun: job.dryRun ?? false,
    retentionDays: job.retentionDays ?? 30,
  });

  console.log("[Cleanup Worker] Complete:", results);
  return results;
}

// Worker entry point
if (require.main === module) {
  console.log("[Cleanup Worker] Starting...");
  processCleanupJob()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Cleanup Worker] Error:", err);
      process.exit(1);
    });
}
