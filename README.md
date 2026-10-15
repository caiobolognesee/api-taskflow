# TaskFlow API — Backend

API REST do TaskFlow, uma aplicação de gerenciamento de tarefas desenvolvida com Node.js, TypeScript, Fastify, Prisma e PostgreSQL.

O projeto tem como objetivo praticar desenvolvimento backend, modelagem de dados, construção de APIs REST, validação de entradas e aplicação de boas práticas de arquitetura.

## Tecnologias

- **Node.js** — ambiente de execução JavaScript.
- **TypeScript** — tipagem estática e segurança durante o desenvolvimento.
- **Fastify** — framework para construção da API HTTP.
- **PostgreSQL** — banco de dados relacional.
- **Prisma 7** — ORM e gerenciamento de migrações.
- **Docker Compose** — execução do banco de dados em ambiente local.
- **dotenv** — carregamento de variáveis de ambiente.
- **@fastify/cors** — configuração de compartilhamento de recursos entre origens.

## Funcionalidades

- Listagem de tarefas.
- Criação de tarefas.
- Atualização de título, descrição e status.
- Exclusão de tarefas.
- Persistência de dados no PostgreSQL.
- Validação básica das entradas nos endpoints.
- Endpoint para verificar a disponibilidade da API.
- Endpoint para verificar a conexão com o banco de dados.

## Arquitetura

O backend utiliza Fastify para receber requisições HTTP, Prisma para acessar o banco de dados e PostgreSQL para persistir as informações.

Estrutura atual de referência:

```text
api-taskflow/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── lib/
│   │   └── prisma.ts
│   └── server.ts
├── .env
├── .env.example
├── docker-compose.yml
├── prisma.config.ts
├── package.json
└── tsconfig.json
```

### Responsabilidades

- `src/server.ts`: configuração do servidor, registro de plugins e definição atual dos endpoints.
- `src/lib/prisma.ts`: inicialização e exportação do cliente Prisma.
- `prisma/schema.prisma`: definição dos modelos de dados.
- `prisma/migrations/`: histórico versionado de alterações no banco.
- `prisma.config.ts`: configuração do Prisma CLI.
- `docker-compose.yml`: configuração do PostgreSQL para desenvolvimento local.

A separação de rotas, serviços e schemas em módulos próprios está prevista como evolução arquitetural.

## Modelo de dados

Atualmente, a entidade `Task` possui os seguintes campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `Int` | Identificador único, gerado automaticamente. |
| `title` | `String` | Título da tarefa. |
| `description` | `String` | Descrição da tarefa, com valor padrão vazio. |
| `completed` | `Boolean` | Indica se a tarefa foi concluída. |
| `createdAt` | `DateTime` | Data e hora de criação. |
| `updatedAt` | `DateTime` | Data e hora da última atualização. |

O identificador é gerado automaticamente, `createdAt` recebe a data atual na criação e `updatedAt` é atualizado pelo Prisma nas operações de atualização.

## Requisitos

Antes de iniciar, você precisa ter instalado:

- Node.js em uma versão compatível com as dependências do projeto.
- npm.
- Docker Desktop com Docker Compose.
- Git.

## Instalação

Clone o repositório e acesse o diretório do backend:

```bash
git clone <repository-url>
cd api-taskflow
```

Instale as dependências:

```bash
npm install
```

> Substitua `<repository-url>` pelo endereço real do repositório.

## Configuração de ambiente

Crie um arquivo `.env` na raiz do backend:

```env
DATABASE_URL="postgresql://taskflow:taskflow_dev@localhost:5432/taskflow?schema=public"
```

Essa variável define os dados de conexão com o PostgreSQL.

**Importante:** as credenciais acima são exclusivamente para desenvolvimento local. Não utilize essas credenciais em produção.

Mantenha o arquivo `.env` fora do controle de versão. Se necessário, disponibilize um `.env.example` contendo apenas valores de exemplo.

## Banco de dados

O PostgreSQL é executado por meio do Docker Compose.

Inicie o container:

```bash
docker compose up -d
```

A configuração local utiliza:

| Configuração | Valor |
|---|---|
| Container | `taskflow_db` |
| Banco | `taskflow` |
| Usuário | `taskflow` |
| Porta | `5432` |
| Volume | `taskflow_data` |

Os valores devem permanecer consistentes entre `docker-compose.yml` e `DATABASE_URL`.

