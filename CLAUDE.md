# Tempo

Kanban pessoal com apontamento de horas. Back-end Spring Boot 3.5 / Java 21 / PostgreSQL 17 / Flyway / Spring Security em `backend/`; front React 19 + TypeScript + Vite + React Router em `frontend/`; produção em `deploy/` (Docker Compose + nginx + certbot). Visão geral, comandos e tabela da API estão no `README.md`.

## Regras de trabalho

- **Commits são do usuário.** Nunca rodar `git add`/`commit`/`push`; ao fim de cada etapa, resumir o que mudou e sugerir a mensagem.
- **Acordo de aprendizado encerrado (2026-11-19).** O usuário pediu que o Claude implementasse tudo o que faltava; o Claude agora escreve Java e SQL normalmente. Se ele voltar a pedir uma parte "para aprender", criar só a estrutura e guiar com perguntas.
- **Código em inglês e sem comentários** (Java, rotas, banco, mensagens, front). Única exceção: comentários `// TODO` em stubs deixados para o usuário, se ele pedir.
- Migrations: V1 tabelas, V1_1 seed, V2 índice único parcial de timer aberto (`time_entry (user_id) WHERE ended_at IS NULL`), V3 tabelas do diário.
- Conversa com o usuário em português.

## Convenções

**Back-end**
- Um pacote por recurso (`board`, `column`, `card`, `timeentry`, `journal`, `auth`, `user`), cada um com entidade, repositório, service, controller e `dto/`.
- DTOs são `record`s; responses têm `static from(Entity)`. Validação de formato no DTO (Bean Validation), regras de negócio no service.
- Todo acesso passa pelo usuário atual: `findByIdAnd...UserId(id, currentUser.id())` e 404 quando o recurso não é dele.
- Erros como ProblemDetail (`GlobalExceptionHandler`): `ResourceNotFoundException` → 404, `BusinessRuleException` → 409, `InvalidRequestException` → 400 (parâmetro inválido que o Bean Validation não cobre, ex. fuso desconhecido), validação → 400 com `errors`, `AuthenticationException` → 401, `AccessDeniedException` → 403, `TooManyLoginAttemptsException` → 429 + `Retry-After`, `DataIntegrityViolationException` → 409 (mensagem específica por nome de constraint em `CONSTRAINT_MESSAGES`). Na cadeia de filtros, 401/403 também saem como ProblemDetail (`ProblemResponses`).
- Testes de service estendem `support/ServiceTest` (`@SpringBootTest` + `@Transactional` + Testcontainers compartilhado) e chamam `signInAsNewUser()`/`signIn(user)`; testes HTTP usam `@AutoConfigureMockMvc` + `@Import(TestcontainersConfig.class)`.
- O back-end não conhece o prefixo `/api`: nginx (produção) e Vite (dev) o removem. Rotas, `requests.http` e testes usam caminhos sem `/api`.
- Hibernate grava em UTC (`jdbc.time_zone: UTC`); colunas `TIMESTAMPTZ` mapeadas para `Instant`.

**Front-end**
- `api/` (um módulo por recurso, sobre `request()` em `client.ts`, que chama `/api` na mesma origem, envia `X-XSRF-TOKEN` lido do cookie a cada requisição não-GET, repete uma vez após 403 renovando o token e, em 401 fora de `/auth/*`, aciona o redirect para `/login?next=`), `hooks/` (estado e ações), `components/` (com CSS Modules), `pages/` (telas por rota), `utils/` (funções puras).
- Rotas: `/login` pública; `/` (aceita `?board=&card=` para abrir um card), `/day` e `/journal` (redirecionam para hoje), `/day/:date` e `/journal/:date` dentro de `RequireAuth`. Estado de sessão em `AuthProvider`/`useAuth`.
- Hooks tratam erro com `notifyError` (toast). Formulários em modal que continuam abertos após erro (ex.: `TimeEntryForm`) mostram o erro do servidor dentro do formulário, porque o toast fica atrás do backdrop do `<dialog>`.
- Datas/horas exibidas sempre no fuso `APP_TIME_ZONE` (`utils/time.ts`), independentemente do fuso do navegador.

## Decisões da v2

