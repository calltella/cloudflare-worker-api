// src/features/user/actions/getLoginHistory.ts

"use server";

import { users, loginHistories } from "@/db/schema/users";
import { getDB } from "@/lib/utils/db";
import { eq, desc } from "drizzle-orm";

export async function getLoginHistory() {

  const db = await getDB();

  const result = await db
    .select({
      id: loginHistories.id,
      userId: loginHistories.userId,
      ipAddress: loginHistories.ipAddress,
      country: loginHistories.country,
      userAgent: loginHistories.userAgent,
      createdAt: loginHistories.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(loginHistories)
    .leftJoin(users, eq(users.id, loginHistories.userId))
    .orderBy(desc(loginHistories.createdAt))
    .limit(20);

  return result;
}

export type LoginHistoryWithUser = Awaited<ReturnType<typeof getLoginHistory>>[number];
