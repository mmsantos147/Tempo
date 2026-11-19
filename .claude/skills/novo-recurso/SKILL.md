---
name: novo-recurso
description: Cria um novo recurso de ponta a ponta no Tempo — pacote no back-end (entidade, repositório, service, controller, DTOs), migration, testes e módulo api/ + hook no front. Use quando o usuário pedir uma nova entidade/funcionalidade com endpoints próprios.
argument-hint: "[nome do recurso] [descrição]"
disable-model-invocation: true
---

# Novo recurso: $ARGUMENTS

Siga as convenções do `CLAUDE.md`. Use o pacote `journal` (back) e `api/journal.ts` + `hooks/useJournal.ts` (front) como referência de estilo.

## 0. Contrato primeiro
Antes de codar, proponha ao usuário (em português): tabela(s), endpoints (caminhos **sem** `/api`), request/response e regras de negócio com os status de erro. Espere o OK.

## 1. Banco
Use a skill `nova-migration` para criar a tabela. Sempre com `user_id` (direto ou via FK do pai) e `TIMESTAMPTZ` para instantes.

## 2. Back-end — pacote `br.com.tempo.<recurso>`
- **Entidade** JPA; instantes como `Instant`.
- **Repositório** com consultas escopadas: `findByIdAnd...UserId(id, currentUser.id())`. Recurso de outro usuário = 404. Use `join fetch` para evitar N+1.
- **Service**: regras de negócio. Erros: `ResourceNotFoundException` (404), `BusinessRuleException` (409), `InvalidRequestException` (400). Constraint nova que pode estourar → mensagem em `CONSTRAINT_MESSAGES` do `GlobalExceptionHandler`.
- **Controller** fino, rotas sem `/api`.
- **`dto/`**: `record`s; responses com `static from(Entity)`; validação de formato com Bean Validation no request.
- **Código em inglês e sem comentários.**

## 3. Testes
- Service: estende `support/ServiceTest`, usa `signInAsNewUser()`/`signIn(user)`. Cubra caminho feliz, 404 de recurso de outro usuário e cada 409/400.
- HTTP (quando houver regra de status/serialização relevante): `@AutoConfigureMockMvc` + `@Import(TestcontainersConfig.class)`.
- Acrescente exemplos em `backend/requests.http`.

## 4. Front-end
- `src/api/<recurso>.ts` sobre `request()` de `client.ts` (não reimplemente CSRF/401).
- `src/hooks/use<Recurso>.ts` com estado e ações; erros via `notifyError` (em modal que continua aberto, mostre o erro dentro do formulário).
- Componentes em `components/` com CSS Modules; tela em `pages/` e rota dentro de `RequireAuth`.
- Datas/horas exibidas em `APP_TIME_ZONE` (`utils/time.ts`).

## 5. Fechamento
- Atualize a tabela da API no `README.md` e as decisões no `CLAUDE.md`.
- Rode a skill `verificar` e depois `fim-de-etapa`. **Nunca rode git add/commit/push.**
