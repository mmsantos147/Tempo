---
name: deploy
description: Contexto e procedimentos de hospedagem do Tempo (Docker Compose em deploy/ com nginx, PostgreSQL 17, VPS com Coolify + Traefik). Use ao mexer em deploy/, Dockerfiles, nginx (headers, CSP, proxy, TLS), variáveis de ambiente, application.yml, backups, ou ao preparar/diagnosticar um deploy.
argument-hint: "[o que configurar ou diagnosticar]"
---

# Hospedagem do Tempo

Tarefa: $ARGUMENTS

Documentação para o usuário: seção **Deployment** do `README.md` e "Fase 2: segurança" do `CLAUDE.md` — mantenha os dois atualizados. Se a skill pessoal `vps` estiver disponível, carregue-a também: ela tem o estado real do servidor e as regras de acesso.

## Estado atual (nov/2026)
- A VPS roda **Coolify 4.7 com Traefik**, que ocupa 80/443 e emite os certificados. No Coolify existe o projeto "Tempo", ainda **sem recurso** (não implantado).
- Domínio previsto: `https://tempo.matheusms.io` — já resolve para a VPS (DNS curinga). O acesso ao GitHub é pelo GitHub App do Coolify; não há clone no servidor.
- **Produção = `deploy/docker-compose.coolify.yml`** (Fase 4 do `CLAUDE.md`). O `deploy/docker-compose.yml` com nginx + certbot publicando 80/443 **não sobe nessa VPS** ("port is already allocated"); fica só para servidor sem proxy.

## Modo Coolify (produção)
| Serviço | Papel | Redes | Limite |
|---|---|---|---|
| `db` | `postgres:17`, volume `pgdata`, healthcheck `pg_isready` | `internal` | 512m |
| `backend` | build de `../backend`, healthcheck `GET /auth/csrf` | `internal` + `web` | 1g |
| `nginx` | `deploy/nginx/Dockerfile.coolify` + `tempo-coolify.conf`: só HTTP na 80, `expose` (sem `ports`), healthcheck `/nginx-health` | `web` | 128m |

- Traefik faz o TLS e roteia para `nginx:80` (domínio configurado no serviço `nginx` no Coolify).
- **IP real:** `real_ip_header X-Forwarded-For` + `real_ip_recursive on` + `set_real_ip_from` só nas faixas privadas. Nunca troque para confiar em qualquer origem (permitiria falsificar o IP e burlar o `LoginAttemptService`), nem remova (todos os visitantes teriam o IP do Traefik e se bloqueariam juntos).
- `X-Forwarded-Proto https` é **fixo** de propósito: sem ele o Tomcat trata a requisição como HTTP e os cookies `Secure` quebram.
- Headers de segurança e CSP ficam iguais nos dois `.conf` — mudou um, mude o outro.
- Validado na VPS (2026-11-19): `docker compose config` ok, variáveis obrigatórias falham com `set X`, e os contextos de build só ficam certos com Base Directory `/deploy` (o Coolify 4.7 roda `--project-directory <clone>/<base>`). `nginx -t` e teste com containers também passaram: IP real (inclusive com `X-Forwarded-For` forjado), rewrite de `/api` com query string, `proto=https`/`port=443`, fallback do SPA, 404 em `/assets/` inexistente, os 6 headers em todas as rotas, `/nginx-health` e `wget` nas imagens do nginx e do backend.
- Pendente de conferir após o 1º deploy: se o Traefik alcança o `nginx` (senão, ativar *Connect to Predefined Network* no recurso), se o Coolify manteve o `db` isolado (ele acrescenta a rede do recurso aos serviços) e se o bloqueio de login isola visitantes diferentes.

**Primeiro deploy (passo a passo para o usuário):** Coolify → projeto "Tempo" → *New Resource* → repositório pelo GitHub App, branch `main`, build pack **Docker Compose**, **Base Directory `/deploy`** e **Docker Compose Location `/docker-compose.coolify.yml`** (os caminhos `../backend` e `..` do compose são relativos a `deploy/`; com a raiz como base o build quebra) → *Domains* do serviço `nginx`: `https://tempo.matheusms.io`, porta 80 → *Environment Variables* (`POSTGRES_*`, `TEMPO_USER_*`) → *Deploy* → configurar **Scheduled Backup** do `db` (a VPS não tem nenhum backup hoje).

