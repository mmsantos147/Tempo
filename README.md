# Tempo

Tempo is a personal kanban board with built-in time tracking. Organize cards in columns, drag them around, and hit play on a card to log the time you spend on it.

## Features

- Multiple boards, each with its own columns and cards
- Drag-and-drop cards within and between columns
- Create, edit, complete and delete cards (title, description, estimate in minutes)
- Create, rename, reorder and delete columns
- Start/stop timer on any card, with a live counter and the total time tracked per card
- Only one timer can run at a time
- Log or edit time manually by picking the day, start and end, from a card or from the day view
- Day view listing every time entry of a day, with navigation between days
- Journal: one entry per day ("what I did", "how I felt") with autosave, a calendar, the day's tracked time alongside, and a "want to do" list whose items can become cards
- Session-based login with CSRF protection, ready to self-host behind nginx with automatic Let's Encrypt certificates

## Tech stack

| Layer    | Stack                                                                 |
|----------|-----------------------------------------------------------------------|
| Backend  | Java 21, Spring Boot 3.5 (Web, Data JPA, Validation, Security), Maven, Flyway |
| Database | PostgreSQL 17                                                         |
| Frontend | React 19, TypeScript, Vite, React Router, @dnd-kit, CSS Modules       |
| Tests    | JUnit 5, AssertJ, Testcontainers                                      |

## Project structure

```
.
├── backend/              Spring Boot API
│   ├── src/main/java/br/com/tempo/
│   │   ├── board/        boards
│   │   ├── column/       board columns
│   │   ├── card/         cards (including move/complete/reopen)
│   │   ├── timeentry/    time tracking
│   │   ├── journal/      daily journal and its "want to do" items
│   │   ├── auth/         login, logout, current session
│   │   ├── user/         users, current user, initial user bootstrap
│   │   ├── error/        global exception handling (ProblemDetail)
│   │   └── config/       Spring Security
│   ├── src/main/resources/db/migration/   Flyway migrations
│   └── requests.http     ready-to-run API requests
├── frontend/             React app
│   └── src/
│       ├── api/          one module per resource, wrapping fetch
│       ├── pages/        route-level screens
│       ├── hooks/        application state and actions
│       ├── components/   UI components with their CSS modules
│       └── utils/        pure helpers
├── deploy/               production: docker-compose, nginx image, certbot
└── docker-compose.yml    local PostgreSQL
```

## Prerequisites

- Java 21 or newer
- Node.js 20.19+ or 22.12+
- Docker (for PostgreSQL)

Maven is not required: the backend ships with the Maven Wrapper (`./mvnw`).

## Getting started

Run each step in its own terminal, from the repository root.

**1. Start the database**

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with database, user and password all set to `tempo`.

**2. Start the backend**

```bash
cd backend
./mvnw spring-boot:run
```

The API runs on `http://localhost:8080`. On startup, Flyway creates the tables and seeds a default user and a sample board ("My board" with *To do*, *Doing* and *Done*).

