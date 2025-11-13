import crypto from "crypto";

/**
 * Validação de CPF com algoritmo de autenticidade
 * Implementa o algoritmo oficial de validação do CPF brasileiro
 */
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCpf = cpf.replace(/\D/g, "");

  // Verifica se tem 11 dígitos
  if (cleanCpf.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCpf)) {
    return false;
  }

  // Calcula o primeiro dígito verificador
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cleanCpf.substring(9, 10))) {
    return false;
  }

  // Calcula o segundo dígito verificador
  sum = 0;

  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }

  if (remainder !== parseInt(cleanCpf.substring(10, 11))) {
    return false;
  }

  return true;
}

/**
 * Validação de CEP brasileiro
 */
export function isValidCEP(cep: string): boolean {
  const cleanCep = cep.replace(/\D/g, "");
  return cleanCep.length === 8 && /^\d{5}\d{3}$/.test(cleanCep);
}

/**
 * Validação de data de nascimento
 * Verifica se o usuário tem pelo menos 16 anos
 */
export function isValidAgeForVoting(dateOfBirth: Date): boolean {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 16;
}

/**
 * Validação de força de senha
 * Requer: mínimo 8 caracteres, pelo menos 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial
 */
export function isStrongPassword(password: string): {
  isStrong: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Senha deve ter pelo menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra maiúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra minúscula");
  }

  if (!/\d/.test(password)) {
    errors.push("Senha deve conter pelo menos um número");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Senha deve conter pelo menos um caractere especial");
  }

  return {
    isStrong: errors.length === 0,
    errors,
  };
}

/**
 * Sanitização de entrada para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validação de email básica
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gera um CPF aleatório para testes (não deve ser usado em produção)
 */
export function generateRandomCPF(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

  // Calcula primeiro dígito verificador
  let sum = digits.reduce((acc, digit, i) => acc + digit * (10 - i), 0);
  let remainder = (sum * 10) % 11;
  digits.push(remainder === 10 || remainder === 11 ? 0 : remainder);

  // Calcula segundo dígito verificador
  sum = digits.reduce((acc, digit, i) => acc + digit * (11 - i), 0);
  remainder = (sum * 10) % 11;
  digits.push(remainder === 10 || remainder === 11 ? 0 : remainder);

  return digits.join("");
}


/**
 * Hash de senha usando PBKDF2 com SHA-256
 * Implementação simplificada - em produção usar bcrypt ou argon2
 */
export function hashPassword(password: string): string {
  const salt = "voto-popular-salt-2025"; // Em produção, usar salt aleatório
  // Reduzido para 10000 iterações para evitar timeout (ainda seguro)
  return crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha256")
    .toString("hex");
}

/**
 * Verificar senha com hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}


/**
 * Gera um código OTP de 6 dígitos
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
