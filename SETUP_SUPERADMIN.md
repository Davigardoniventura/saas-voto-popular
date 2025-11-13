# Setup do Super Admin - Voto Popular

## Visão Geral

Este documento contém instruções essenciais para configurar o primeiro Super Admin e preparar o banco de dados após modificações no schema.

---

## 1. Criação do Primeiro Super Admin no Firebase

O primeiro Super Admin deve ser criado manualmente no Firebase Authentication e depois promovido no banco de dados.

### Passo 1: Criar Usuário no Firebase Console

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para **Authentication** > **Users**
4. Clique em **Add User**
5. Preencha:
   - **Email**: email do super admin (ex: `admin@votopopular.com.br`)
   - **Password**: senha forte
6. Anote o **UID** gerado pelo Firebase

### Passo 2: Inserir Super Admin no Banco de Dados

Execute o seguinte SQL no TiDB Cloud Console ou via cliente MySQL:

```sql
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
  'FIREBASE_UID_AQUI',           -- Substitua pelo UID do Firebase
  'admin@votopopular.com.br',    -- Email do super admin
  'Super Administrador',          -- Nome do super admin
  'superadmin',                   -- Role
  NULL,                           -- Super admin não tem município específico
  1,                              -- Ativo
  1,                              -- Email verificado
  'firebase',                     -- Método de login
  NOW(),                          -- Data de criação
  NOW(),                          -- Data de atualização
  NOW()                           -- Último login
);
```

**Importante**: Substitua `FIREBASE_UID_AQUI` pelo UID real obtido no Passo 1.

---

## 2. Migração do Banco de Dados

Sempre que o arquivo `drizzle/schema.ts` for modificado, é necessário executar o comando de migração para aplicar as mudanças no banco de dados.

### Comando de Migração

```bash
# Executar na raiz do projeto
pnpm db:push
```

### O que este comando faz:

- Compara o schema atual com o banco de dados
- Aplica automaticamente as mudanças necessárias
- Cria novas tabelas, colunas ou índices
- **Atenção**: Este comando pode modificar dados existentes. Sempre faça backup antes!

### Verificação

Após executar `pnpm db:push`, verifique no console se:

1. ✅ Todas as tabelas foram criadas/atualizadas
2. ✅ Não há erros de conexão
3. ✅ As colunas `role` e `municipioId` existem na tabela `users`

---

## 3. Estrutura Multi-Tenancy

### Tabelas Principais

- **municipios**: Armazena informações dos municípios (clientes pagantes)
- **users**: Usuários com `municipioId` vinculado (exceto superadmin)
- **proposals**: Propostas vinculadas a `municipalityId`
- **votes**: Votos vinculados a `municipalityId`

### Roles (RBAC)

| Role          | Descrição                                    | Requer municipioId? |
|---------------|----------------------------------------------|---------------------|
| `cidadao`     | Cidadão comum que pode votar                 | Sim                 |
| `vereador`    | Vereador que cria propostas                  | Sim                 |
| `admin_cidade`| Admin municipal que gerencia seu município   | Sim                 |
| `superadmin`  | Admin global que gerencia toda a plataforma  | Não                 |

---

## 4. Criação de Municípios

O Super Admin deve criar municípios através da interface ou via API:

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
  'muriae',                       -- ID único (slug)
  'Prefeitura de Muriaé',         -- Nome do município
  'https://exemplo.com/logo.png', -- URL do logo
  '#0066cc',                      -- Cor primária
  '#f0f0f0',                      -- Cor secundária
  NOW(),
  NOW()
);
```

---

## 5. Promoção de Usuários

Para promover um usuário a Admin de Cidade ou Vereador:

```sql
UPDATE users 
SET 
  role = 'admin_cidade',    -- ou 'vereador'
  municipioId = 'muriae'    -- ID do município
WHERE id = 'FIREBASE_UID_DO_USUARIO';
```

---

## 6. Verificação de Segurança

### Checklist de Segurança Multi-Tenancy

- [ ] Vereadores SÓ podem criar propostas no seu município
- [ ] Admins SÓ veem dados do seu município
- [ ] Propostas são filtradas por `municipalityId`
- [ ] Relatórios são isolados por município
- [ ] Vereadores/Admins DEVEM ter `municipioId` válido

### Teste de Isolamento

1. Crie 2 municípios: `muriae` e `nova-cidade`
2. Crie 2 admins, cada um vinculado a um município diferente
3. Faça login com cada admin
4. Verifique se cada um vê APENAS os dados do seu município

---

## 7. Economia de Créditos de IA

### Fluxo de Classificação

O sistema usa **classificação de baixo custo** antes de processar mensagens:

1. **Classificação** (gpt-4o-mini, ~10 tokens): Identifica se é reclamação técnica
2. **Condicional**:
   - Se for reclamação técnica → Envia email e retorna resposta padrão (economiza créditos)
   - Caso contrário → Processa normalmente com o Agente

### Monitoramento

- Logs de classificação: `[Chat] Intenção detectada: ...`
- Alertas técnicos: `[Chat] 🚨 RECLAMAÇÃO TÉCNICA DETECTADA`

---

## 8. Comandos Úteis

```bash
# Instalar dependências
pnpm install

# Aplicar migrações do banco
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Verificar tipos TypeScript
pnpm type-check
```

---

## 9. Variáveis de Ambiente Obrigatórias

Certifique-se de que o arquivo `.env` contém:

```env
# Firebase
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# TiDB Cloud
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
EMAIL_PASSWORD=sua_senha
SUPER_ADMIN_EMAIL=admin@votopopular.com.br

# Manus AI
MANUS_AI_API_KEY=sua_api_key
MANUS_AI_ENDPOINT=https://api.manus.im/v1/chat/completions
```

---

## 10. Suporte

Para dúvidas ou problemas:

- **Email**: suporte@votopopular.com.br
- **Documentação**: [Link para docs]
- **Issues**: [Link para GitHub Issues]

---

**Última Atualização**: Novembro 2025  
**Versão**: 2.0 (Multi-Tenancy + RBAC + Economia de IA)