### Fase 1: apontamento manual (concluída)
- Endpoints: `POST /cards/{cardId}/time-entries`, `PUT /time-entries/{id}`, `GET /time-entries?date=&timeZone=`.
- Request `ManualTimeEntryRequest`: `date` (`LocalDate`), `startTime`/`endTime` (`LocalTime`, `HH:mm`), `timeZone` (IANA, ex. `America/Sao_Paulo`), `description` opcional. O front sempre envia `timeZone` explicitamente (`api/timeEntries.ts` acrescenta `APP_TIME_ZONE`); a conversão para `Instant` é feita no back-end.
- Um apontamento manual começa e termina no mesmo dia; quem trabalhou depois da meia-noite lança dois.
- O PUT não troca o card do apontamento.
- `TimeEntryResponse` inclui `cardTitle`.
- Regra do dia (vale também para o diário): um apontamento pertence ao dia local em que seu `startedAt` cai, no fuso informado.
- Timer aberto aparece na visão do dia como "Running" e não é editável pelo front.
- Validações no front (fim > início, nada no futuro) são só para a experiência de uso; o servidor é a fonte da verdade.
- Regras no servidor: fim > início e fim ≤ agora (409); fuso desconhecido 400; sem sobreposição com outros apontamentos do usuário, intervalos semiabertos `[início, fim)` (09–10 e 10–11 não se sobrepõem) e timer aberto conta até agora (409); timer aberto não é editável pelo PUT (409). `listByDate` usa `[início do dia local, início do dia seguinte)` com `join fetch` do card. Corrida de dois `start` cai no índice da V2 e vira 409 com mensagem própria.

### Fase 2: segurança (concluída)
- **nginx no lugar do Caddy** (pedido do usuário). Como o nginx não emite certificados, o container `certbot` (webroot) emite e renova; o nginx começa com certificado autoassinado temporário (`deploy/nginx/tempo-tls.sh`) e um loop (`40-tempo-tls.sh`) checa a cada minuto até o real chegar e depois recarrega a cada 6 h. `CERTBOT_STAGING=1` para testes.
- Mesma origem em tudo: nginx serve o `dist` e faz proxy de `/api/*` → `backend:8080` removendo o prefixo; Vite faz o mesmo em dev. `CorsConfig`, `CORS_ORIGINS` e `VITE_API_URL` foram removidos.
- nginx resolve `backend` via resolver do Docker (`127.0.0.11`) para não guardar IP antigo após recriar o container; sobrescreve `X-Forwarded-For` com `$remote_addr` (é a borda); `server.forward-headers-strategy: native` no Spring.
- Headers: HSTS, CSP restrita (`default-src 'self'`), `X-Frame-Options DENY`, `nosniff`, `Referrer-Policy same-origin`; host desconhecido recebe 444 e handshake TLS rejeitado.
- Redes: `internal` (`internal: true`) com `db` e `backend`; `web` com `backend`, `nginx`, `certbot`. Só o nginx publica portas. O back-end tem saída para a internet por estar na `web` (portas publicadas exigem rede não interna); o banco não.
- Projeto Compose de produção se chama `tempo-prod` para não colidir com o compose de dev (projeto `tempo`, volume `tempo_pgdata`).
- Dockerfiles sem recursos exclusivos do BuildKit (`--mount`, `COPY --chmod`), porque a máquina de dev não tem `buildx`.
- Implementação: `SecurityConfig` com rotas públicas `GET /auth/csrf`, `POST /auth/login`, `POST /auth/logout` e `/error`; form login, HTTP Basic, logout padrão, request cache e anonymous desligados. CSRF com `CookieCsrfTokenRepository` não-HttpOnly (Secure, SameSite Strict, path `/`) e `SpaCsrfTokenRequestHandler` (aceita o valor cru do cookie no header e carrega o token em toda requisição, então o cookie sempre existe); login também exige CSRF. `AuthService.login` checa limite, autentica pelo `AuthenticationManager` (`DaoAuthenticationProvider` + BCrypt 12), troca o id da sessão, salva o contexto pelo `HttpSessionSecurityContextRepository` e gira o token CSRF. Senha com mais de 72 bytes → 401. Principal `AppUserPrincipal` guarda o id (sem consultar o banco a cada requisição); `CurrentUser.id()` lê dele e lança `AuthenticationCredentialsNotFoundException` sem usuário. Cookie de sessão HttpOnly, Secure, SameSite Strict, timeout 12 h.
- `LoginAttemptService` (memória, zera no restart): 5 falhas por e-mail+IP ou 20 por IP em 15 min bloqueiam 15 min; sucesso zera só o contador e-mail+IP; entradas expiradas são limpas a cada falha.
- Autenticação por sessão (em memória: redeploy desloga). Contrato: `GET /auth/csrf` (204), `POST /auth/login` (200 `{id,name,email}`, 401, 429 + `Retry-After`), `POST /auth/logout` (204), `GET /auth/me` (200 ou 401).
- Usuário inicial: `InitialUserRunner` cria, se o e-mail não existir, a partir de `TEMPO_USER_EMAIL`/`NAME`/`PASSWORD_HASH` (hash BCrypt, nunca a senha; e-mail salvo em minúsculas). Falha o startup se o hash não for BCrypt.
- Segredos: nenhum segredo real no histórico; só a senha de dev `tempo`. `.env` ignorado em qualquer pasta; `deploy/.env.example` documenta as variáveis.
- Teste de fumaça feito localmente com `TEMPO_DOMAIN=localhost`: redirect HTTP→HTTPS, SPA, headers, proxy `/api`, banco inacessível do nginx e do host, criação idempotente do usuário, troca para o certificado "real" com reload automático.