### Migrações

Para aplicar as migrações pendentes no ambiente de desenvolvimento:

```bash
npx prisma migrate dev
```

Após alterações no schema, gere o Prisma Client:

```bash
npx prisma generate
```

Para validar o schema:

```bash
npx prisma validate
```

As alterações de estrutura do banco devem ser versionadas por migrações. Evite modificar o banco manualmente como substituto desse processo.

## Executando a API

Inicie o servidor em modo de desenvolvimento:

```bash
npm run dev
```

Por padrão, a API fica disponível em:

http://localhost:3333

O servidor utiliza logging do Fastify para auxiliar no diagnóstico de requisições e falhas.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com reinicialização automática. |
| `npm run typecheck` | Executa a verificação de tipos do TypeScript sem gerar arquivos. |

Os comandos de build, testes e lint devem ser documentados aqui quando forem adicionados ao `package.json`.

## Endpoints

### Health check

Verifica se o servidor está respondendo.

```http
GET /health
```

Resposta esperada:

```json
{
  "status": "ok",
  "message": "TaskFlow API is running"
}
```

### Database health check

Verifica se a API consegue executar uma consulta no banco de dados.

```http
GET /db-health
```

Resposta esperada:

```json
{
  "status": "ok",
  "message": "Database connection is working"
}
```

### Listar tarefas

```http
GET /tasks
```

Retorna a lista de tarefas, ordenada da mais recente para a mais antiga.

### Criar tarefa

```http
POST /tasks
Content-Type: application/json
```

Corpo da requisição:

```json
{
  "title": "Estudar React",
  "description": "Praticar componentes e hooks"
}
```

Retorna `201 Created` quando a tarefa é criada com sucesso.

O título não pode ser vazio. A descrição é opcional e assume uma string vazia quando não informada.

### Atualizar tarefa

```http
PATCH /tasks/:id
Content-Type: application/json
```

Exemplo de corpo da requisição:

```json
{
  "completed": true
}
```

É possível atualizar os campos `title`, `description` e `completed` individualmente.

A API rejeita identificadores inválidos, títulos vazios e requisições sem campos para atualização. Uma tarefa inexistente retorna `404 Not Found`.

### Excluir tarefa

```http
DELETE /tasks/:id
```

Exclui a tarefa identificada pelo parâmetro `id`.

Retorna `204 No Content` quando a exclusão é concluída com sucesso. Uma tarefa inexistente retorna `404 Not Found`.

## Códigos HTTP

| Código | Significado |
|---|---|
| `200 OK` | Requisição concluída com sucesso. |
| `201 Created` | Recurso criado com sucesso. |
| `204 No Content` | Operação concluída sem corpo de resposta. |
| `400 Bad Request` | Dados ou parâmetros inválidos. |
| `404 Not Found` | Recurso não encontrado. |
| `500 Internal Server Error` | Falha inesperada no servidor. |

O comportamento efetivo depende do endpoint e do tratamento de erros implementado.

## Integração com o frontend

Por padrão, o frontend é executado em `http://localhost:5173` e a API em `http://localhost:3333`.

O CORS está configurado para permitir a comunicação entre essas origens durante o desenvolvimento.

Se a origem do frontend mudar, atualize a configuração correspondente no backend. Em produção, permita apenas as origens necessárias.

## Decisões arquiteturais

As principais decisões técnicas e suas justificativas estão documentadas no ADR do backend:

- [ADR-BE-001 — Arquitetura e decisões técnicas](docs/ADR-BE-001-backend-taskflow.md)

O documento registra as tecnologias escolhidas, os motivos das decisões, suas consequências e os critérios para futuras mudanças.

## Próximas evoluções

As melhorias planejadas incluem:

- Separar rotas, serviços e schemas de validação.
- Padronizar o tratamento de erros.
- Ampliar a validação dos contratos HTTP.
- Adicionar testes automatizados.
- Implementar autenticação e autorização.
- Relacionar tarefas aos usuários autenticados.
- Preparar a aplicação para deploy.

Esses itens representam o planejamento e não necessariamente funcionalidades já implementadas.

## Objetivo do projeto

O TaskFlow é um projeto de aprendizado e evolução técnica, com foco em APIs REST, TypeScript, modelagem relacional, Prisma e boas práticas de arquitetura backend.

A prioridade é manter uma API previsível, segura, testável e preparada para evoluir sem complexidade desnecessária.