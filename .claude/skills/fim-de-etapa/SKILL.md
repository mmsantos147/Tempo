---
name: fim-de-etapa
description: Fecha uma etapa de trabalho no Tempo — resume o que mudou e sugere a mensagem de commit, sem nunca rodar git add/commit/push. Use ao concluir uma alteração ou quando o usuário pedir resumo/mensagem de commit.
---

# Fim de etapa

**Commits são do usuário. Nunca rode `git add`, `git commit` nem `git push`.** Comandos de leitura (`git status`, `git diff`) são permitidos se o git estiver disponível; senão, baseie-se no que foi alterado nesta conversa.

Responda em português, neste formato:

## O que mudou
- **Back-end:** arquivos/pacotes e o comportamento novo (endpoints, regras, status de erro).
- **Banco:** migrations novas.
- **Front-end:** telas, componentes, hooks.
- **Docs:** `README.md` / `CLAUDE.md`.

## Verificação
O que foi rodado (testes, lint, build) e o resultado. Diga explicitamente o que **não** foi verificado (ex.: não testado no navegador, não testado no deploy).

## Mensagem de commit sugerida
Em inglês, Conventional Commits, em bloco de código:

```
feat(journal): allow reordering items with keyboard

- ...
```

Se a etapa misturar assuntos independentes, sugira commits separados com os arquivos de cada um.

## Pendências
Algo que ficou de fora ou precisa de decisão do usuário. Se mudou alguma decisão, confirme que o `CLAUDE.md` foi atualizado.
