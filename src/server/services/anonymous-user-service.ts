import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

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

    const user = await prisma.user.create({
      data: {
        anonymousSessionId: sessionId,
        displayName: "Anonymous Learner",
      },
    });

    return {
      user,
      sessionId,
      created: true,
    };
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
