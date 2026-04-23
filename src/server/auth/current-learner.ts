import { cookies, headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { ANONYMOUS_SESSION_COOKIE } from "@/server/auth/session-cookies";
import { getOrCreateAnonymousUser } from "@/server/services/anonymous-user-service";

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export type CurrentLearner = {
  learner: {
    id: string;
    email: string | null;
    displayName: string | null;
  };
  anonymous: boolean;
  authSession: AuthSession;
  authUser: {
    id: string;
    email: string;
    name: string;
    learnerId: string | null;
  } | null;
};

export async function getCurrentAuthSession() {
  const requestHeaders = new Headers(await headers());

  return auth.api.getSession({
    headers: requestHeaders,
  });
}

export async function getCurrentLearner(): Promise<CurrentLearner> {
  const [cookieStore, authSession] = await Promise.all([
    cookies(),
    getCurrentAuthSession(),
  ]);
  const anonymousSessionId = cookieStore.get(ANONYMOUS_SESSION_COOKIE)?.value;

  if (authSession?.user?.id) {
    const authUser = await ensureLearnerForAuthUser({
      authUserId: authSession.user.id,
      anonymousSessionId,
    });

    return {
      learner: {
        id: authUser.learner!.id,
        email: authUser.learner!.email,
        displayName: authUser.learner!.displayName,
      },
      anonymous: false,
      authSession,
      authUser: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        learnerId: authUser.learnerId,
      },
    };
  }

  const anonymousUser = await getOrCreateAnonymousUser(anonymousSessionId);

  return {
    learner: {
      id: anonymousUser.user.id,
      email: anonymousUser.user.email,
      displayName: anonymousUser.user.displayName,
    },
    anonymous: true,
    authSession: null,
    authUser: null,
  };
}

async function ensureLearnerForAuthUser({
  authUserId,
  anonymousSessionId,
}: {
  authUserId: string;
  anonymousSessionId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const authUser = await tx.authUser.findUnique({
      where: {
        id: authUserId,
      },
      include: {
        learner: true,
      },
    });

    if (!authUser) {
      throw new Error("Authenticated user not found");
    }

    if (authUser.learner) {
      return authUser;
    }

    const learnerDisplayName = authUser.name.trim() || authUser.email.split("@")[0];
    const anonymousLearner = anonymousSessionId
      ? await tx.user.findUnique({
          where: {
            anonymousSessionId,
          },
        })
      : null;

    const candidateLearner =
      (anonymousLearner &&
      !(await tx.authUser.findFirst({
        where: {
          learnerId: anonymousLearner.id,
        },
        select: {
          id: true,
        },
      }))
        ? anonymousLearner
        : null) ??
      (await tx.user.findFirst({
        where: {
          email: authUser.email,
          authIdentity: {
            is: null,
          },
        },
      })) ??
      (await tx.user.create({
        data: {
          email: authUser.email,
          displayName: learnerDisplayName,
        },
      }));

    if (
      candidateLearner.email !== authUser.email ||
      candidateLearner.displayName !== learnerDisplayName
    ) {
      await tx.user.update({
        where: {
          id: candidateLearner.id,
        },
        data: {
          email: authUser.email,
          displayName: learnerDisplayName,
        },
      });
    }

    return tx.authUser.update({
      where: {
        id: authUser.id,
      },
      data: {
        learnerId: candidateLearner.id,
      },
      include: {
        learner: true,
      },
    });
  });
}
