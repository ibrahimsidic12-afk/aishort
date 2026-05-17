/**
 * Database migration helper
 * Run: npx tsx scripts/migrate.ts
 */

import { execSync } from "child_process";

async function main() {
  const command = process.argv[2] || "dev";

  console.log(`🔄 Running migration: ${command}`);

  switch (command) {
    case "dev":
      execSync("npx prisma migrate dev", { stdio: "inherit" });
      break;
    case "deploy":
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      break;
    case "reset":
      execSync("npx prisma migrate reset --force", { stdio: "inherit" });
      break;
    default:
      console.error("Unknown command. Use: dev, deploy, reset");
      process.exit(1);
  }

  console.log("✅ Migration complete");
}

main().catch(console.error);
