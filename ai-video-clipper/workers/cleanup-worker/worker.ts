/**
 * Cleanup Worker
 *
 * Runs periodic cleanup tasks:
 * - Delete temporary processing files
 * - Remove expired upload artifacts
 * - Cancel stale jobs
 */

import { fileURLToPath } from "url";
import { runCleanupWorkflow } from "../../app/workflows/cleanup-workflow.js";

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

// ESM-compatible worker entry point
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  console.log("[Cleanup Worker] Starting...");
  processCleanupJob()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Cleanup Worker] Error:", err);
      process.exit(1);
    });
}
