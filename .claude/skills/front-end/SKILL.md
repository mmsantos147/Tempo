---
name: front-end
description: Contexto e convenções do front-end do Tempo (React 19 + TypeScript + Vite + React Router + CSS Modules + dnd-kit). Use sempre que for criar ou alterar telas, componentes, hooks, chamadas de API, rotas ou estilos em frontend/.
argument-hint: "[o que fazer no front]"
---

# Front-end do Tempo

Tarefa: $ARGUMENTS

## Regras do projeto
- **Código em inglês e sem comentários** — inclusive textos da UI (o app é em inglês: "Running", "Done", "Card").
- **Commits são do usuário**: nunca rode `git add/commit/push`; ao fim, use a skill `fim-de-etapa`.
- **Não adicione dependências sem justificar.** Hoje: React 19, React Router, `@dnd-kit/*`. Sem TanStack Query, sem biblioteca de UI, sem framework de CSS.

## Organização (`frontend/src`)
| Pasta/arquivo | Conteúdo |
|---|---|
| `api/client.ts` | `request<T>(method, path, body?)`: chama `/api` na mesma origem, envia `X-XSRF-TOKEN` do cookie em toda requisição não-GET, repete uma vez após 403 renovando o token, e em 401 fora de `/auth/*` dispara o redirect para `/login?next=`. Também `ApiError` e `errorMessage`. **Nunca use `fetch` direto.** |
| `api/<recurso>.ts` | objeto `xxxApi = { list, get, create, ... }` com caminhos **sem `/api`** (ex.: `request('GET', '/journal/${date}')`) — veja `api/journal.ts` |
| `types.ts` | tipos compartilhados das respostas da API |
| `hooks/` | estado + ações por recurso (`useBoards`, `useBoard`, `useJournal`, `useDayEntries`...), `useAuth`, `useNotify`, `useNow` |
| `components/` | um componente por arquivo + `Nome.module.css` |
| `pages/` | uma tela por rota (`BoardsPage`, `DayPage`, `JournalPage`, `LoginPage`) |
| `utils/` | funções puras: `time.ts` (`APP_TIME_ZONE`, `todayInAppZone`...), `format.ts`, `dnd.ts`, `columns.ts`, `navigation.ts` |
| `App.tsx` | rotas: `/login` pública; o resto dentro de `<Route element={<RequireAuth />}>` |

## Padrão de hook (copie de `hooks/useBoards.ts`)
- `useState` para dados e `loading`; carga inicial em `useEffect` com flag `cancelled` no cleanup.
- Ações com `useCallback`, `try/catch` e `notifyError(error)` de `useNotify`; atualize o estado local com o retorno do servidor (sem refetch completo quando não precisa).
- Preferências locais em `localStorage` com chave `tempo.<nome>` e sempre dentro de `try/catch`.
- Formulário em modal que continua aberto após erro (ex.: `TimeEntryForm`) mostra o erro **dentro** do formulário, porque o toast fica atrás do backdrop do `<dialog>`.
- Autosave (ver `useJournal`): debounce, fila de PUTs em ordem, flush no blur/desmontagem, aviso `beforeunload`.

## UI e estilo
- Reaproveite: `Button`, `Modal`, `ConfirmDialog`, `PromptDialog`, `Icon`, `AutoTextarea`, `CardPicker`, `Form.module.css`, `pages/Page.module.css`.
- **CSS Modules** por componente; cores, sombras e raio **só via variáveis** de `src/index.css` (`--bg`, `--surface`, `--surface-muted`, `--border`, `--text`, `--text-muted`, `--accent`, `--accent-hover`, `--danger`, `--success`, `--running`, `--shadow`, `--shadow-raised`, `--radius`). Tema escuro é automático por `prefers-color-scheme`: toda variável nova precisa de valor nos dois blocos.
- **CSP de produção é restrita** (`default-src 'self'`, ver `deploy/nginx/tempo.conf.template`): nada de fontes, scripts, imagens ou CSS de CDN externo, nada de `<style>`/`<script>` inline nem `eval`. Imagens só do próprio site ou `data:`. Se precisar mesmo de algo externo, a CSP tem que mudar junto (skill `deploy`).
- Datas e horas exibidas **sempre** em `APP_TIME_ZONE` (`utils/time.ts`), nunca no fuso do navegador. Ao enviar apontamentos, o `timeZone` vai explícito (como em `api/timeEntries.ts`).
- Drag and drop com dnd-kit, com suporte a teclado (handle + sensores, ver `utils/dnd.ts` e `JournalItems`).
- Validações no front são só experiência de uso; o servidor é a fonte da verdade (trate 409/400 do ProblemDetail com `errorMessage`).
- Diário e visão do dia não aceitam datas futuras.

## Checklist de mudança
1. Tipos em `types.ts`, chamadas em `api/<recurso>.ts`, estado em `hooks/`.
2. Componente + `.module.css`; rota em `App.tsx` (dentro de `RequireAuth` se privada); link no `AppHeader` se for tela nova.
3. Se mudou contrato da API, confira o back-end e a tabela da API no `README.md`.
4. O front **não tem testes automatizados**: rode a skill `verificar frontend` (lint + `tsc -b` via build) e, se possível, abra o app (`npm run dev` com o back-end em `:8080`; o Vite remove o prefixo `/api`) e teste o fluxo, incluindo tema escuro e teclado.
5. Feche com `fim-de-etapa`.
