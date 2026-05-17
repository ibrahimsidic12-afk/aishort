/**
 * Prisma mock for unit testing
 */

import { PrismaClient } from "@prisma/client";

// Mock Prisma client for testing
export const prismaMock = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  video: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  clip: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  transcript: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  job: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  subscription: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  $queryRaw: jest.fn(),
} as unknown as PrismaClient;

jest.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));
