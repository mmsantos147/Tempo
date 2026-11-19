---
name: nova-migration
description: Cria a próxima migration Flyway do Tempo com a numeração correta e atualiza a lista de migrations no CLAUDE.md. Use sempre que for alterar o schema do banco.
argument-hint: "[descrição da mudança]"
---

# Nova migration: $ARGUMENTS

1. Liste `backend/src/main/resources/db/migration/` e pegue a maior versão (ex.: `V3__...`). A nova é a próxima inteira: `V4__descricao_em_snake_case.sql` (dois underscores). Use subversão (`V4_1__`) só para seed/ajuste ligado à migration anterior, como o `V1_1__seed_data.sql`.
2. **Nunca edite uma migration já existente** — o Flyway valida checksum e o banco de produção já a aplicou. Corrija com uma nova.
3. SQL para PostgreSQL 17, em inglês, seguindo o estilo de `V3__create_journal_tables.sql`:
   - nomes em snake_case; evite palavras reservadas (`date` → `entry_date`);
   - `TIMESTAMPTZ` para instantes, `DATE` para dias locais;
   - FKs e constraints com nome explícito (`fk_...`, `uk_...`), pois o `GlobalExceptionHandler` mapeia mensagens pelo nome da constraint;
   - defina `ON DELETE` conscientemente (CASCADE vs SET NULL);
   - índices para as consultas escopadas por `user_id`.
4. Se criar constraint que possa estourar em uso normal, adicione a mensagem em `CONSTRAINT_MESSAGES`.
5. Atualize a linha "Migrations:" do `CLAUDE.md` com a nova versão e uma descrição curta.
6. Rode os testes do back-end (skill `verificar backend`) — os Testcontainers aplicam todas as migrations do zero.
