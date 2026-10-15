# ADR-BE-001 --- Arquitetura e decisões técnicas do backend TaskFlow

-   **Status:** Aceito para a base atual; itens futuros estão
    identificados como planejados.
-   **Data:** 2026-10-15
-   **Escopo:** API HTTP do TaskFlow.
-   **Stack atual:** Node.js, Fastify, TypeScript, PostgreSQL, Prisma 7
    e Docker Compose.

## 1. Contexto

O backend do TaskFlow fornece uma API para criar, consultar, atualizar e
excluir tarefas. Os dados precisam persistir em PostgreSQL e a API deve
ser simples de executar localmente, fácil de testar e preparada para
crescer sem concentrar todas as responsabilidades em `server.ts`.

A arquitetura deve priorizar contratos HTTP claros, validação na
fronteira da aplicação, separação de responsabilidades, segurança de
configuração e complexidade proporcional ao tamanho do projeto.

## 2. Decisões

### 2.1. Node.js com TypeScript

**Decisão:** implementar a API com Node.js e TypeScript em modo estrito.

**Motivação:** - Compartilhar a linguagem com o frontend. - Detectar
erros de tipo durante o desenvolvimento. - Explicitar os contratos de
parâmetros, corpos e respostas.

**Consequências:** - Manter o typecheck como parte da validação do
projeto. - Evitar `any` sem justificativa. - Tipos TypeScript não
validam automaticamente dados recebidos em tempo de execução; a API
precisa de validação real na fronteira HTTP.

### 2.2. Fastify para HTTP

**Decisão:** utilizar Fastify como framework HTTP.

**Motivação:** - Oferecer roteamento, hooks, plugins e logging
estruturado. - Permitir validação e serialização baseadas em schemas. -
Manter a inicialização da API enxuta.

**Consequências:** - Registrar plugins explicitamente. - Centralizar
configuração do servidor e tratamento de erros. - Manter rotas HTTP
separadas das regras de negócio conforme o projeto cresce.

### 2.3. PostgreSQL como banco de dados

**Decisão:** utilizar PostgreSQL para persistência relacional.

**Motivação:** - Oferecer integridade relacional e transações. - Ser
adequado a dados estruturados e a futuras relações entre usuários e
tarefas. - Disponibilizar um ambiente local reproduzível por Docker.

**Consequências:** - Evoluir o esquema por migrações versionadas. - Não
editar o banco manualmente como substituto de migrações. - Avaliar
índices, transações e constraints de acordo com os requisitos reais, sem
otimização prematura.

### 2.4. Prisma 7 para acesso a dados e migrações

**Decisão:** utilizar Prisma 7 como ORM, com schema e migrações
versionados e o adaptador PostgreSQL configurado para o runtime.

**Motivação:** - Fornecer acesso tipado ao banco. - Tornar o modelo de
dados explícito. - Registrar mudanças de estrutura por migrações
reproduzíveis.

**Consequências:** - Alterações persistentes no modelo devem ser
refletidas em `prisma/schema.prisma` e aplicadas por migração. - Gerar o
Prisma Client após as alterações necessárias no schema. - Manter a
configuração específica do Prisma 7 alinhada à versão instalada e à
documentação oficial. - Não espalhar chamadas ao Prisma por todas as
camadas quando isso dificultar testes ou mudanças de persistência.

### 2.5. Docker Compose para desenvolvimento local

**Decisão:** executar PostgreSQL em container por meio do Docker
Compose.

**Motivação:** - Reduzir diferenças entre ambientes de
desenvolvimento. - Evitar depender de uma instalação local específica do
PostgreSQL. - Facilitar inicialização e persistência de dados por
volume.

**Consequências:** - Manter a configuração do container versionada. -
Preservar os dados no volume nomeado durante reinicializações. - Não
usar credenciais de desenvolvimento como credenciais de produção. -
Documentar os comandos necessários para iniciar e parar o ambiente.

### 2.6. Organização modular por funcionalidade

**Decisão:** evoluir a API para módulos organizados por domínio
funcional.

Estrutura de referência:

