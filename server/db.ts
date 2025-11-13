import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { Buffer } from "node:buffer";
import { InsertUser, users, proposals, votes, municipalities, themeConfigs, auditLogs, municipios, complaints, InsertMunicipio, InsertProposal, InsertVote, InsertAuditLog, InsertMunicipality, InsertComplaint } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

function getRequiredTiDBEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Database] ❌ Variável de ambiente obrigatória do TiDB não encontrada: ${key}\n` +
      `A aplicação não pode conectar ao banco de dados sem esta configuração.\n` +
      `Por favor, defina ${key} nas variáveis de ambiente.`
    );
  }
  return value;
}

function getTiDbCertFromEnv(): string | undefined {
  const certBase64 = ENV.tidbCaCertBase64;
  
  if (!certBase64) {
    // Certificado é opcional - pode não ser necessário dependendo da configuração
    console.log("[Database] ⚠️  TIDB_CA_CERT_BASE64 não encontrada. Conexão SSL pode falhar.");
    return undefined;
  }
  
  try {
    const certString = Buffer.from(certBase64, 'base64').toString('utf-8');
    console.log("[Database] ✅ Certificado SSL TiDB carregado de variável de ambiente");
    return certString;
  } catch (error) {
    console.error(
      `[Database] ❌ Erro ao decodificar TIDB_CA_CERT_BASE64: ${error}\n` +
      "Verifique se o certificado está corretamente codificado em base64."
    );
    return undefined;
  }
}

async function testConnection(pool: mysql.Pool): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("[Database] ✅ Conexão testada com sucesso (ping)");
    return true;
  } catch (error) {
    console.error("[Database] ❌ Falha no teste de conexão:", error);
    return false;
  }
}

export async function getDb() {
  if (!_db) {
    try {
      let poolConfig: mysql.PoolOptions;

      if (ENV.databaseUrl) {
        // Opção 1: Usar DATABASE_URL (padrão do Render)
        console.log("[Database] Usando DATABASE_URL para conexão.");
        
        // Validar se a URL não contém placeholder
        if (ENV.databaseUrl.includes('<PASSWORD>')) {
          throw new Error(
            "[Database] ❌ DATABASE_URL contém placeholder <PASSWORD>.\n" +
            "Por favor, substitua pela senha real do banco de dados."
          );
        }
        
        poolConfig = {
          uri: ENV.databaseUrl,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 15000,
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,
        };
      } else if (ENV.tidbHost && ENV.tidbUser && ENV.tidbPassword && ENV.tidbDatabase) {
        // Opção 2: Usar variáveis TiDB (fallback)
        console.log("[Database] Usando variáveis TiDB para conexão.");
        const dbHost = ENV.tidbHost;
        const dbPort = parseInt(ENV.tidbPort || "4000", 10);
        const dbUser = ENV.tidbUser;
        const dbPassword = ENV.tidbPassword;
        const dbName = ENV.tidbDatabase;
        
        const sslCert = getTiDbCertFromEnv();
        
        // Configurar SSL apenas se certificado estiver disponível
        const sslConfig = sslCert ? {
          ca: sslCert,
          rejectUnauthorized: true
        } : {
          rejectUnauthorized: false // Permitir conexão sem certificado (menos seguro)
        };
        
        poolConfig = {
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPassword,
          database: dbName,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 15000,
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,
          ssl: sslConfig
        };
      } else {
        throw new Error(
          "[Database] ❌ Configuração de banco de dados incompleta.\n" +
          "Defina DATABASE_URL ou todas as variáveis TiDB (TIDB_HOST, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE)."
        );
      }

      _pool = mysql.createPool(poolConfig);
      
      // Testar conexão antes de confirmar sucesso
      const isConnected = await testConnection(_pool);
      
      if (!isConnected) {
        throw new Error("[Database] ❌ Falha ao testar conexão com o banco de dados");
      }
      
      _db = drizzle(_pool) as any;
      console.log("[Database] ✅ Connected to TiDB successfully (pool + ping test)");
    } catch (error) {
      console.error("[Database] ❌ Failed to connect:", error);
      // Não fazer throw - permitir que a aplicação inicie sem banco (modo degradado)
      console.warn("[Database] ⚠️  Aplicação iniciando sem conexão com banco de dados");
      return null;
    }
  }
  return _db;
}

// Funções para Firebase UID
export async function getUserById(id: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get user: database not available");
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create user: database not available");
  }

  await db.insert(users).values(user);
}

export async function updateUserLastSignIn(id: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update user: database not available");
  }

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function updateUserProfile(id: string, data: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update user: database not available");
  }

  await db.update(users).set(data).where(eq(users.id, id));
}

// MANTIDO para compatibilidade
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User id is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot upsert user: database not available");
  }

  try {
    const values: InsertUser = {
      id: user.id,
      email: user.email || "",
      cpf: user.cpf || "",
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "password"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.birthDate !== undefined) {
      values.birthDate = user.birthDate;
      updateSet.birthDate = user.birthDate;
    }
    if (user.zipCode !== undefined) {
      values.zipCode = user.zipCode;
      updateSet.zipCode = user.zipCode;
    }
    if (user.municipalityId !== undefined) {
      values.municipalityId = user.municipalityId;
      updateSet.municipalityId = user.municipalityId;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

// MANTIDO para compatibilidade
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get user: database not available");
  }

  const result = await db.select().from(users).where(eq(users.id, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByCpf(cpf: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get user: database not available");
  }

  const result = await db.select().from(users).where(eq(users.cpf, cpf)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getProposalsByMunicipality(municipalityId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get proposals: database not available");
  }

  return await db.select().from(proposals).where(eq(proposals.municipalityId, municipalityId));
}

export async function getProposalsByVereador(vereadorId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get proposals: database not available");
  }

  return await db.select().from(proposals).where(eq(proposals.vereadorId, vereadorId));
}

export async function createProposal(proposal: InsertProposal) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create proposal: database not available");
  }

  const result = await db.insert(proposals).values(proposal);
  return result;
}

export async function createVote(vote: InsertVote) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create vote: database not available");
  }

  const result = await db.insert(votes).values(vote);
  return result;
}

export async function getThemeConfig(municipalityId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get theme config: database not available");
  }

  const result = await db.select().from(themeConfigs).where(eq(themeConfigs.municipalityId, municipalityId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create audit log: database not available");
  }

  return await db.insert(auditLogs).values(log);
}


export async function getVoteByCitizenAndProposal(citizenId: number, proposalId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get vote: database not available");
  }

  const result = await db
    .select()
    .from(votes)
    .where(and(eq(votes.citizenId, citizenId), eq(votes.proposalId, proposalId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function incrementProposalVoteCount(proposalId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot increment vote count: database not available");
  }

  const proposal = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  
  if (proposal.length === 0) {
    throw new Error("Proposal not found");
  }

  const currentVoteCount = proposal[0].voteCount || 0;
  
  return await db
    .update(proposals)
    .set({ voteCount: currentVoteCount + 1 })
    .where(eq(proposals.id, proposalId));
}

export async function getMunicipioById(id: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get municipio: database not available");
  }

  const result = await db.select().from(municipios).where(eq(municipios.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMunicipio(municipio: InsertMunicipio) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create municipio: database not available");
  }

  return await db.insert(municipios).values(municipio);
}

export async function getAllMunicipios() {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get municipios: database not available");
  }

  return await db.select().from(municipios);
}

// Funções adicionais para proposals
export async function getProposalByProposalId(proposalId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get proposal: database not available");
  }

  const result = await db.select().from(proposals).where(eq(proposals.proposalId, proposalId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProposalStatus(proposalId: number, status: "pending" | "approved" | "rejected" | "archived") {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update proposal: database not available");
  }

  return await db.update(proposals).set({ status }).where(eq(proposals.id, proposalId));
}

// Funções para municipalities
export async function createMunicipality(municipality: InsertMunicipality) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create municipality: database not available");
  }

  return await db.insert(municipalities).values(municipality);
}

// Funções para theme configs
export async function updateThemeConfig(config: { municipalityId: string; primaryColor?: string; secondaryColor?: string; logoUrl?: string; accentColor?: string; fontFamily?: string }) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update theme config: database not available");
  }

  // Verificar se já existe uma configuração
  const existing = await getThemeConfig(config.municipalityId);

  if (existing) {
    // Atualizar existente
    return await db.update(themeConfigs).set(config).where(eq(themeConfigs.municipalityId, config.municipalityId));
  } else {
    // Criar nova
    return await db.insert(themeConfigs).values(config as any);
  }
}

// Funções para gerenciamento de usuários
export async function promoteUserToRole(userId: string, role: "cidadao" | "vereador" | "admin_cidade" | "superadmin", municipalityId?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot promote user: database not available");
  }

  const updateData: any = { role };
  if (municipalityId) {
    updateData.municipioId = municipalityId;
  }

  return await db.update(users).set(updateData).where(eq(users.id, userId));
}

// Funções para complaints
export async function insertComplaint(complaint: InsertComplaint) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot insert complaint: database not available");
  }

  return await db.insert(complaints).values(complaint);
}

export async function getComplaintsByMunicipality(municipalityId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get complaints: database not available");
  }

  return await db.select().from(complaints).where(eq(complaints.municipalityId, municipalityId));
}

export async function updateComplaintStatus(complaintId: number, status: "open" | "in_review" | "closed") {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update complaint: database not available");
  }

  return await db.update(complaints).set({ status }).where(eq(complaints.id, complaintId));
}

// Funções para atualização de municípios
export async function updateMunicipio(id: string, data: Partial<InsertMunicipio>) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update municipio: database not available");
  }

  return await db.update(municipios).set(data).where(eq(municipios.id, id));
}
