---
name: verificar
description: Roda os testes do back-end (Maven + Testcontainers) e o lint/build do front-end do Tempo e resume as falhas. Use ao terminar uma alteração ou quando o usuário pedir para verificar/testar o projeto.
argument-hint: "[backend|frontend] (opcional; padrão: ambos)"
---

# Verificar o Tempo

Escopo: `$ARGUMENTS` (vazio = back-end e front-end).

## Pré-requisito
Os testes usam Testcontainers: o Docker precisa estar rodando. Se não estiver, avise e rode só o front.

## Back-end
No Windows/PowerShell, a partir de `backend/`:
```
.\mvnw.cmd test
```
(em bash: `./mvnw test`). Rode em background se demorar mais de ~2 min. Referência: 42 testes passando ao fim da Fase 3 — se o número cair, algo foi removido.

## Front-end
A partir de `frontend/` (`npm install` só se `node_modules` não existir):
```
npm run lint
npm run build
```
O front não tem testes automatizados; o `build` roda `tsc -b`, que pega erros de tipo.

## Relatório
- Resumo curto em português: o que passou e o que falhou.
- Para cada falha: teste/arquivo, mensagem principal e causa provável.
- Não corrija nada automaticamente sem o usuário pedir, exceto se a falha veio da alteração que você acabou de fazer.
- **Não faça commit** — isso é do usuário.
