import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { proposalsRouter } from "./routers/proposals";
import { votesRouter } from "./routers/votes";
import { superadminRouter } from "./routers/superadmin";
import { reportsRouter } from "./routers/reports";
import { chatRouter } from "./routers/chat";
import { municipioRouter } from "./routers/municipio";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    ...authRouter._def.procedures,
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  proposals: proposalsRouter,
  votes: votesRouter,
  superadmin: superadminRouter,
  reports: reportsRouter,
  chat: chatRouter,
  municipio: municipioRouter,
});

export type AppRouter = typeof appRouter;
