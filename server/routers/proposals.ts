import { z } from "zod";
import { publicProcedure, router, vereadorProcedure, protectedProcedure, adminCidadeProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { generateProposalId } from "../utils/security";

export const proposalsRouter = router({
  /**
   * Criar nova proposta (apenas vereadores)
   */
  createProposal: vereadorProcedure
    .input(
      z.object({
        title: z.string().min(5).max(255),
        description: z.string().min(10).max(5000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // RBAC: vereadorProcedure já garante role correto
      // MULTI-TENANCY: Proposta DEVE ser salva com o municipalityId do usuário logado
      if (!ctx.user.municipioId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário sem vínculo com município",
        });
      }

      try {
        const proposalId = generateProposalId();
        await db.createProposal({
          proposalId,
          municipalityId: ctx.user.municipioId,
          vereadorId: ctx.user.id,
          title: input.title,
          description: input.description,
          status: "pending",
          voteCount: 0,
        });

        return {
          success: true,
          proposalId,
          message: "Proposta criada com sucesso",
        };
      } catch (error) {
        console.error("Erro ao criar proposta:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar proposta",
        });
      }
    }),

  /**
   * Listar propostas aprovadas de um município
   * MULTI-TENANCY: Filtra propostas por municipalityId
   */
  getApprovedProposals: publicProcedure
    .input(z.object({ municipalityId: z.string() }))
    .query(async ({ input }) => {
      try {
        // ISOLAMENTO: Busca APENAS propostas do município especificado
        const proposals = await db.getProposalsByMunicipality(input.municipalityId);
        return proposals.filter((p) => p.status === "approved");
      } catch (error) {
        console.error("Erro ao buscar propostas:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar propostas",
        });
      }
    }),

  /**
   * Listar propostas do vereador
   * MULTI-TENANCY: Filtra propostas pelo vereadorId E municipioId do usuário logado
   */
  getMyProposals: vereadorProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado",
      });
    }

    try {
      // ISOLAMENTO: Busca APENAS propostas do vereador no seu município
      const proposals = await db.getProposalsByVereador(ctx.user.id);
      return proposals;
    } catch (error) {
      console.error("Erro ao buscar propostas:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar propostas",
      });
    }
  }),

  /**
   * Listar todas as propostas de um município (admin)
   * MULTI-TENANCY: Admin SÓ vê propostas do seu município
   */
  getAllProposalsForAdmin: adminCidadeProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado",
      });
    }

    // SEGURANÇA: Admin SÓ vê propostas do seu município
    if (!ctx.user.municipioId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Usuário sem vínculo com município",
      });
    }

    try {
      // ISOLAMENTO: Busca APENAS propostas do município do admin
      const proposals = await db.getProposalsByMunicipality(ctx.user.municipioId);
      return proposals;
    } catch (error) {
      console.error("Erro ao buscar propostas:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar propostas",
      });
    }
  }),

  /**
   * Aprovar proposta (apenas admin)
   * MULTI-TENANCY: Admin SÓ aprova propostas do seu município
   */
  approveProposal: adminCidadeProcedure
    .input(
      z.object({
        proposalId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // SEGURANÇA: Verificar se a proposta pertence ao município do admin
      if (!ctx.user.municipioId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário sem vínculo com município",
        });
      }

      try {
        // SEGURANÇA CRÍTICA: Verificar se a proposta pertence ao município do admin
        const proposal = await db.getProposalByProposalId(input.proposalId);
        
        if (!proposal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Proposta não encontrada",
          });
        }

        if (proposal.municipalityId !== ctx.user.municipioId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você não tem permissão para aprovar propostas de outro município",
          });
        }

        await db.updateProposalStatus(input.proposalId, "approved");
        return {
          success: true,
          message: "Proposta aprovada com sucesso",
        };
      } catch (error) {
        console.error("Erro ao aprovar proposta:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao aprovar proposta",
        });
      }
    }),

  /**
   * Rejeitar proposta (apenas admin)
   * MULTI-TENANCY: Admin SÓ rejeita propostas do seu município
   */
  rejectProposal: adminCidadeProcedure
    .input(
      z.object({
        proposalId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // SEGURANÇA: Verificar se a proposta pertence ao município do admin
      if (!ctx.user.municipioId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário sem vínculo com município",
        });
      }

      try {
        // SEGURANÇA CRÍTICA: Verificar se a proposta pertence ao município do admin
        const proposal = await db.getProposalByProposalId(input.proposalId);
        
        if (!proposal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Proposta não encontrada",
          });
        }

        if (proposal.municipalityId !== ctx.user.municipioId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você não tem permissão para rejeitar propostas de outro município",
          });
        }

        await db.updateProposalStatus(input.proposalId, "rejected");
        return {
          success: true,
          message: "Proposta rejeitada com sucesso",
        };
      } catch (error) {
        console.error("Erro ao rejeitar proposta:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao rejeitar proposta",
        });
      }
    }),
});
