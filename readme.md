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
-- no psql ou admin tool
CREATE DATABASE devdb;
CREATE USER devuser WITH PASSWORD 'devpassword';
GRANT ALL PRIVILEGES ON DATABASE devdb TO devuser;
```

3) Variáveis de ambiente mínimas (.env)
Crie um arquivo `.env` na raiz com pelo menos:
```
APP_VERSION=v1
PORT=3333
DB_HOST=localhost
DB_PORT=5432
DB_USER=devuser
DB_PASSWORD=devpassword
DB_DATABASE=devdb
TOKEN_SECRET=algumsegredosecreto
REFRESH_SECRET=outrosegredo
TOKEN_LIFE=1h
REFRESH_LIFE=7d
SALT=10
CON_USER_EMAIL=seu_email_de_integracao
CON_USER_PASSWORD=sua_senha_de_integracao
```

4) Rodar migrations

```bash
npx knex migrate:latest --knexfile knexfile.ts --cwd .
```

5) Rodar seeds (opcional)

```bash
npx knex seed:run --knexfile knexfile.ts --cwd .
```

6) Iniciar servidor

```bash
npm start
# ou em modo dev
npm run dev
```