``` text
src/
├── modules/
│   └── tasks/
│       ├── tasks.routes.ts
│       ├── tasks.service.ts
│       └── tasks.schemas.ts
├── lib/
│   └── prisma.ts
└── server.ts
```

**Responsabilidades:** - `server.ts`: criar a aplicação, registrar
plugins e módulos e iniciar o servidor. - `tasks.routes.ts`: mapear
endpoints HTTP, parâmetros, status e respostas. - `tasks.service.ts`:
implementar regras de negócio e coordenar operações de dados. -
`tasks.schemas.ts`: declarar e reutilizar schemas de validação dos
contratos. - `lib/prisma.ts`: inicializar e exportar o cliente de banco.

**Motivação:** - Evitar que `server.ts` concentre rotas, validação,
regras e persistência. - Facilitar testes e manutenção. - Agrupar código
que muda pelo mesmo motivo.

**Consequências:** - A separação será feita gradualmente, preservando o
comportamento existente. - Não é necessário criar repositórios genéricos
ou uma arquitetura de muitas camadas antes de haver necessidade. - Se
regras de negócio crescerem, o serviço será o local preferencial para
coordená-las, sem acoplar essa lógica ao formato da requisição HTTP.

### 2.7. Validação dos dados recebidos

**Decisão planejada:** declarar schemas de validação para parâmetros,
corpo e, quando apropriado, respostas da API, utilizando os mecanismos
compatíveis com a versão instalada do Fastify.

**Motivação:** - Dados externos devem ser considerados não confiáveis. -
Tipos estáticos não impedem corpos inválidos em tempo de execução. -
Schemas permitem validar e documentar os contratos de forma consistente.

**Consequências:** - Validar IDs, tipos, campos obrigatórios, limites e
formatos. - Rejeitar títulos vazios e corpos de atualização sem campos
permitidos. - Definir o comportamento de campos desconhecidos de maneira
consistente. - Não confiar apenas em verificações manuais dispersas nas
rotas. - Confirmar compatibilidade entre schemas e plugins conforme a
versão do Fastify usada; não presumir que qualquer biblioteca de
validação é automaticamente compatível.

### 2.8. Contratos HTTP e semântica de status

**Decisão:** utilizar métodos e códigos HTTP de acordo com a operação
realizada.

Contrato atual de referência: - `GET /tasks`: listar tarefas. -
`POST /tasks`: criar tarefa e responder `201 Created`. -
`PATCH /tasks/:id`: atualizar campos permitidos. - `DELETE /tasks/:id`:
excluir tarefa e responder `204 No Content`. - Endpoints de diagnóstico,
como `/health` e `/db-health`, para verificar servidor e conexão com o
banco.

**Motivação:** - Tornar a API previsível para o frontend e outros
clientes. - Distinguir sucesso, entrada inválida e recurso inexistente.

**Consequências:** - Usar `400` para entrada inválida e `404` para
tarefa inexistente, conforme o contrato definido. - Não enviar corpo
JSON numa resposta `204`. - Manter formato de erro consistente e evitar
expor detalhes internos. - Documentar mudanças incompatíveis no
contrato.

### 2.9. Tratamento de erros e logging

**Decisão planejada:** padronizar erros da aplicação e manter logging
estruturado pelo Fastify.

**Motivação:** - Facilitar diagnóstico sem vazar informações internas. -
Evitar que cada rota trate erros de forma diferente. - Distinguir erros
esperados de falhas inesperadas.

**Consequências:** - Criar tratamento centralizado quando a complexidade
justificar. - Responder com mensagens adequadas ao cliente e registrar
detalhes técnicos no servidor. - Não retornar stack traces, senhas,
strings de conexão ou dados sensíveis. - Evitar capturar erros apenas
para descartá-los silenciosamente.

### 2.10. Configuração e segredos por ambiente

**Decisão:** manter configuração fora do código e usar variáveis de
ambiente para valores dependentes do ambiente.

**Motivação:** - Evitar credenciais embutidas no código-fonte. - Separar
configurações locais, testes e produção.

