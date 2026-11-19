CREATE TABLE journal_entry (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    entry_date DATE        NOT NULL,
    what_i_did TEXT,
    how_i_felt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_journal_entry_user_date UNIQUE (user_id, entry_date)
);

CREATE TABLE journal_item (
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entry_id BIGINT       NOT NULL REFERENCES journal_entry (id) ON DELETE CASCADE,
    text     VARCHAR(200) NOT NULL,
    position INT          NOT NULL CHECK (position >= 0),
    card_id  BIGINT       REFERENCES card (id) ON DELETE SET NULL,
    CONSTRAINT uk_journal_item_card UNIQUE (card_id)
);

CREATE INDEX idx_journal_item_entry_position ON journal_item (entry_id, position);
