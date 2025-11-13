# 🚀 Deploy e Setup Final - Voto Popular SaaS

## 📋 Visão Geral

Este documento contém as instruções finais para configurar e fazer o deploy da plataforma **Voto Popular** em produção. A arquitetura de fundação (Firebase, Schema Multi-Tenant, Middlewares RBAC) está concluída e a lógica de negócio foi implementada.

---

## ✅ Implementações Concluídas

### 1. **Agente de Sustentação Econômico**
- ✅ Função `classifyIntent()` em `server/_core/llm.ts`
- ✅ Fluxo de Triagem Proativo em `server/routers/chat.ts`
- ✅ Economia de créditos de IA com classificação de baixo custo
- ✅ Envio automático de emails para reclamações técnicas

### 2. **Fechamento de Segurança Multi-Tenant**
- ✅ Verificação de `municipioId` nos middlewares RBAC
- ✅ Isolamento total de dados em `server/routers/proposals.ts`
- ✅ Verificação de propriedade de proposta em approve/reject
- ✅ Filtros WHERE em todas as queries de banco

### 3. **Painel de SuperAdmin**
- ✅ Interface completa em `client/src/pages/SuperAdminPanel.tsx`
- ✅ Listagem de municípios com tRPC
- ✅ Criação de novos clientes (municípios)
- ✅ Validação de dados e feedback visual

---

## 🔧 Pré-requisitos

Antes de iniciar o deploy, certifique-se de ter:

- ✅ Node.js 22.x instalado
- ✅ pnpm instalado (`npm install -g pnpm`)
- ✅ Conta no Firebase (para autenticação)
- ✅ Conta no TiDB Cloud (para banco de dados)
- ✅ Conta no Brevo/SMTP (para envio de emails)
- ✅ API Key da Manus AI (para chatbot)

---

## 📦 PASSO 1: Configuração do Banco de Dados

### 1.1. Aplicar Migração do Schema

O schema do banco de dados (`drizzle/schema.ts`) foi modificado para suportar Multi-Tenancy. Execute o comando abaixo para aplicar as novas tabelas e colunas ao banco de dados TiDB:

```bash
pnpm db:push
```

**O que este comando faz:**
- Cria a tabela `municipios` (clientes pagantes)
- Adiciona as colunas `role` e `municipioId` na tabela `users`
- Atualiza as tabelas `proposals`, `votes`, `complaints` com `municipalityId`
- Aplica todas as mudanças necessárias no schema

**Importante:** Faça backup do banco de dados antes de executar este comando!

---

## 👤 PASSO 2: Criar o Primeiro Super Admin

### 2.1. Criar Conta no Firebase Console

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para **Authentication** > **Users**
4. Clique em **Add User**
5. Preencha:
   - **Email**: `admin@votopopular.com.br` (ou seu email preferido)
   - **Password**: Senha forte e segura
6. **Anote o UID gerado** (você vai precisar dele no próximo passo)

### 2.2. Atualizar Role no Banco de Dados

Acesse o console do TiDB Cloud e execute o seguinte SQL:

```sql
-- Substitua 'FIREBASE_UID_AQUI' pelo UID real do Firebase
UPDATE users 
SET 
  role = 'superadmin',
  municipioId = NULL
WHERE id = 'FIREBASE_UID_AQUI';
```

**Se o usuário ainda não existir no banco**, insira manualmente:

```sql
-- Substitua 'FIREBASE_UID_AQUI' pelo UID real do Firebase
INSERT INTO users (
  id,
  email,
  name,
  role,
  municipioId,
  isActive,
  isEmailVerified,
  loginMethod,
  createdAt,
  updatedAt,
  lastSignedIn
) VALUES (
  'FIREBASE_UID_AQUI',
  'admin@votopopular.com.br',
  'Super Administrador',
  'superadmin',
  NULL,
  1,
  1,
  'firebase',
  NOW(),
  NOW(),
  NOW()
);
```

---

## 🏢 PASSO 3: Criar o Primeiro Município (Cliente)

### 3.1. Via Interface do Super Admin (Recomendado)

