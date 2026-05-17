import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      clerkId: "user_demo_123",
      email: "demo@example.com",
      name: "Demo User",
      plan: "FREE",
      credits: 10,
    },
  });

  // Create demo video
  const video = await prisma.video.create({
    data: {
      userId: user.id,
      title: "Sample Video",
      fileName: "sample.mp4",
      fileSize: 50_000_000,
      duration: 600,
      mimeType: "video/mp4",
      storageKey: "videos/sample.mp4",
      status: "READY",
    },
  });

  // Create demo transcript
  await prisma.transcript.create({
    data: {
      videoId: video.id,
      content: "This is a sample transcript for the demo video.",
      segments: [
        { start: 0, end: 5, text: "This is a sample transcript" },
        { start: 5, end: 10, text: "for the demo video." },
      ],
      language: "en",
      provider: "DEEPGRAM",
    },
  });

  // Create demo clips
  await prisma.clip.createMany({
    data: [
      {
        userId: user.id,
        videoId: video.id,
        title: "Best Moment #1",
        startTime: 30,
        endTime: 90,
        duration: 60,
        status: "READY",
        score: 0.85,
        viralityScore: 0.72,
        tags: ["funny", "highlight"],
      },
      {
        userId: user.id,
        videoId: video.id,
        title: "Best Moment #2",
        startTime: 180,
        endTime: 240,
        duration: 60,
        status: "READY",
        score: 0.91,
        viralityScore: 0.88,
        tags: ["viral", "trending"],
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
