import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Municípios - Tabela para multi-tenancy por cidade
 */
export const municipios = mysqlTable("municipios", {
  id: varchar("id", { length: 255 }).primaryKey(), // Ex: 'sao-paulo'
  nome: varchar("nome", { length: 255 }).notNull(), // Ex: 'Prefeitura de São Paulo'
  logoUrl: text("logoUrl"),
  corPrimaria: varchar("corPrimaria", { length: 7 }).default("#0066cc"),
  corSecundaria: varchar("corSecundaria", { length: 7 }).default("#f0f0f0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Municipio = typeof municipios.$inferSelect;
export type InsertMunicipio = typeof municipios.$inferInsert;

/**
 * Theme configuration table for Super Admin customization (low-code)
 * MANTIDO para compatibilidade com código existente
 */
export const themeConfigs = mysqlTable("themeConfigs", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: varchar("municipalityId", { length: 64 }).notNull(),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#0066cc"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#f0f0f0"),
  logoUrl: text("logoUrl"),
  accentColor: varchar("accentColor", { length: 7 }).default("#ff6b35"),
  fontFamily: varchar("fontFamily", { length: 255 }).default("'Inter', sans-serif"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ThemeConfig = typeof themeConfigs.$inferSelect;
export type InsertThemeConfig = typeof themeConfigs.$inferInsert;

/**
 * Municipalities - MANTIDO para compatibilidade
 */
export const municipalities = mysqlTable("municipalities", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: varchar("municipalityId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Municipality = typeof municipalities.$inferSelect;
export type InsertMunicipality = typeof municipalities.$inferInsert;

/**
 * Usuários - Refatorado para usar Firebase UID
 */
export const users = mysqlTable("users", {
  // Firebase UID como Primary Key
  id: varchar("id", { length: 255 }).primaryKey(), // Firebase UID
  
  // Informações básicas
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  cpf: varchar("cpf", { length: 11 }),
  
  // Sistema de cargos (RBAC)
  role: mysqlEnum("role", ["cidadao", "vereador", "admin_cidade", "superadmin"])
    .default("cidadao")
    .notNull(),
  
  // Município (chave estrangeira)
  municipioId: varchar("municipioId", { length: 255 }), // FK para municipios.id
  
  // Campos adicionais
  birthDate: date("birthDate"),
  zipCode: varchar("zipCode", { length: 8 }),
  password: varchar("password", { length: 255 }), // Mantido para compatibilidade
  loginMethod: varchar("loginMethod", { length: 64 }).default("firebase"),
  
  // Status e verificação
  isActive: boolean("isActive").default(true),
  isEmailVerified: boolean("isEmailVerified").default(false),
  isCpfVerified: boolean("isCpfVerified").default(false),
  
  // Segurança
  failedLoginCount: int("failedLoginCount").default(0),
  lastFailedLoginAttempt: timestamp("lastFailedLoginAttempt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  
  // Campos removidos: openId, emailVerificationToken, emailVerificationExpires, otpCode, otpExpires
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Proposals table for legislative items
 */
export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: varchar("proposalId", { length: 64 }).notNull().unique(),
  municipalityId: varchar("municipalityId", { length: 64 }).notNull(),
  vereadorId: varchar("vereadorId", { length: 255 }).notNull(), // Agora é Firebase UID
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "archived"]).default("pending").notNull(),
  voteCount: int("voteCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

/**
 * Votes table for tracking citizen votes on proposals
 */
export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull(),
  citizenId: varchar("citizenId", { length: 255 }).notNull(), // Agora é Firebase UID
  municipalityId: varchar("municipalityId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

/**
 * Audit logs for tracking critical actions
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 255 }), // Agora é Firebase UID
  municipalityId: varchar("municipalityId", { length: 64 }),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Complaints table for tracking user complaints and feedback
 */
export const complaints = mysqlTable("complaints", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(), // Agora é Firebase UID
  municipalityId: varchar("municipalityId", { length: 64 }).notNull(),
  complaintText: text("complaintText").notNull(),
  status: mysqlEnum("status", ["open", "in_review", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = typeof complaints.$inferInsert;
