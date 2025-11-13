import { z } from "zod";
import { publicProcedure, router, adminCidadeProcedure, vereadorProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { generateProposalsReport, generateConsolidatedReport } from "../utils/pdf";

export const reportsRouter = router({
  /**
   * Gerar relatório PDF de propostas para Admin da Cidade
   */
  generateAdminReport: adminCidadeProcedure
    .input(
      z.object({
        format: z.enum(["simple", "consolidated"]).default("simple"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      // RBAC: adminCidadeProcedure já garante role correto
      // ISOLAMENTO CRÍTICO: Admin SÓ vê dados do seu município
      if (!ctx.user.municipioId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário sem vínculo com município",
        });
      }

      try {
        // ISOLAMENTO: Busca APENAS propostas do município do admin
        const proposals = await db.getProposalsByMunicipality(ctx.user.municipioId);

        let pdfBuffer: Buffer;

        if (input.format === "consolidated") {
          pdfBuffer = generateConsolidatedReport(proposals, {
            title: "Relatório Consolidado de Propostas",
            subtitle: `Município: ${ctx.user.municipioId}`,
            generatedBy: ctx.user.name || "Sistema",
            generatedAt: new Date(),
          });
        } else {
          pdfBuffer = generateProposalsReport(proposals, {
            title: "Relatório de Propostas",
            subtitle: `Município: ${ctx.user.municipioId}`,
            generatedBy: ctx.user.name || "Sistema",
            generatedAt: new Date(),
          });
        }

        return {
          success: true,
          pdf: pdfBuffer.toString("base64"),
          filename: `relatorio_propostas_${ctx.user.municipioId}_${Date.now()}.pdf`,
        };
      } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar relatório",
        });
      }
    }),

  /**
   * Gerar relatório PDF de propostas pessoais para Vereador
   */
  generateVereadorReport: vereadorProcedure
    .input(
      z.object({
        format: z.enum(["simple", "consolidated"]).default("simple"),
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
        // ISOLAMENTO: Busca APENAS propostas do vereador
        const proposals = await db.getProposalsByVereador(ctx.user.id);

        let pdfBuffer: Buffer;

        if (input.format === "consolidated") {
          pdfBuffer = generateConsolidatedReport(proposals, {
            title: "Relatório Consolidado de Minhas Propostas",
            subtitle: `Vereador: ${ctx.user.name || "N/A"}`,
            generatedBy: ctx.user.name || "Sistema",
            generatedAt: new Date(),
          });
        } else {
          pdfBuffer = generateProposalsReport(proposals, {
            title: "Relatório de Minhas Propostas",
            subtitle: `Vereador: ${ctx.user.name || "N/A"}`,
            generatedBy: ctx.user.name || "Sistema",
            generatedAt: new Date(),
          });
        }

        return {
          success: true,
          pdf: pdfBuffer.toString("base64"),
          filename: `relatorio_minhas_propostas_${Date.now()}.pdf`,
        };
      } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar relatório",
        });
      }
    }),
});
