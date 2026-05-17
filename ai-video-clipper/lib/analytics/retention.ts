/**
 * Retention analytics
 */

import { prisma } from "@/lib/db/prisma";

interface CohortData {
  cohortDate: string;
  totalUsers: number;
  retainedByWeek: number[];
}

/**
 * Calculate weekly retention cohorts
 */
export async function getRetentionCohorts(weeks = 8): Promise<CohortData[]> {
  // Get users grouped by signup week
  const cohorts: CohortData[] = [];

  for (let w = 0; w < weeks; w++) {
    const cohortStart = new Date();
    cohortStart.setDate(cohortStart.getDate() - (w + 1) * 7);
    const cohortEnd = new Date(cohortStart);
    cohortEnd.setDate(cohortEnd.getDate() + 7);

    const usersInCohort = await prisma.user.count({
      where: {
        createdAt: { gte: cohortStart, lt: cohortEnd },
      },
    });

    // Check activity for each subsequent week
    const retainedByWeek: number[] = [];
    for (let rw = 1; rw <= weeks - w; rw++) {
      const weekStart = new Date(cohortEnd);
      weekStart.setDate(weekStart.getDate() + (rw - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const activeUsers = await prisma.usageRecord.groupBy({
        by: ["userId"],
        where: {
          user: { createdAt: { gte: cohortStart, lt: cohortEnd } },
          createdAt: { gte: weekStart, lt: weekEnd },
        },
      });

      retainedByWeek.push(activeUsers.length);
    }

    cohorts.push({
      cohortDate: cohortStart.toISOString().split("T")[0],
      totalUsers: usersInCohort,
      retainedByWeek,
    });
  }

  return cohorts;
}

/**
 * Get daily active users count
 */
export async function getDailyActiveUsers(date: Date): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await prisma.usageRecord.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: startOfDay, lte: endOfDay } },
  });

  return result.length;
}

/**
 * Get monthly active users count
 */
export async function getMonthlyActiveUsers(month: Date): Promise<number> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

  const result = await prisma.usageRecord.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
  });

  return result.length;
}
