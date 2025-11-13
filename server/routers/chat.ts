import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM, createSystemMessage, createUserMessage, classifyIntent } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { sendComplaintEmail, sendComplaintConfirmationEmail } from "../utils/email";
import * as db from "../db";
import { ENV } from "../_core/env";

export const chatRouter = router({
  /**
   * AGENTE EDUCRACIA - Agente de Triagem Proativo
   * ECONOMIA DE CRÉDITOS: Usa classificação de baixo custo antes de processar
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // ETAPA 1: TRIAGEM - Receber a mensagem do usuário
        console.log("[Chat] Recebendo mensagem do usuário...");

        // ETAPA 2: CLASSIFICAÇÃO ECONÔMICA (baixo custo)
        console.log("[Chat] Classificando intenção da mensagem...");
        const intencao = await classifyIntent(input.message);
        console.log(`[Chat] Intenção detectada: ${intencao}`);

        // ETAPA 3: AÇÃO PROATIVA - SUSTENTAÇÃO
        if (intencao === "RECLAMACAO_TECNICA") {
          console.log("[Chat] 🚨 RECLAMAÇÃO TÉCNICA DETECTADA - Acionando sustentação");

          // Acionar a função sendComplaintEmail
          try {
            await sendComplaintEmail(
              input.message,
              ctx.user?.email || undefined,
              ctx.user?.role || "cidadao"
            );

            // Notificar owner via sistema
            await notifyOwner({
              title: `🚨 ALERTA TÉCNICO - Reclamação do Usuário`,
              content: `Usuário: ${ctx.user?.name || "Anônimo"} (${ctx.user?.email || "sem email"})
Role: ${ctx.user?.role || "cidadao"}
Município: ${ctx.user?.municipioId || "N/A"}

📝 Reclamação:
${input.message}

⚠️ Esta mensagem foi classificada automaticamente como RECLAMAÇÃO TÉCNICA pelo Agente EduCracia.`,
            });

            // Salvar no banco
            if (ctx.user) {
              await db.insertComplaint({
                userId: ctx.user.id,
                municipalityId: ctx.user.municipioId || "global",
                complaintText: input.message,
                status: "open",
              });
            }

            console.log("[Chat] ✅ Sustentação acionada com sucesso");
          } catch (error) {
            console.error("[Chat] Erro ao acionar sustentação:", error);
          }

          // Retornar mensagem padrão ao usuário (SEM GASTAR CRÉDITOS)
          return {
            message:
              "Sua reclamação técnica foi recebida e encaminhada com prioridade ao nosso time de suporte. Obrigado!",
            timestamp: new Date(),
          };
        }

        // ETAPA 4: RESPOSTA NORMAL
        // SE for 'DUVIDA_CIVICA' ou 'CONVERSA_GERAL', prosseguir normalmente
        console.log("[Chat] Processando resposta normal com Agente...");

        const userRole = ctx.user?.role || "cidadao";

        // Prompts personalizados por role (Onboarding)
        const contextPrompts: Record<string, string> = {
          cidadao:
            "Você é o EduCracia, assistente amigável para cidadãos da plataforma Voto Popular. " +
            "MISSÃO: Garantir acessibilidade e simplicidade. " +
            "REGRA DE ACESSIBILIDADE: Se pedir resumo de proposta/texto legal, reescreva em linguagem simples (Nível Fundamental). " +
            "RESTRIÇÃO RIGOROSA: SÓ responda sobre Voto Popular (cadastro, voto, acompanhamento). " +
            "NUNCA sobre política, tempo, esportes, etc. Se perguntarem fora do contexto, recuse educadamente.",

          vereador:
            "Você é o EduCracia, assistente proativo de vereadores da plataforma Voto Popular. " +
            "FUNÇÃO: Guiar na criação e gestão de propostas legislativas. " +
            "ONBOARDING: Ajude o vereador a 'como postar propostas' ou 'ver meus relatórios'. " +
            "PERMITIDO: Criar propostas, gerenciar proposições, gerar relatórios, acompanhar votos, boas práticas legislativas. " +
            "RESTRIÇÃO: SÓ sobre funcionalidades de vereador. NÃO sobre admin municipal ou outros vereadores.",

          admin_cidade:
            "Você é o EduCracia, assistente administrativo municipal da plataforma Voto Popular. " +
            "FUNÇÃO: Guiar gestão da plataforma FOCADA NO SEU MUNICÍPIO. " +
            "ONBOARDING: Ajude o admin a 'como cadastrar vereadores' ou 'gerar relatórios consolidados'. " +
            "PERMITIDO: Moderação de propostas, gestão de vereadores locais, relatórios consolidados, análise de engajamento. " +
            "RESTRIÇÃO DE SEGURANÇA: SÓ dados do seu município. NÃO sobre outros municípios ou Super Admin.",

          superadmin:
            "Você é o EduCracia, assistente do Super Admin da plataforma Voto Popular. " +
            "FUNÇÃO: Guiar administração global da plataforma. " +
            "PERMITIDO: Gestão de municípios, personalização de temas, estatísticas globais, monitoramento de logs. " +
            "RESTRIÇÃO: SÓ sobre funcionalidades globais da plataforma Voto Popular.",
        };

        const conversationMessages =
          input.conversationHistory?.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })) || [];

        const messages = [
          createSystemMessage(contextPrompts[userRole] || contextPrompts.cidadao),
          ...conversationMessages,
          createUserMessage(input.message),
        ];

        const response = await invokeLLM({
          messages: messages as any,
        });

        const assistantMessage =
          response.choices?.[0]?.message?.content ||
          "Desculpe, não consegui processar sua mensagem. Tente novamente.";

        return {
          message: assistantMessage,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("[Chat] Error:", error);
        throw new Error("Erro ao processar mensagem do chatbot");
      }
    }),

  /**
   * Submeter reclamação manualmente
   */
  submitComplaint: publicProcedure
    .input(
      z.object({
        complaint: z.string().min(10).max(2000),
        userEmail: z.string().email().optional(),
        context: z.enum(["cidadao", "vereador", "admin_cidade", "superadmin"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Enviar email de reclamação para o suporte
        const complaintSent = await sendComplaintEmail(
          input.complaint,
          input.userEmail,
          input.context
        );

        // Enviar confirmação para o usuário se email foi fornecido
        if (input.userEmail && complaintSent) {
          await sendComplaintConfirmationEmail(input.userEmail);
        }

        // Salvar reclamação no banco de dados
        if (ctx.user) {
          await db.insertComplaint({
            userId: ctx.user.id,
            municipalityId: ctx.user.municipioId || "global",
            complaintText: input.complaint,
            status: "open",
          });
        }

        // Também enviar notificação para o owner
        await notifyOwner({
          title: "🚨 Nova Reclamação - Voto Popular",
          content: `Contexto: ${input.context || "Não especificado"}\nEmail: ${input.userEmail || "Não fornecido"}\n\nMensagem:\n${input.complaint}`,
        });

        return {
          success: complaintSent,
          message: complaintSent
            ? "Reclamação enviada com sucesso. Você receberá uma confirmação por email."
            : "Erro ao enviar reclamação. Tente novamente.",
        };
      } catch (error) {
        console.error("[Complaint] Error:", error);
        throw new Error("Erro ao enviar reclamação");
      }
    }),
});