1. Faça login na plataforma com a conta do Super Admin
2. Acesse `/superadmin` no navegador
3. Clique em **"Novo Município"**
4. Preencha os dados:
   - **ID**: `muriae-mg` (slug único)
   - **Nome**: `Prefeitura de Muriaé`
   - **Logo URL**: (opcional)
   - **Cor Primária**: `#0066cc`
   - **Cor Secundária**: `#f0f0f0`
5. Clique em **"Criar Município"**

### 3.2. Via SQL (Alternativa)

```sql
INSERT INTO municipios (
  id,
  nome,
  logoUrl,
  corPrimaria,
  corSecundaria,
  createdAt,
  updatedAt
) VALUES (
  'muriae-mg',
  'Prefeitura de Muriaé',
  'https://exemplo.com/logo.png',
  '#0066cc',
  '#f0f0f0',
  NOW(),
  NOW()
);
```

---

## 🔐 PASSO 4: Configurar Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém todas as variáveis necessárias:

```env
# Firebase Authentication
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# TiDB Cloud Database
TIDB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_USER=seu_usuario
TIDB_PASSWORD=sua_senha
TIDB_DATABASE=voto_popular
TIDB_CA_CERT_BASE64=LS0tLS1CRUdJTi...

# Email (Brevo/SMTP)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
EMAIL_USER=seu_email@brevo.com
EMAIL_PASSWORD=sua_senha_brevo
SUPER_ADMIN_EMAIL=admin@votopopular.com.br

# Manus AI (Chatbot)
MANUS_AI_API_KEY=sua_api_key_manus
MANUS_AI_ENDPOINT=https://api.manus.im/v1/chat/completions

# Outras configurações
NODE_ENV=production
PORT=3000
```

---

## 🚀 PASSO 5: Build e Deploy

### 5.1. Instalar Dependências

```bash
pnpm install
```

### 5.2. Build para Produção

```bash
pnpm build
```

### 5.3. Iniciar Servidor

```bash
pnpm start
```

**Ou use PM2 para gerenciamento de processos:**

```bash
pm2 start npm --name "voto-popular" -- start
pm2 save
pm2 startup
```

---

## 🎯 PASSO 6: Verificação Pós-Deploy

### 6.1. Checklist de Verificação

- [ ] Banco de dados migrado com sucesso (`pnpm db:push`)
- [ ] Super Admin criado no Firebase
- [ ] Super Admin promovido no banco de dados
- [ ] Primeiro município criado
- [ ] Variáveis de ambiente configuradas
- [ ] Build executado sem erros
- [ ] Servidor iniciado e acessível

### 6.2. Testes Funcionais

**Teste 1: Login do Super Admin**
1. Acesse `/superadmin/login`
2. Faça login com as credenciais do Super Admin
3. Verifique se o painel carrega corretamente

**Teste 2: Criar Município**
1. No painel do Super Admin, clique em "Novo Município"
2. Preencha os dados e crie
3. Verifique se o município aparece na lista

**Teste 3: Chatbot EduCracia**
1. Faça login como cidadão
2. Abra o chat
3. Envie uma mensagem de teste
4. Verifique se a resposta é gerada corretamente

**Teste 4: Reclamação Técnica (Sustentação)**
1. No chat, envie: "O sistema não funciona, erro 500"
2. Verifique se:
   - Resposta padrão é retornada
   - Email é enviado para o Super Admin
   - Reclamação é salva no banco

---

## 🏗️ Arquitetura Multi-Tenant

### Estrutura de Dados

```
municipios (clientes pagantes)
├── id: 'muriae-mg'
├── nome: 'Prefeitura de Muriaé'
└── cores: primária, secundária

users (usuários vinculados a municípios)
├── id: Firebase UID
├── role: 'cidadao' | 'vereador' | 'admin_cidade' | 'superadmin'
└── municipioId: 'muriae-mg' (exceto superadmin)

proposals (propostas vinculadas a municípios)
├── proposalId: 'PROP-123'
├── municipalityId: 'muriae-mg'
└── vereadorId: Firebase UID
```

