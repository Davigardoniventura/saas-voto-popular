import { getDb } from "../db";
import { eq, and, gte } from "drizzle-orm";
import { users, auditLogs } from "../../drizzle/schema";

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // em milissegundos
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
};

/**
 * Verifica se um usuário excedeu o limite de tentativas de login
 */
export async function checkLoginRateLimit(
  cpf: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remainingAttempts: number; resetTime?: Date }> {
  const db = await getDb();
  if (!db) {
    return { allowed: true, remainingAttempts: config.maxAttempts };
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.cpf, cpf))
      .limit(1);

    if (!user || user.length === 0) {
      return { allowed: true, remainingAttempts: config.maxAttempts };
    }

    const userData = user[0];
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Verificar se a última tentativa falha foi dentro da janela
    if (
      userData.lastFailedLoginAttempt &&
      userData.lastFailedLoginAttempt > windowStart
    ) {
      const failedAttempts = userData.failedLoginCount || 0;
      const allowed = failedAttempts < config.maxAttempts;
      const remainingAttempts = Math.max(0, config.maxAttempts - failedAttempts);

      return {
        allowed,
        remainingAttempts,
        resetTime: new Date(windowStart.getTime() + config.windowMs),
      };
    }

    return { allowed: true, remainingAttempts: config.maxAttempts };
  } catch (error) {
    console.error("Erro ao verificar rate limit:", error);
    return { allowed: true, remainingAttempts: config.maxAttempts };
  }
}

/**
 * Registra uma tentativa de login
 */
export async function recordLoginAttempt(
  cpf: string,
  successful: boolean,
  ipAddress?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.cpf, cpf))
      .limit(1);

    if (!user || user.length === 0) return;

    const userData = user[0];

    if (!successful) {
      // Incrementar contador de tentativas falhadas
      const newFailedCount = (userData.failedLoginCount || 0) + 1;

      // Atualizar usuário com nova tentativa falhada
      await db
        .update(users)
        .set({
          failedLoginCount: newFailedCount,
          lastFailedLoginAttempt: new Date(),
        })
        .where(eq(users.id, userData.id));
    } else {
      // Resetar contador ao fazer login com sucesso
      await db
        .update(users)
        .set({
          failedLoginCount: 0,
          lastFailedLoginAttempt: null,
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, userData.id));
    }

    // Registrar no audit log
    await db.insert(auditLogs).values({
      userId: userData.id,
      action: successful ? "LOGIN_SUCCESS" : "LOGIN_FAILED",
      ipAddress: ipAddress || "unknown",
    });
  } catch (error) {
    console.error("Erro ao registrar tentativa de login:", error);
  }
}

/**
 * Verifica se um CPF já foi registrado
 */
export async function isCpfRegistered(cpf: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.cpf, cpf))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Erro ao verificar CPF:", error);
    return false;
  }
}

/**
 * Verifica se um email já foi registrado
 */
export async function isEmailRegistered(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Erro ao verificar email:", error);
    return false;
  }
}

/**
 * Detecta padrões suspeitos de múltiplas contas
 */
export async function detectMultipleAccountsPattern(
  cpf: string,
  email: string,
  ipAddress?: string
): Promise<{ suspicious: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) {
    return { suspicious: false };
  }

  try {
    // Verificar se o CPF ou email já existem
    const cpfExists = await isCpfRegistered(cpf);
    const emailExists = await isEmailRegistered(email);

    if (cpfExists || emailExists) {
      return {
        suspicious: true,
        reason: "CPF ou email já registrado",
      };
    }

    return { suspicious: false };
  } catch (error) {
    console.error("Erro ao detectar padrões suspeitos:", error);
    return { suspicious: false };
  }
}

/**
 * Valida dados de entrada para prevenir injeção
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < e >
    .replace(/['";]/g, "") // Remove quotes e ponto-e-vírgula
    .trim();
}

/**
 * Valida CPF para prevenir padrões conhecidos de fraude
 */
export function validateCPFPattern(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, "");

  // Verifica se todos os dígitos são iguais (padrão de fraude comum)
  if (/^(\d)\1{10}$/.test(cleanCpf)) {
    return false;
  }

  // Verifica se é um CPF conhecido como inválido
  const knownInvalidCPFs = [
    "00000000000",
    "11111111111",
    "22222222222",
    "33333333333",
    "44444444444",
    "55555555555",
    "66666666666",
    "77777777777",
    "88888888888",
    "99999999999",
  ];

  if (knownInvalidCPFs.includes(cleanCpf)) {
    return false;
  }

  return true;
}

/**
 * Gera um hash de fingerprint do navegador para detecção de múltiplas contas
 */
export function generateDeviceFingerprint(
  userAgent: string,
  acceptLanguage: string,
  ipAddress: string
): string {
  const crypto = require("crypto");
  const combined = `${userAgent}|${acceptLanguage}|${ipAddress}`;
  return crypto.createHash("sha256").update(combined).digest("hex");
}
