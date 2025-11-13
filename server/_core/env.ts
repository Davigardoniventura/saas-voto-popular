function getRequiredEnv(key: string): string {
  const value = process.env[key];
  const isProduction = process.env.NODE_ENV === "production";

  if (!value) {
    // Em produção, a variável é estritamente obrigatória.
    if (isProduction) {
      throw new Error(
        `[ENV] ❌ Variável de ambiente obrigatória não encontrada: ${key}\n` +
        `A aplicação não pode iniciar sem esta configuração. Por favor, defina ${key} nas variáveis de ambiente.`
      );
    }
    // Em desenvolvimento, retorna uma string vazia ou um valor padrão para evitar crash imediato,
    // mas o código deve ser robusto o suficiente para lidar com isso.
    // Para MANUS_AI_ENDPOINT e MANUS_AI_API_KEY, vamos usar um valor padrão seguro.
    if (key === "MANUS_AI_ENDPOINT") return "https://api.manus.im";
    if (key === "MANUS_AI_API_KEY") return "DUMMY_KEY_DEV";
    
    // Para outras variáveis críticas (como JWT_SECRET), ainda é melhor falhar ou usar um valor de fallback
    // que não comprometa a segurança, mas permita o desenvolvimento.
    if (key === "JWT_SECRET") return "INSECURE_DEV_SECRET";

    // Para qualquer outra variável obrigatória não definida em dev, ainda falhamos.
    throw new Error(
      `[ENV] ❌ Variável de ambiente obrigatória não encontrada em desenvolvimento: ${key}\n` +
      `Defina ${key} ou ajuste a lógica de fallback.`
    );
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string = ""): string {
  return process.env[key] ?? defaultValue;
}

export const ENV = {
  // Variáveis obrigatórias - fail-fast
  cookieSecret: getRequiredEnv("JWT_SECRET"),
  manusAiApiKey: getRequiredEnv("MANUS_AI_API_KEY"),
  manusAiEndpoint: getOptionalEnv("MANUS_AI_ENDPOINT", "https://api.manus.im"),
  
  // Firebase Admin
  firebaseAdminConfig: getOptionalEnv("FIREBASE_ADMIN_CONFIG"),
  
  // Banco de Dados
  databaseUrl: getOptionalEnv("DATABASE_URL"),
  tidbHost: getOptionalEnv("TIDB_HOST"),
  tidbPort: getOptionalEnv("TIDB_PORT"),
  tidbUser: getOptionalEnv("TIDB_USER"),
  tidbPassword: getOptionalEnv("TIDB_PASSWORD"),
  tidbDatabase: getOptionalEnv("TIDB_DATABASE"),
  tidbCaCertBase64: getOptionalEnv("TIDB_CA_CERT_BASE64"),
  
  // Email (SMTP)
  smtpHost: getOptionalEnv("SMTP_HOST", "smtp-relay.brevo.com"),
  smtpPort: parseInt(getOptionalEnv("SMTP_PORT", "587"), 10),
  emailUser: getOptionalEnv("EMAIL_USER"),
  emailPassword: getOptionalEnv("EMAIL_PASSWORD"),
  emailFrom: getOptionalEnv("EMAIL_FROM", "noreply@votopopular.com"),
  superAdminEmail: getOptionalEnv("SUPER_ADMIN_EMAIL", "saasvotopopular@gmail.com"),
  
  // Resend API (alternativa ao SMTP)
  resendApiKey: getOptionalEnv("RESEND_API_KEY"),
  
  // Variáveis opcionais
  appId: getOptionalEnv("VITE_APP_ID", "voto-popular"),
  oAuthServerUrl: getOptionalEnv("OAUTH_SERVER_URL"),
  ownerOpenId: getOptionalEnv("OWNER_OPEN_ID"),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: getOptionalEnv("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: getOptionalEnv("BUILT_IN_FORGE_API_KEY"),
  
  // Vite
  viteApiUrl: getOptionalEnv("VITE_API_URL"),
  viteFirebaseApiKey: getOptionalEnv("VITE_FIREBASE_API_KEY"),
  viteFirebaseAuthDomain: getOptionalEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  viteFirebaseProjectId: getOptionalEnv("VITE_FIREBASE_PROJECT_ID"),
  viteFirebaseStorageBucket: getOptionalEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  viteFirebaseMessagingSenderId: getOptionalEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  viteFirebaseAppId: getOptionalEnv("VITE_FIREBASE_APP_ID"),
  
  // Manus Agent
  manusAgentId: getOptionalEnv("MANUS_AGENT_ID", "EduCracia"),
};