## Modo sem proxy (`deploy/docker-compose.yml`, projeto `tempo-prod`)
| Serviço | Papel | Redes | Portas |
|---|---|---|---|
| `db` | `postgres:17`, volume `pgdata` | `internal` | — |
| `backend` | build de `../backend`, Spring na 8080 | `internal` + `web` | — |
| `nginx` | `deploy/nginx/Dockerfile` (build do front com `node:22-alpine` + `nginx:stable-alpine`), serve o `dist`, proxy `/api/*` → `backend:8080` removendo o prefixo | `web` | 80, 443 |
| `certbot` | webroot, `deploy/certbot/run.sh` | `web` | — |

- `internal: true`: o banco não tem rota para fora.
- `tempo.conf.template` (envsubst com `TEMPO_DOMAIN`): HSTS, CSP `default-src 'self'`, `X-Frame-Options DENY`, `nosniff`, `Referrer-Policy same-origin`, `Permissions-Policy`; `/assets/` com cache de 1 ano; `/` sem cache com fallback para `index.html`.
- Spring: `server.forward-headers-strategy: native`, sessão **em memória** (redeploy desloga), cookies Secure/SameSite Strict.
- Dev: `docker-compose.yml` da raiz (projeto `tempo`) só sobe o banco; o Vite faz o mesmo proxy que o nginx.

## Restrições
- O back-end **não conhece `/api`**: não adicione esse prefixo em rotas do Spring.
- Senha do usuário só como **hash BCrypt** (`TEMPO_USER_PASSWORD_HASH`, custo 12, ≤ 72 bytes); o startup falha se o hash for inválido.
- Nenhum segredo real no repositório; só `deploy/.env.example` é versionado.
- Dockerfiles sem recursos exclusivos do BuildKit (a máquina de dev não tinha `buildx`; a VPS tem, mas mantenha compatível).
- VPS com 7,8 GiB sem swap, dividida com outros apps: mantenha `-XX:MaxRAMPercentage=75` e considere limite de memória no compose.
- **Commits são do usuário.**

## O que o Claude pode e não pode fazer
- **Pode:** editar `deploy/`, Dockerfiles, `application.yml`, README; inspecionar a VPS **em modo leitura** por uma sessão na conexão SSH "Vps" (ver skill `vps`).
- **Não pode sem OK explícito:** qualquer comando que altere a VPS. **Não tem acesso** ao painel do Coolify — entregue passo a passo para o usuário.
- O Windows local não tem Docker: teste de fumaça das imagens roda na VPS (com OK) ou no CI.

## Variáveis de ambiente
Atuais (`deploy/.env.example`): `TEMPO_DOMAIN`, `ACME_EMAIL`, `CERTBOT_STAGING` (só no modo nginx+certbot), `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TEMPO_USER_EMAIL`, `TEMPO_USER_NAME`, `TEMPO_USER_PASSWORD_HASH`. O compose repassa ao back-end como `DB_URL`, `DB_USER`, `DB_PASSWORD`, `TEMPO_USER_*`.

**Checklist para adicionar uma variável:**
1. `backend/src/main/resources/application.yml` — `${VAR:padrão-seguro}` (sem padrão para segredo).
2. **Os dois** composes de produção (`docker-compose.coolify.yml` e `docker-compose.yml`) — `${VAR:?set VAR}` se obrigatória.
3. `deploy/.env.example` — valor de exemplo, nunca real.
4. Seção *Configuration*/*Deployment* do `README.md`.
5. Usuário cadastra em **Coolify → Tempo → Environment Variables** e faz *Redeploy*.

## Verificação após deploy
`https://tempo.matheusms.io` carrega; `/journal` direto no navegador carrega o SPA; headers de segurança presentes (`curl -sI`); `/api/auth/me` → 401 em ProblemDetail; login funciona e, após 5 senhas erradas, só aquele e-mail+IP fica bloqueado (prova de que o IP real chega); console do navegador sem violação de CSP.

## Diagnóstico
Peça o log do Coolify ou inspecione em leitura pela sessão SSH (`docker ps --filter label=coolify.projectName=Tempo`, `docker logs --tail=200 <container>`). Causas comuns: variável faltando, hash BCrypt inválido, migration falhando, 502 do nginx (backend ainda subindo ou fora da rede), "no available server" do Traefik (domínio não configurado no serviço `nginx`), OOM.

**Backup manual** (no servidor, com OK):
```
docker exec <container-db> sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > tempo-$(date +%F).sql.gz
```
**Nunca** `docker compose down -v` em produção — apaga o banco.

## Ao terminar
Atualize `README.md`/`CLAUDE.md`, rode a skill `verificar` e feche com `fim-de-etapa`.
