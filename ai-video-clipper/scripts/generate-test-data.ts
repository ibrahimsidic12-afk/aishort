/**
 * Generate test data for development
 * Run: npx tsx scripts/generate-test-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Generating test data...");

  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      clerkId: "user_test_456",
      email: "test@example.com",
      name: "Test User",
      plan: "PRO",
      credits: 50,
    },
  });

  // Generate videos
  for (let i = 1; i <= 5; i++) {
    const video = await prisma.video.create({
      data: {
        userId: user.id,
        title: `Test Video ${i}`,
        fileName: `test_video_${i}.mp4`,
        fileSize: Math.floor(Math.random() * 100_000_000),
        duration: Math.floor(Math.random() * 3600) + 300,
        mimeType: "video/mp4",
        storageKey: `videos/test_${i}.mp4`,
        status: "READY",
      },
    });

    // Generate clips for each video
    for (let j = 1; j <= 3; j++) {
      await prisma.clip.create({
        data: {
          userId: user.id,
          videoId: video.id,
          title: `Video ${i} - Clip ${j}`,
          startTime: j * 60,
          endTime: j * 60 + 45,
          duration: 45,
          status: "READY",
          score: Math.random(),
          viralityScore: Math.random(),
          tags: ["test", `clip${j}`],
        },
      });
    }
  }

  console.log("✅ Test data generated: 5 videos, 15 clips");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
