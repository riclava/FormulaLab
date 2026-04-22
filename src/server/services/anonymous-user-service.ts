import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

export const ANONYMOUS_SESSION_COOKIE = "formulalab_anonymous_session";

export async function getOrCreateAnonymousUser(sessionId?: string) {
  if (sessionId) {
    const existingUser = await prisma.user.findUnique({
      where: {
        anonymousSessionId: sessionId,
      },
    });

    if (existingUser) {
      return {
        user: existingUser,
        sessionId,
        created: false,
      };
    }
  }

  const nextSessionId = randomUUID();
  const user = await prisma.user.create({
    data: {
      anonymousSessionId: nextSessionId,
      displayName: "Anonymous Learner",
    },
  });

  return {
    user,
    sessionId: nextSessionId,
    created: true,
  };
}
