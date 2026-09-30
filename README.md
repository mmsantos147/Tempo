# Tempo

Tempo is a personal kanban board with built-in time tracking. Organize cards in columns, drag them around, and hit play on a card to log the time you spend on it.

## Features

- Multiple boards, each with its own columns and cards
- Drag-and-drop cards within and between columns
- Create, edit, complete and delete cards (title, description, estimate in minutes)
- Create, rename, reorder and delete columns
- Start/stop timer on any card, with a live counter and the total time tracked per card
- Only one timer can run at a time

## Tech stack

| Layer    | Stack                                                                 |
|----------|-----------------------------------------------------------------------|
| Backend  | Java 21, Spring Boot 3.5 (Web, Data JPA, Validation), Maven, Flyway   |
| Database | PostgreSQL 17                                                         |
| Frontend | React 19, TypeScript, Vite, @dnd-kit, CSS Modules                     |
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
│   │   ├── user/         current user (fixed default user for now)
│   │   ├── error/        global exception handling (ProblemDetail)
│   │   └── config/       CORS
│   ├── src/main/resources/db/migration/   Flyway migrations
│   └── requests.http     ready-to-run API requests
├── frontend/             React app
│   └── src/
│       ├── api/          one module per resource, wrapping fetch
│       ├── hooks/        application state and actions
│       ├── components/   UI components with their CSS modules
│       └── utils/        pure helpers
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

**3. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Configuration

Both apps work out of the box with the defaults below. Override them with environment variables when needed.

**Backend**

| Variable       | Default                                   | Description                         |
|----------------|-------------------------------------------|-------------------------------------|
| `DB_URL`       | `jdbc:postgresql://localhost:5432/tempo`  | JDBC URL                            |
| `DB_USER`      | `tempo`                                   | Database user                       |
| `DB_PASSWORD`  | `tempo`                                   | Database password                   |
| `CORS_ORIGINS` | `http://localhost:5173`                   | Comma-separated allowed origins     |

**Frontend** (copy `frontend/.env.example` to `frontend/.env`)

| Variable       | Default                 | Description          |
|----------------|-------------------------|----------------------|
| `VITE_API_URL` | `http://localhost:8080` | Base URL of the API  |

If you change the frontend port or host, add the new origin to `CORS_ORIGINS`.

## API

All errors are returned as [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457). Validation errors include an `errors` map of field to message.

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

Positions are zero-based. Moving a card or column renumbers its neighbors, and a position past the end places the item last.

`backend/requests.http` has an example for every endpoint (IntelliJ HTTP Client or the VS Code REST Client extension).

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

- There is no authentication yet: every request acts as the default user seeded by the migrations.
- The live timer on screen uses the browser clock, so a skewed clock shows a slightly off value until the timer is stopped.

## License

[MIT](LICENSE)
