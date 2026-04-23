import { NextResponse } from "next/server";

import { getCurrentLearner } from "@/server/auth/current-learner";

export async function GET() {
  const current = await getCurrentLearner();

  return NextResponse.json({
    data: {
      id: current.learner.id,
      displayName: current.learner.displayName,
      email: current.learner.email,
      anonymous: current.anonymous,
      auth: current.authUser
        ? {
            id: current.authUser.id,
            email: current.authUser.email,
            name: current.authUser.name,
          }
        : null,
    },
  });
}