The seeded user has no usable password. To sign in, start the backend with an initial user (see [Generating a password hash](#generating-a-password-hash)); it is created on startup if its email does not exist yet:

```bash
TEMPO_USER_EMAIL=you@example.com TEMPO_USER_NAME='Your Name' \
TEMPO_USER_PASSWORD_HASH='$2y$12$...' ./mvnw spring-boot:run
```

**3. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to the backend (removing the `/api` prefix), exactly like nginx does in production, so the browser only ever talks to one origin.

## Configuration

The backend reads its configuration from environment variables. The defaults match the local database from `docker-compose.yml`.

| Variable                   | Default                                   | Description                                        |
|----------------------------|-------------------------------------------|----------------------------------------------------|
| `DB_URL`                   | `jdbc:postgresql://localhost:5432/tempo`  | JDBC URL                                           |
| `DB_USER`                  | `tempo`                                   | Database user                                      |
| `DB_PASSWORD`              | `tempo`                                   | Database password (local development only)         |
| `TEMPO_USER_EMAIL`         | empty                                     | Email of the user created on startup, if missing   |
| `TEMPO_USER_NAME`          | empty                                     | Display name of that user                          |
| `TEMPO_USER_PASSWORD_HASH` | empty                                     | BCrypt hash of that user's password                |

The frontend has no configuration: it always calls the API at `/api` on its own origin.

### Generating a password hash

Only the BCrypt hash is ever stored in configuration, never the password. Generate it without installing anything (the password is read silently and never reaches your shell history):

```bash
read -rs PASSWORD && printf '%s' "$PASSWORD" | docker run --rm -i httpd:2.4-alpine htpasswd -niBC 12 "" | tr -d ':\n'; unset PASSWORD; echo
```

The hash contains `$` signs: always wrap it in single quotes, in the shell and in `.env` files.

BCrypt only looks at the first 72 bytes of a password, so the login rejects longer passwords instead of silently truncating them. Pick a password of at most 72 bytes (72 ASCII characters).

## Deployment

`deploy/` runs Tempo on a single server with Docker Compose:

| Service   | Role                                                                                 | Networks          | Published ports |
|-----------|--------------------------------------------------------------------------------------|-------------------|-----------------|
| `db`      | PostgreSQL 17                                                                        | `internal`        | none            |
| `backend` | Spring Boot API                                                                      | `internal`, `web` | none            |
| `nginx`   | Serves the frontend, proxies `/api/*` to the backend, terminates HTTPS               | `web`             | 80, 443         |
| `certbot` | Obtains and renews the Let's Encrypt certificate through the webroot challenge       | `web`             | none            |

`internal` is a Docker internal network: the database has no route to the outside world, and only the backend can reach it.

**First deploy**

1. Point the DNS `A`/`AAAA` record of your domain to the server.
2. Allow only SSH, HTTP and HTTPS in the firewall (for example `ufw allow 22,80,443/tcp`). Docker bypasses `ufw` for published ports, which is why only nginx publishes any.
3. Clone the repository on the server and create the environment file:
   ```bash
   cd deploy
   cp .env.example .env
   chmod 600 .env
   ```
   Fill in every value. Use a long random `POSTGRES_PASSWORD` (`openssl rand -base64 32`) and a password hash generated as above.
4. Start everything:
   ```bash
   docker compose up -d --build
   ```

On the first start nginx serves a temporary self-signed certificate while certbot requests the real one; nginx checks every minute and reloads as soon as it arrives. Renewals run twice a day and nginx reloads every six hours to pick them up. Set `CERTBOT_STAGING=1` while testing the setup to avoid Let's Encrypt rate limits, then remove the `letsencrypt` volume and set it back to `0`.

**Updating**

```bash
git pull
cd deploy
docker compose up -d --build
```

Sessions are kept in the backend's memory, so a redeploy signs you out.

**Backups**

The data lives in the `pgdata` volume. A simple dump:

```bash
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > tempo-$(date +%F).sql.gz
```

## API

All errors are returned as [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457). Validation errors include an `errors` map of field to message.

Paths below are relative to the backend; through nginx or the Vite dev server they are prefixed with `/api`. Every endpoint except `/auth/csrf` and `/auth/login` requires a session. Authentication uses a session cookie, and every `POST`, `PUT` and `DELETE` must send the value of the `XSRF-TOKEN` cookie in the `X-XSRF-TOKEN` header.

| Method | Path           | Description                                                                   |
|--------|----------------|-------------------------------------------------------------------------------|
| GET    | `/auth/csrf`   | Issues the `XSRF-TOKEN` cookie                                                |
| POST   | `/auth/login`  | `{ "email", "password" }`; 401 on wrong credentials, 429 with `Retry-After` when blocked |
| POST   | `/auth/logout` | Ends the session                                                              |
| GET    | `/auth/me`     | The signed-in user, or 401                                                    |

| Method | Path                                 | Description                                   |
|--------|--------------------------------------|-----------------------------------------------|
| GET    | `/boards`                            | List boards                                   |
| POST   | `/boards`                            | Create a board                                |
| GET    | `/boards/{id}`                       | Board with its columns and cards              |
| PUT    | `/boards/{id}`                       | Rename a board                                |
| DELETE | `/boards/{id}`                       | Delete a board and everything in it           |
| POST   | `/boards/{boardId}/columns`          | Add a column at the end                       |
| PUT    | `/columns/{id}`                      | Rename a column                               |
| POST   | `/columns/{id}/move`                 | Move a column to `{ "position" }`             |
| DELETE | `/columns/{id}`                      | Delete a column and its cards                 |
| POST   | `/columns/{columnId}/cards`          | Add a card at the end of a column             |
| GET    | `/cards/{id}`                        | Get a card                                    |
| PUT    | `/cards/{id}`                        | Update title, description and estimate        |
| POST   | `/cards/{id}/move`                   | Move to `{ "columnId", "position" }`          |
| POST   | `/cards/{id}/complete`               | Mark as completed                             |
| POST   | `/cards/{id}/reopen`                 | Mark as not completed                         |
| DELETE | `/cards/{id}`                        | Delete a card and its time entries            |
| POST   | `/cards/{cardId}/time-entries/start` | Start a timer (optional `{ "description" }`)  |
| POST   | `/time-entries/{id}/stop`            | Stop a timer                                  |
| GET    | `/cards/{cardId}/time`               | Total seconds tracked and the running entry   |
| POST   | `/cards/{cardId}/time-entries`       | Log a time entry manually (see below)         |
| PUT    | `/time-entries/{id}`                 | Edit a time entry (see below)                 |
| GET    | `/time-entries?date=&timeZone=`      | Time entries that started on a local date     |
| GET    | `/journal?from=&to=`                 | Dates that have a journal entry               |
| GET    | `/journal/{date}`                    | Journal entry with its items (404 if none)    |
| PUT    | `/journal/{date}`                    | Create (201) or update (200) the entry        |
| POST   | `/journal/{date}/items`              | Add a "want to do" item at the end            |
| PUT    | `/journal-items/{id}`                | Edit an item's text                           |
| POST   | `/journal-items/{id}/move`           | Move an item to `{ "position" }`              |
| DELETE | `/journal-items/{id}`                | Delete an item                                |
| POST   | `/journal-items/{id}/create-card`    | Create a card from an item in `{ "columnId" }` |

Sessions expire after 12 hours of inactivity. Five failed logins for the same email from the same IP, or twenty from the same IP, block further attempts from there for 15 minutes; the counters live in memory and reset on restart.

Manual time entries take the local day and times plus an explicit IANA time zone, which the server converts to instants. An entry starts and ends on the same day:

```json
{ "date": "2026-10-15", "startTime": "09:00", "endTime": "10:30", "timeZone": "America/Sao_Paulo", "description": null }
```

The end must be after the start and not in the future, and the entry cannot overlap another one of yours (a running timer counts until now). Entries that only touch, like 09:00–10:00 and 10:00–11:00, do not overlap. A running timer cannot be edited. An unknown time zone is a 400; the other rules answer 409. A time entry belongs to the local day its start falls on.

Journal entries cannot be written for future dates, and blank texts are stored as `null`. Deleting a card keeps the journal item that created it, just unlinked; deleting the item keeps the card.

Positions are zero-based. Moving a card or column renumbers its neighbors, and a position past the end places the item last.

`backend/requests.http` has an example for every endpoint (IntelliJ HTTP Client or the VS Code REST Client extension). Run `GET /auth/csrf` and `POST /auth/login` first, then paste the `XSRF-TOKEN` cookie value into the `@xsrf` variable.

## Tests

```bash
cd backend
./mvnw test
```

The tests start a disposable PostgreSQL container through Testcontainers, so Docker must be running.

For the frontend:

```bash
cd frontend
npm run build
npm run lint
```

`build` also type-checks the code.

## Limitations

- There is no sign-up screen: users are created through the `TEMPO_USER_*` variables.
- The live timer on screen uses the browser clock, so a skewed clock shows a slightly off value until the timer is stopped.

## License

[MIT](LICENSE)