### Fase 3: diário (concluída)
- Tabelas (migrations V3 em diante, feitas pelo Claude): `journal_entry(id, user_id FK, entry_date DATE, what_i_did TEXT, how_i_felt TEXT, created_at, updated_at, UNIQUE (user_id, entry_date))` e `journal_item(id, entry_id FK ON DELETE CASCADE, text VARCHAR(200), position INT, card_id FK NULL ON DELETE SET NULL)`. `entry_date` em vez de `date` (palavra reservada); `text` com 200 caracteres porque vira título de card.
- Apontamentos do dia não têm FK com a entrada: o diário reaproveita `GET /time-entries?date=&timeZone=` da Fase 1.
- Contratos: `GET /journal?from=&to=` (lista de datas), `GET /journal/{date}` (404 se não existe; o front trata como vazio), `PUT /journal/{date}` upsert (201 ao criar, 200 ao atualizar, via `JournalEntrySaveResult`), `POST /journal/{date}/items` (cria a entrada vazia se preciso), `PUT /journal-items/{id}`, `POST /journal-items/{id}/move`, `DELETE /journal-items/{id}`, `POST /journal-items/{id}/create-card` `{columnId}` (409 se já tem card). Item: `{id, text, position, card: {id, title, boardId, completedAt} | null}`.
- Front: `JournalView` com calendário próprio (`MonthCalendar`, domingo primeiro, dias futuros desabilitados, marcação dos dias com entrada), `DayEntriesPanel`, `JournalEditor` (textareas sem borda que crescem, 68ch) e `JournalItems` (dnd-kit com handle e teclado, edição inline, `MakeCardDialog`, selo "Card"/"Done" com link para `/?board=&card=`). Modo foco esconde as laterais (preferência em `localStorage`).
- Autosave (`useJournal`): debounce de 800 ms, PUTs em fila (nunca fora de ordem), flush no blur e ao desmontar (a view usa `key={date}`), aviso `beforeunload` com alteração pendente; não cria entrada vazia.
- Diário e visão do dia não aceitam datas futuras no front; o back recusa escrita (save, addItem) com 409 para datas depois do "hoje" mais adiantado do planeta (UTC+18), já que a API do diário não recebe fuso.
- `save`/`addItem` fazem upsert com `INSERT ... ON CONFLICT (user_id, entry_date) DO NOTHING` + select (seguro com autosaves simultâneos; `created` vem do número de linhas inseridas). Texto em branco vira `null`. `updated_at` pelo `@PreUpdate`.
- `get` busca itens com `left join fetch` de card e coluna (sem N+1). `createCard` trava o item (`PESSIMISTIC_WRITE`) para o 409 valer com requisições simultâneas e reaproveita `CardService.create`; `uk_journal_item_card` garante um item por card. Editar o texto do item não muda o card; apagar o item mantém o card; apagar o card desvincula o item (`ON DELETE SET NULL`).

## Pendências

Nenhuma. As Fases 1–3 estão implementadas e cobertas por testes (`./mvnw test`, 42 testes).
