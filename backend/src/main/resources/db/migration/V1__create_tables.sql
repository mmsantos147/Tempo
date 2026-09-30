CREATE TABLE app_user (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_app_user_email UNIQUE (email)
);

CREATE TABLE board (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_user ON board (user_id);

CREATE TABLE board_column (
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    board_id BIGINT       NOT NULL REFERENCES board (id) ON DELETE CASCADE,
    name     VARCHAR(100) NOT NULL,
    position INT          NOT NULL CHECK (position >= 0)
);

CREATE INDEX idx_board_column_board_position ON board_column (board_id, position);

CREATE TABLE card (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    column_id         BIGINT       NOT NULL REFERENCES board_column (id) ON DELETE CASCADE,
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    position          INT          NOT NULL CHECK (position >= 0),
    estimated_minutes INT CHECK (estimated_minutes >= 0),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ
);

CREATE INDEX idx_card_column_position ON card (column_id, position);

CREATE TABLE time_entry (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    card_id     BIGINT      NOT NULL REFERENCES card (id) ON DELETE CASCADE,
    user_id     BIGINT      NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    started_at  TIMESTAMPTZ NOT NULL,
    ended_at    TIMESTAMPTZ,
    description VARCHAR(500),
    CONSTRAINT ck_time_entry_ended_after_started CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX idx_time_entry_card ON time_entry (card_id);
CREATE INDEX idx_time_entry_user ON time_entry (user_id);
