import axios from "axios";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant";

export type Message = {
  role: Role;
  content: string;
};

export type InvokeParams = {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
};

export type InvokeResult = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/**
 * Chama a API de Agente da Manus
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const { messages, temperature = 0.7, maxTokens = 32768 } = params;

  // Verificar se a API key está configurada
  if (!ENV.manusAiApiKey) {
    throw new Error("MANUS_AI_API_KEY não está configurada");
  }

  if (!ENV.manusAiEndpoint) {
    throw new Error("MANUS_AI_ENDPOINT não está configurado");
  }

  try {
    // Fazer chamada para a API da Manus
    const response = await axios.post(
      ENV.manusAiEndpoint,
      {
        model: "gpt-4o-mini", // Modelo padrão da Manus
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ENV.manusAiApiKey}`,
        },
        timeout: 60000, // 60 segundos
      }
    );

    return response.data as InvokeResult;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`Erro na API da Manus: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Função auxiliar para criar mensagens de sistema
 */
export function createSystemMessage(content: string): Message {
  return {
    role: "system",
    content,
  };
}

/**
 * Função auxiliar para criar mensagens de usuário
 */
export function createUserMessage(content: string): Message {
  return {
    role: "user",
    content,
  };
}

/**
 * Função auxiliar para criar mensagens de assistente
 */
export function createAssistantMessage(content: string): Message {
  return {
    role: "assistant",
    content,
  };
}

/**
 * ECONOMIA DE CRÉDITOS: Classificação de baixo custo
 * Usa um prompt simples para classificar a intenção do usuário
 * sem gastar créditos em diálogos complexos
 */
export type IntencaoUsuario = "RECLAMACAO_TECNICA" | "DUVIDA_CIVICA" | "CONVERSA_GERAL";

/**
 * Função de classificação de intenção (nome conforme especificação)
 * ECONOMIA: Usa gpt-4o-mini com prompt simples e direto
 */
export async function classifyIntent(message: string): Promise<IntencaoUsuario> {
  try {
    // Prompt de classificação econômico (baixo custo)
    const promptClassificacao = `Classifique a mensagem em UMA categoria:

RECLAMACAO_TECNICA: bugs, erros, falhas, sistema não funciona, problemas técnicos
DUVIDA_CIVICA: perguntas sobre propostas, vereadores, votação, plataforma, cidadania
CONVERSA_GERAL: saudações, agradecimentos, conversas casuais

Mensagem: "${message}"

Responda APENAS: RECLAMACAO_TECNICA, DUVIDA_CIVICA ou CONVERSA_GERAL`;

    const response = await invokeLLM({
      messages: [
        createSystemMessage("Você é um classificador preciso. Responda apenas com a categoria."),
        createUserMessage(promptClassificacao),
      ],
      temperature: 0.1, // Baixa temperatura para respostas consistentes
      maxTokens: 10, // Apenas a classificação
    });

    const classificacao = response.choices[0]?.message?.content?.trim().toUpperCase();

    // Validar resposta
    if (classificacao?.includes("RECLAMACAO_TECNICA")) {
      return "RECLAMACAO_TECNICA";
    } else if (classificacao?.includes("DUVIDA_CIVICA")) {
      return "DUVIDA_CIVICA";
    } else {
      return "CONVERSA_GERAL";
    }
  } catch (error) {
    console.error("[LLM] Erro ao classificar intenção:", error);
    // Em caso de erro, retornar CONVERSA_GERAL (mais seguro)
    return "CONVERSA_GERAL";
  }
}

/**
 * Função de classificação (alias para compatibilidade)
 */
export async function classificarIntencao(mensagem: string): Promise<IntencaoUsuario> {
  try {
    // Prompt de classificação econômico (baixo custo)
    const promptClassificacao = `Você é um classificador de intenções. Analise a mensagem do usuário e classifique em UMA das categorias:

RECLAMACAO_TECNICA: Mensagens sobre bugs, erros, falhas técnicas, sistema não funciona, problemas de login, banco de dados, etc.
DUVIDA_CIVICA: Perguntas sobre propostas, vereadores, votação, como usar a plataforma, cidadania.
CONVERSA_GERAL: Saudações, agradecimentos, conversas casuais.

Mensagem do usuário: "${mensagem}"

Responda APENAS com uma das palavras: RECLAMACAO_TECNICA, DUVIDA_CIVICA ou CONVERSA_GERAL`;

    const response = await invokeLLM({
      messages: [
        createSystemMessage("Você é um classificador preciso e econômico."),
        createUserMessage(promptClassificacao),
      ],
      temperature: 0.1, // Baixa temperatura para respostas consistentes
      maxTokens: 10, // Apenas a classificação
    });

    const classificacao = response.choices[0]?.message?.content?.trim().toUpperCase();

    // Validar resposta
    if (classificacao?.includes("RECLAMACAO_TECNICA")) {
      return "RECLAMACAO_TECNICA";
    } else if (classificacao?.includes("DUVIDA_CIVICA")) {
      return "DUVIDA_CIVICA";
    } else {
      return "CONVERSA_GERAL";
    }
  } catch (error) {
    console.error("[LLM] Erro ao classificar intenção:", error);
    // Em caso de erro, retornar CONVERSA_GERAL (mais seguro)
    return "CONVERSA_GERAL";
  }
}