**Consequências:** - Usar `DATABASE_URL` para a conexão com
PostgreSQL. - Carregar variáveis de ambiente de forma explícita no
runtime. - Validar variáveis obrigatórias na inicialização,
preferencialmente com mensagens claras. - Manter `.env` fora do controle
de versão e disponibilizar um `.env.example` sem segredos reais. - Nunca
reutilizar senhas de desenvolvimento em produção.

### 2.11. CORS explícito

**Decisão:** configurar `@fastify/cors` com a origem frontend permitida
e os métodos necessários.

**Motivação:** - O frontend de desenvolvimento executa em uma origem
diferente da API. - O navegador pode enviar requisições de preflight
para métodos como `PATCH` e `DELETE`.

**Consequências:** - Manter a origem de desenvolvimento explícita e
configurável por ambiente conforme necessário. - Permitir apenas métodos
e cabeçalhos necessários. - Não tratar CORS como mecanismo de
autenticação ou autorização. - Revisar a configuração antes do deploy
para não liberar origens desnecessárias.

### 2.12. Testes automatizados

**Decisão planejada:** adicionar testes para regras de negócio e
endpoints HTTP.

**Motivação:** - Verificar os contratos da API. - Proteger migrações
arquiteturais contra regressões. - Cobrir tanto os casos válidos quanto
os erros esperados.

**Consequências:** - Testar criação, listagem, atualização, exclusão,
IDs inválidos e recursos inexistentes. - Isolar ou preparar o banco de
testes de forma segura. - Não executar testes destrutivos contra dados
de desenvolvimento ou produção. - Escolher o runner após avaliar o
ambiente atual; Vitest ou o runner nativo do Node.js são opções
possíveis.

## 3. Convenções de código

-   Usar nomes explícitos para rotas, schemas, funções e tipos.
-   Manter handlers HTTP focados em traduzir requisições e respostas.
-   Concentrar regras de negócio em serviços quando houver lógica que
    mereça separação.
-   Usar Prisma para operações de persistência, evitando duplicar a
    mesma consulta em vários locais.
-   Não retornar entidades ou erros internos indiscriminadamente.
-   Manter migrações versionadas e revisar alterações de schema.
-   Executar o typecheck e os testes antes de considerar uma mudança
    concluída.
-   Adicionar abstrações quando reduzirem acoplamento ou duplicação
    real, e não apenas por convenção.

## 4. Consequências gerais

**Benefícios esperados:** - API mais fácil de manter e testar. -
Contratos HTTP explícitos. - Persistência reproduzível e versionada. -
Separação clara entre transporte, regras de negócio e banco de dados.

**Custos e limitações:** - Schemas, serviços e testes exigem arquivos e
manutenção adicionais. - O Prisma gera artefatos que precisam permanecer
alinhados ao schema. - Configuração de ambientes e testes de banco
requer cuidado adicional. - A arquitetura deve continuar proporcional à
dimensão do TaskFlow.

## 5. Critérios para revisar este ADR

Revisar estas decisões quando: - surgirem novos módulos ou relações de
domínio; - a API precisar de autenticação, autorização ou isolamento por
usuário; - as regras de negócio exigirem transações ou fluxos mais
complexos; - forem necessários limites de taxa, observabilidade ou
tarefas assíncronas; - testes evidenciarem acoplamento difícil de
manter; - a versão de Fastify ou Prisma for atualizada de forma
relevante.

## 6. Referências oficiais

Consultar a documentação vigente ao implementar ou revisar estas
decisões: - Node.js: https://nodejs.org/docs/latest/api/ - TypeScript:
https://www.typescriptlang.org/docs/ - Fastify:
https://fastify.dev/docs/latest/ - Prisma: https://www.prisma.io/docs -
PostgreSQL: https://www.postgresql.org/docs/ - Docker Compose:
https://docs.docker.com/compose/ - `@fastify/cors`:
https://github.com/fastify/fastify-cors

## 7. Registro de implementação

Este documento registra a direção arquitetural. Ele não significa que
todos os itens planejados já estejam implementados. Atualizar o status
dos itens conforme forem concluídos e revisar o ADR quando uma decisão
mudar.
