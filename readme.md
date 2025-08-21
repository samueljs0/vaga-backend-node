# Projeto Vaga-Plenior — Guia rápido de execução

Este README mostra apenas o que você precisa fazer para rodar o projeto localmente: criar banco, configurar variáveis, executar migrations/seeds e iniciar o servidor. Também inclui as URLs/headers principais para testar a API.

Precondições
- Node.js (18+ recomendado)
- PostgreSQL rodando localmente
- Acesso ao terminal na pasta do projeto

1) Instalar dependências

```bash
npm install
```

2) Criar banco de dados (Postgres)

Substitua os valores conforme necessário:
```sql
CREATE DATABASE devdb;
CREATE USER devuser WITH PASSWORD 'devpassword';
GRANT ALL PRIVILEGES ON DATABASE devdb TO devuser;
```

3) Crie o arquivo `.env` na raiz do projeto com ao menos as variáveis abaixo (ajuste conforme seu ambiente):

```env
# Application 
APP_VERSION=v1 

# Server 
NODE_ENV=development 
PORT=3333

# Database connection 
DB_HOST=localhost
DB_PORT=5432
DB_USER=devuser
DB_PASSWORD=devpassword
DB_DATABASE=devdb

# JWT
# Security
MIN_SALT=6
MAX_SALT=12
TOKEN_SECRET=12345
TOKEN_LIFE=10h
REFRESH_SECRET=12345
REFRESH_LIFE=1d

# Conect sistem
CON_USER_NAME="your_username"
CON_USER_EMAIL="your_email@example.com"
CON_USER_PASSWORD="your_secure_password"

# test
SKIP_INTEGRATION=0
TEST_BYPASS_AUTH=1 

# url
CON_URL="https://compliance-api.cubos.io/"
```

4) Rode as migrations

```bash
npx ts-node -r tsconfig-paths/register node_modules/knex/bin/cli.js migrate:latest --knexfile knexfile.ts
```

5) Rode os seeds (opcional)

```bash
npx ts-node -r tsconfig-paths/register node_modules/knex/bin/cli.js seed:run --knexfile knexfile.ts
```

6) Inicie a aplicação

```bash
npm start
# Ou modo dev (recomendado durante desenvolvimento)
npm run dev
```

## Executando testes (local)

Unit e integração leve (por padrão as integrações que exigem DB ficam desabilitadas):

```bash
npm test
```

Se quiser forçar integração contra seu banco local, exporte as variáveis e execute com SKIP_INTEGRATION=0:

```bash
SKIP_INTEGRATION=0 APP_VERSION=v1 TEST_BYPASS_AUTH=1 npx vitest --run
```

## Docker (recomendado para rodar tudo facilmente)

Os arquivos `Dockerfile`, `docker-compose.yml` e `docker-entrypoint.sh` já estão adicionados. O comando abaixo sobe um container Postgres e o container da aplicação; a aplicação espera o banco, executa migrations e seeds e em seguida inicia.

1) Build + start (modo normal):

```bash
docker compose up --build
```

2) Para rodar apenas os testes dentro do container (as migrations/seeds serão executadas antes):

```bash
# exemplo: roda tests e sai
docker compose run --rm -e RUN_TESTS=1 app
```

## Principais endpoints (prefixo `/v1` por padrão)
- POST /v1/people -> criar usuário
- POST /v1/login -> autenticação
- POST /v1/accounts -> criar conta (auth)
- GET /v1/accounts -> listar contas (auth)
- POST /v1/accounts/:accountId/cards -> criar cartão (auth)
- GET /v1/cards -> listar todos os cartões (auth)
