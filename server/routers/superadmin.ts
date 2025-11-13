import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { generateMunicipalityId } from "../utils/security";

export const superadminRouter = router({
  /**
   * Criar novo município (apenas super admin)
   */
  createMunicipality: publicProcedure
    .input(
      z.object({
        name: z.string().min(3).max(255),
        state: z.string().length(2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user || user.role !== "superadmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas super administradores podem criar municípios",
        });
      }

      try {
        const municipalityId = generateMunicipalityId();

        await db.createMunicipality({
          municipalityId,
          name: input.name,
          state: input.state,
        });

        return {
          success: true,
          municipalityId,
          message: "Município criado com sucesso",
        };
      } catch (error) {
        console.error("Erro ao criar município:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar município",
        });
      }
    }),

  /**
   * Atualizar configuração de tema (apenas super admin)
   */
  updateThemeConfig: publicProcedure
    .input(
      z.object({
        municipalityId: z.string(),
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        logoUrl: z.string().url().optional(),
        fontFamily: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user || user.role !== "superadmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas super administradores podem atualizar temas",
        });
      }

      try {
        await db.updateThemeConfig(input);

        return {
          success: true,
          message: "Configuração de tema atualizada com sucesso",
        };
      } catch (error) {
        console.error("Erro ao atualizar tema:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar tema",
        });
      }
    }),

  /**
   * Obter configuração de tema
   */
  getThemeConfig: publicProcedure
    .input(z.object({ municipalityId: z.string() }))
    .query(async ({ input }) => {
      try {
        const themeConfig = await db.getThemeConfig(input.municipalityId);
        return themeConfig || {
          primaryColor: "#0066cc",
          secondaryColor: "#f0f0f0",
          accentColor: "#ff6b35",
          fontFamily: "'Inter', sans-serif",
        };
      } catch (error) {
        console.error("Erro ao buscar configuração de tema:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar configuração de tema",
        });
      }
    }),

  /**
   * Promover usuário para admin de município
   */
  promoteToAdmin: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        municipalityId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user || user.role !== "superadmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas super administradores podem promover usuários",
        });
      }

      try {
        await db.promoteUserToRole(input.userId, "admin", input.municipalityId);

        return {
          success: true,
          message: "Usuário promovido para administrador com sucesso",
        };
      } catch (error) {
        console.error("Erro ao promover usuário:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao promover usuário",
        });
      }
    }),

  /**
   * Promover usuário para vereador
   */
  promoteToVereador: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        municipalityId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem promover vereadores",
        });
      }

      if (user.role === "admin" && user.municipalityId?.toString() !== input.municipalityId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para promover vereadores neste município",
        });
      }

      try {
        await db.promoteUserToRole(input.userId, "vereador", input.municipalityId);

        return {
          success: true,
          message: "Usuário promovido para vereador com sucesso",
        };
      } catch (error) {
        console.error("Erro ao promover usuário:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao promover usuário",
        });
      }
    }),

  /**
   * Criar Admin de Cidade (SuperAdmin cria conta Firebase + salva no DB)
   */
  createAdminCidade: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(3),
        municipioId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== "superadmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas super administradores podem criar admins de cidade",
        });
      }

      try {
        const admin = await import("firebase-admin");

        // Gerar senha temporária segura
        const senhaTemporaria = Math.random().toString(36).slice(-12) + "A1!";

        // Criar usuário no Firebase
        const firebaseUser = await admin.auth().createUser({
          email: input.email,
          password: senhaTemporaria,
          displayName: input.name,
          emailVerified: true,
        });

        // Salvar no banco de dados
        await db.createUser({
          id: firebaseUser.uid,
          email: input.email,
          name: input.name,
          role: "admin_cidade",
          municipioId: input.municipioId,
          loginMethod: "firebase",
          isActive: true,
          isEmailVerified: true,
        });

        // Enviar email de boas-vindas com credenciais
        const sendEmail = await import("../utils/email");
        await sendEmail.sendWelcomeEmail(input.email, input.name, senhaTemporaria);

        return {
          success: true,
          message: `Admin de cidade criado com sucesso. Email de boas-vindas enviado para ${input.email}`,
        };
      } catch (error: any) {
        console.error("[SuperAdmin] Erro ao criar admin de cidade:", error);
        
        if (error.code === "auth/email-already-exists") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este email já está em uso",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar admin de cidade",
        });
      }
    }),
});
