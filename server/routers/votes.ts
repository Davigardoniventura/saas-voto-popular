import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const votesRouter = router({
  /**
   * Votar em uma proposta
   */
  voteOnProposal: publicProcedure
    .input(
      z.object({
        proposalId: z.number(),
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
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      // Verificar se é cidadão
      if (user.role !== "citizen") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas cidadãos podem votar",
        });
      }

      // Verificar se pertence ao município
      if (user.municipalityId?.toString() !== input.municipalityId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não pode votar em propostas de outro município",
        });
      }

      try {
        // Verificar se o usuário já votou nesta proposta
        const existingVote = await db.getVoteByCitizenAndProposal(user.id, input.proposalId);
        if (existingVote) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Você já votou nesta proposta",
          });
        }

        // Criar o voto
        await db.createVote({
          proposalId: input.proposalId,
          citizenId: user.id,
          municipalityId: input.municipalityId,
        });

        // Incrementar a contagem de votos da proposta
        await db.incrementProposalVoteCount(input.proposalId);

        return {
          success: true,
          message: "Voto registrado com sucesso",
        };
      } catch (error) {
        console.error("Erro ao registrar voto:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar voto",
        });
      }
    }),

  /**
   * Verificar se usuário já votou em uma proposta
   */
  hasUserVoted: publicProcedure
    .input(
      z.object({
        proposalId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        return false;
      }

      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user) {
        return false;
      }

      const existingVote = await db.getVoteByCitizenAndProposal(user.id, input.proposalId);
      return !!existingVote;
    }),
});
