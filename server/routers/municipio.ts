import { z } from "zod";
import { publicProcedure, router, superAdminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const municipioRouter = router({
  /**
   * Obter dados de um município por ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const municipio = await db.getMunicipioById(input.id);

        if (!municipio) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Município não encontrado",
          });
        }

        return {
          id: municipio.id,
          nome: municipio.nome,
          logoUrl: municipio.logoUrl,
          corPrimaria: municipio.corPrimaria,
          corSecundaria: municipio.corSecundaria,
        };
      } catch (error) {
        console.error("[Municipio] Erro ao buscar município:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar município",
        });
      }
    }),

  /**
   * Listar todos os municípios
   */
  list: publicProcedure.query(async () => {
    try {
      const municipios = await db.getAllMunicipios();
      return municipios;
    } catch (error) {
      console.error("[Municipio] Erro ao listar municípios:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar municípios",
      });
    }
  }),

  /**
   * Criar novo município (apenas SuperAdmin)
   */
  create: superAdminProcedure
    .input(
      z.object({
        id: z.string(),
        nome: z.string(),
        logoUrl: z.string().optional(),
        corPrimaria: z.string().optional(),
        corSecundaria: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await db.createMunicipio(input);

        return {
          success: true,
          message: "Município criado com sucesso",
        };
      } catch (error) {
        console.error("[Municipio] Erro ao criar município:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar município",
        });
      }
    }),

  /**
   * Atualizar município (apenas SuperAdmin)
   */
  update: superAdminProcedure
    .input(
      z.object({
        id: z.string(),
        nome: z.string().optional(),
        logoUrl: z.string().optional(),
        corPrimaria: z.string().optional(),
        corSecundaria: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await db.updateMunicipio(input.id, input);

        return {
          success: true,
          message: "Município atualizado com sucesso",
        };
      } catch (error) {
        console.error("[Municipio] Erro ao atualizar município:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar município",
        });
      }
    }),
});
