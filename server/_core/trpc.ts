import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware: Requer usuário autenticado
const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Middleware: Requer role 'vereador'
const requireVereador = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  if (ctx.user.role !== 'vereador' && ctx.user.role !== 'admin_cidade' && ctx.user.role !== 'superadmin') {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Acesso negado. Apenas vereadores podem realizar esta ação." 
    });
  }

  // SEGURANÇA: Vereador DEVE ter municipioId vinculado
  if (!ctx.user.municipioId && ctx.user.role !== 'superadmin') {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Acesso negado. Vereador sem vínculo com município." 
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const vereadorProcedure = t.procedure.use(requireVereador);

// Middleware: Requer role 'admin_cidade'
const requireAdminCidade = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  if (ctx.user.role !== 'admin_cidade' && ctx.user.role !== 'superadmin') {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Acesso negado. Apenas administradores de cidade podem realizar esta ação." 
    });
  }

  // SEGURANÇA: Admin de Cidade DEVE ter municipioId vinculado
  if (!ctx.user.municipioId && ctx.user.role !== 'superadmin') {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Acesso negado. Administrador sem vínculo com município." 
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminCidadeProcedure = t.procedure.use(requireAdminCidade);

// Middleware: Requer role 'superadmin'
const requireSuperAdmin = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  if (ctx.user.role !== 'superadmin') {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Acesso negado. Apenas super administradores podem realizar esta ação." 
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const superAdminProcedure = t.procedure.use(requireSuperAdmin);

// MANTIDO para compatibilidade
export const adminProcedure = adminCidadeProcedure;
