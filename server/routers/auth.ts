import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const authRouter = router({
  /**
   * Sincronizar usuário do Firebase com o banco de dados
   * Chamado pelo frontend após cadastro/login bem-sucedido no Firebase
   */
  syncUser: publicProcedure
    .input(
      z.object({
        uid: z.string(), // Firebase UID
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Verificar se usuário já existe
        const existingUser = await db.getUserById(input.uid);

        if (existingUser) {
          // Atualizar lastSignedIn
          await db.updateUserLastSignIn(input.uid);
          return {
            success: true,
            user: existingUser,
            message: "Usuário sincronizado com sucesso",
          };
        }

        // Criar novo usuário com role padrão 'cidadao'
        await db.createUser({
          id: input.uid,
          email: input.email,
          name: input.name || null,
          role: "cidadao",
          loginMethod: "firebase",
          isActive: true,
          isEmailVerified: true, // Firebase já verifica email
        });

        const newUser = await db.getUserById(input.uid);

        return {
          success: true,
          user: newUser,
          message: "Usuário criado com sucesso",
        };
      } catch (error) {
        console.error("[Auth] Erro ao sincronizar usuário:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao sincronizar usuário",
        });
      }
    }),

  /**
   * Obter dados do usuário atual
   */
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      municipioId: ctx.user.municipioId,
      isActive: ctx.user.isActive,
      createdAt: ctx.user.createdAt,
    };
  }),

  /**
   * Atualizar perfil do usuário
   */
  updateProfile: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        cpf: z.string().optional(),
        birthDate: z.string().optional(),
        zipCode: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      try {
        await db.updateUserProfile(ctx.user.id, input);

        return {
          success: true,
          message: "Perfil atualizado com sucesso",
        };
      } catch (error) {
        console.error("[Auth] Erro ao atualizar perfil:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar perfil",
        });
      }
    }),
});
