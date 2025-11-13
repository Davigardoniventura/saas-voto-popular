import { type inferAsyncReturnType } from "@trpc/server";
import { type CreateExpressContextOptions } from "@trpc/server/adapters/express";
import * as admin from "firebase-admin";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./env";

// Inicializar Firebase Admin (apenas uma vez)
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;
  
  try {
    // Verificar se já foi inicializado
    if (admin.apps.length > 0) {
      firebaseInitialized = true;
      console.log("[Firebase] ✅ Firebase Admin já estava inicializado");
      return;
    }

    // Verificar se a configuração está disponível
    const serviceAccountConfig = ENV.firebaseAdminConfig;
    
    if (!serviceAccountConfig) {
      console.warn(
        "[Firebase] ⚠️  FIREBASE_ADMIN_CONFIG não encontrada.\n" +
        "Autenticação Firebase desabilitada. Configure a variável de ambiente para habilitar."
      );
      return;
    }

    // Tentar fazer parse da configuração
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountConfig);
    } catch (parseError) {
      console.error(
        "[Firebase] ❌ Erro ao fazer parse de FIREBASE_ADMIN_CONFIG:\n" +
        "A variável deve conter um JSON válido (string minificada).\n" +
        "Erro:", parseError
      );
      return;
    }

    // Validar campos obrigatórios
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.error(
        "[Firebase] ❌ FIREBASE_ADMIN_CONFIG inválida.\n" +
        "Campos obrigatórios: project_id, private_key, client_email"
      );
      return;
    }

    // Inicializar Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log("[Firebase] ✅ Firebase Admin inicializado com sucesso");
    console.log(`[Firebase] Project ID: ${serviceAccount.project_id}`);
  } catch (error) {
    console.error("[Firebase] ❌ Erro ao inicializar Firebase Admin:", error);
    console.error("[Firebase] Stack trace:", error instanceof Error ? error.stack : "N/A");
  }
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // Inicializar Firebase na primeira chamada
  initializeFirebase();

  let user = null;

  try {
    // Obter token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      
      // Verificar token com Firebase Admin
      if (firebaseInitialized && admin.apps.length > 0) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          const uid = decodedToken.uid;
          
          // Buscar usuário no banco de dados
          const db = await getDb();
          if (db) {
            const result = await db.select().from(users).where(eq(users.id, uid)).limit(1);
            if (result.length > 0) {
              user = result[0];
            } else {
              console.warn(`[Auth] Token válido mas usuário ${uid} não encontrado no banco`);
            }
          } else {
            console.warn("[Auth] Token válido mas banco de dados não disponível");
          }
        } catch (tokenError) {
          // Log mais detalhado do erro de token
          if (tokenError instanceof Error) {
            console.error("[Auth] Erro ao verificar token:", tokenError.message);
          } else {
            console.error("[Auth] Token inválido ou expirado");
          }
        }
      } else {
        console.warn("[Auth] Token fornecido mas Firebase Admin não está inicializado");
      }
    }
  } catch (error) {
    console.error("[Context] Erro ao criar contexto:", error);
  }

  return {
    req,
    res,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
export type TrpcContext = Context;