### Regras de Isolamento

| Role          | Acesso                                    | Requer municipioId? |
|---------------|-------------------------------------------|---------------------|
| `cidadao`     | Propostas do seu município                | Sim                 |
| `vereador`    | Criar/ver suas propostas no seu município | Sim                 |
| `admin_cidade`| Gerenciar propostas do seu município      | Sim                 |
| `superadmin`  | Gerenciar todos os municípios             | Não                 |

---

## 💰 Economia de IA

### Fluxo de Classificação

```
Mensagem do Usuário
    ↓
classifyIntent() (gpt-4o-mini, ~10 tokens)
    ↓
┌─────────────────┬──────────────────┬──────────────────┐
│ RECLAMACAO_     │ DUVIDA_CIVICA    │ CONVERSA_GERAL   │
│ TECNICA         │                  │                  │
└─────────────────┴──────────────────┴──────────────────┘
    ↓                     ↓                    ↓
Envia Email         Processa com        Processa com
Retorna Padrão      Agente (normal)     Agente (normal)
(ECONOMIZA)
```

**Economia Estimada:**
- Classificação: ~10 tokens (~$0.000002)
- Resposta completa: ~500 tokens (~$0.0001)
- **Economia por reclamação técnica: 98%**

---

## 📊 Monitoramento

### Logs Importantes

**Classificação de Intenção:**
```
[Chat] Classificando intenção da mensagem...
[Chat] Intenção detectada: RECLAMACAO_TECNICA
```

**Sustentação Acionada:**
```
[Chat] 🚨 RECLAMAÇÃO TÉCNICA DETECTADA - Acionando sustentação
[Chat] ✅ Sustentação acionada com sucesso
```

**Isolamento Multi-Tenant:**
```
[Database] Filtrando propostas por municipalityId: muriae-mg
```

---

## 🆘 Troubleshooting

### Problema: Erro ao executar `pnpm db:push`

**Solução:**
1. Verifique se as variáveis `TIDB_*` estão corretas no `.env`
2. Teste a conexão com o banco:
   ```bash
   pnpm exec drizzle-kit studio
   ```

### Problema: Super Admin não consegue acessar o painel

**Solução:**
1. Verifique se o `role` no banco está como `'superadmin'`
2. Verifique se o Firebase UID está correto
3. Limpe o cache do navegador e faça logout/login

### Problema: Chatbot não responde

**Solução:**
1. Verifique se `MANUS_AI_API_KEY` está configurada
2. Verifique os logs do servidor para erros de API
3. Teste a API manualmente:
   ```bash
   curl -X POST https://api.manus.im/v1/chat/completions \
     -H "Authorization: Bearer $MANUS_AI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"teste"}]}'
   ```

### Problema: Emails não são enviados

**Solução:**
1. Verifique as credenciais do Brevo/SMTP
2. Teste o envio manual:
   ```bash
   pnpm exec tsx server/utils/email.ts
   ```

---

## 📚 Documentação Adicional

- **SETUP_SUPERADMIN.md**: Guia detalhado de configuração
- **IMPLEMENTACAO_FINAL.md**: Documentação técnica das implementações
- **VALIDACAO_IMPLEMENTACOES.md**: Relatório de validação

---

## 🎉 Sistema Pronto!

Após seguir todos os passos acima, o sistema **Voto Popular SaaS** estará pronto para produção com:

✅ **Multi-Tenancy completo** - Cada município isolado  
✅ **RBAC robusto** - Controle de acesso por role  
✅ **Economia de IA** - Classificação inteligente  
✅ **Sustentação automática** - Emails para reclamações técnicas  
✅ **Painel de gestão** - Interface para Super Admin  

---

## 📞 Suporte

Para dúvidas ou problemas:

- **Email**: suporte@votopopular.com.br
- **Documentação**: [Link para docs]
- **Issues**: [Link para GitHub Issues]

---

**Última Atualização**: Novembro 2025  
**Versão**: 2.0 (SaaS Multi-Tenant)  
**Status**: ✅ PRONTO PARA PRODUÇÃO
