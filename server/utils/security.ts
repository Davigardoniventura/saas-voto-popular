import crypto from "crypto";
import { promisify } from "util";

// Promisify a versão assíncrona
const pbkdf2 = promisify(crypto.pbkdf2);

/**
 * Hash de senha usando PBKDF2 com SHA-256
 * Implementação segura sem dependências externas
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(32).toString("hex");
  // Agora é assíncrono:
  const hashBuffer = await pbkdf2(password, salt, 100000, 64, "sha256");
  const hash = hashBuffer.toString("hex");

  return `${salt}:${hash}`;
}

/**
 * Verificação de senha
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(":");

  if (!salt || !hash) {
    return false;
  }

  // Agora é assíncrono:
  const computedHashBuffer = await pbkdf2(password, salt, 100000, 64, "sha256");
  const computedHash = computedHashBuffer.toString("hex");

  return computedHash === hash;
}

/**
 * Gera um token aleatório para verificação de email ou reset de senha
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Gera um código de verificação numérico de 6 dígitos
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Rate limiting: verifica se o usuário excedeu o limite de tentativas
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // em milissegundos
}

export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private config: RateLimitConfig) {}

  isLimited(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, resetTime: now + this.config.windowMs });
      return false;
    }

    if (now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.config.windowMs });
      return false;
    }

    record.count++;

    if (record.count > this.config.maxAttempts) {
      return true;
    }

    return false;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  getAttempts(key: string): number {
    const record = this.attempts.get(key);
    return record ? record.count : 0;
  }
}

/**
 * Validação de CORS para requisições cross-origin
 */
export function isValidOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.includes(origin);
}

/**
 * Sanitização de SQL para prevenir injeção (use prepared statements quando possível)
 */
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Gera um ID único para propostas
 */
export function generateProposalId(): string {
  return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gera um ID único para municípios
 */
export function generateMunicipalityId(): string {
  return `mun_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Criptografia de dados sensíveis (para armazenamento)
 */
export function encryptSensitiveData(data: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key, "hex"), iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Descriptografia de dados sensíveis
 */
export function decryptSensitiveData(encryptedData: string, key: string): string {
  const [ivHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key, "hex"), iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
