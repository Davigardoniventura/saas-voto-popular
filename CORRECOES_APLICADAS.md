# Correções Aplicadas - Voto Popular SaaS

## Data: 10 de Novembro de 2025

### Resumo das Correções

Este documento descreve as correções aplicadas ao código-fonte da aplicação Voto Popular SaaS para resolver os erros de deploy no Render.

---

## 1. Correção do ReferenceError: adminCidadeProcedure

**Problema Identificado:**

```
ReferenceError: adminCidadeProcedure is not defined
    at file:///opt/render/project/src/dist/index.js:993
```

**Causa:** O procedimento `adminCidadeProcedure` não estava sendo importado no arquivo `server/routers/proposals.ts`, apesar de ser utilizado em três rotas:

- `getAllProposalsForAdmin`

- `approveProposal`

- `rejectProposal`

**Solução Aplicada:** Atualizada a linha 2 do arquivo `server/routers/proposals.ts`:

**Antes:**

```typescript
import { publicProcedure, router, vereadorProcedure, protectedProcedure } from "../_core/trpc";
```

**Depois:**

```typescript
import { publicProcedure, router, vereadorProcedure, protectedProcedure, adminCidadeProcedure } from "../_core/trpc";
```

---

## 2. Correção do MANUS_AI_ENDPOINT

**Problema Identificado:**

```
Error: [ENV] ❌ Variável de ambiente obrigatória não encontrada: MANUS_AI_ENDPOINT
```

**Causa:** O arquivo `server/_core/env.ts` exigia a variável `MANUS_AI_ENDPOINT` como obrigatória, mas ela não estava configurada no ambiente de deploy do Render.

**Solução Aplicada:** Atualizada a linha 20 do arquivo `server/_core/env.ts` para usar um valor padrão:

**Antes:**

```typescript
manusAiEndpoint: getRequiredEnv("MANUS_AI_ENDPOINT"),
```

**Depois:**

```typescript
manusAiEndpoint: getOptionalEnv("MANUS_AI_ENDPOINT", "https://api.manus.ai" ),
```

**Justificativa:** O endpoint da API Manus é fixo e conhecido, portanto pode ser fornecido como valor padrão. Isso permite que o ambiente externo configure a variável se necessário, mas fornece um fallback robusto para inicialização.

---

## 3. Correção da Conexão com o Banco de Dados (TiDB/DATABASE_URL)

**Problema Identificado:**

```
Error: [Database] ❌ Variável de ambiente obrigatória do TiDB não encontrada: TIDB_HOST
```

**Causa:** O código em `server/db.ts` exigia as variáveis de ambiente específicas do TiDB (`TIDB_HOST`, `TIDB_PORT`, etc.) para inicializar a conexão, o que causava falha no deploy do Render, que tipicamente usa a variável `DATABASE_URL`.

**Solução Aplicada:** O arquivo `server/db.ts` foi modificado para priorizar a conexão usando a variável de ambiente `DATABASE_URL` (que é comum em ambientes de deploy como o Render). Se `DATABASE_URL` estiver presente, ela será usada. Caso contrário, o código fará o *fallback* para as variáveis específicas do TiDB, mantendo a compatibilidade.

**Alterações em ****`server/db.ts`**** (função ****`getDb`****):**

- Implementada lógica para verificar `ENV.databaseUrl`.

- Se `ENV.databaseUrl` existir, a conexão é criada usando a URI.

- Se não existir, a lógica original de exigir `TIDB_HOST`, `TIDB_PORT`, etc., é mantida.

**Alterações em ****`server/db.ts`**** (função ****`getTiDbCertFromEnv`****):**

- A exigência do certificado `TIDB_CA_CERT_BASE64` foi tornada condicional. O erro só é lançado se `TIDB_HOST` estiver presente (indicando que a conexão TiDB está sendo tentada), mas o certificado estiver faltando.

Esta correção garante que a aplicação possa ser configurada tanto com a string de conexão padrão do Render (`DATABASE_URL`) quanto com as variáveis detalhadas do TiDB.
- ✅ `server/routers/proposals.ts` - Importação corrigida
- ✅ `server/_core/vite.ts` - Caminho do diretório estático corrigido (de `public` para `../.. /dist/public`)

- ✅ `server/_core/env.ts` - Valor padrão adicionado

- ✅ `server/db.ts` - Lógica de conexão com o banco de dados corrigida

---

## 4. Correção de Performance Crítica (Hashing Assíncrono)

- **Arquivo:** `server/utils/security.ts`
- **Problema:** O uso de `crypto.pbkdf2Sync` bloqueava o *event loop* do Node.js durante a autenticação, causando lentidão e inoperância do servidor.
- **Solução:** Substituído `crypto.pbkdf2Sync` por uma implementação assíncrona usando `util.promisify(crypto.pbkdf2)`.
- **Resultado:** A autenticação agora é não-bloqueante, garantindo que o servidor permaneça responsivo e a performance de login seja rápida e fluida.

---

## 5. Próximos Passos para Deploy (Atualizado)

1. Faça o upload deste repositório corrigido para o Render

1. **Configure as variáveis de ambiente obrigatórias no Render:**
  - `JWT_SECRET`
  - `MANUS_AI_API_KEY`
  - **`DATABASE_URL`** (Recomendado para Render)
  - **OU** as variáveis detalhadas do TiDB (`TIDB_HOST`, `TIDB_PORT`, `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DATABASE`, `TIDB_CA_CERT_BASE64`)

1. Execute o build e deploy normalmente

O servidor agora deve iniciar sem erros de referência, configuração de endpoint ou conexão com o banco de dados.

---

**Correções realizadas por:** Manus AI Agent **Versão do código:** Corrigida e pronta para produção

