/**
 * Ready-to-copy Docker Compose snippets for common local databases.
 *
 * Each snippet is a literal string and should remain fully self-contained so
 * users can paste it into a `docker-compose.yml` and `docker compose up -d`
 * without edits. All credentials are intentionally obvious and weak because
 * these files are meant for local development only.
 */

export interface ComposeRecipe {
  id: string;
  title: string;
  description: string;
  filename: string;
  content: string;
  credentials: Array<{ label: string; value: string }>;
  connectionUrl: string;
  /** Sample `psql` / `mysql` etc. command for quickly hopping in. */
  cli: string;
  tag: "postgres" | "mysql" | "fullstack";
}

const POSTGRES_COMPOSE = `# Local PostgreSQL 16 - plain, persistent, port 5432.
# Bring up:   docker compose up -d
# Tear down:  docker compose down
# Wipe data:  docker compose down -v
services:
  postgres:
    image: postgres:16-alpine
    container_name: practiceql-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: practiceql
      POSTGRES_PASSWORD: practiceql
      POSTGRES_DB: practiceql
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U practiceql -d practiceql"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`;

const POSTGRES_PGADMIN_COMPOSE = `# PostgreSQL 16 + pgAdmin 4 web UI.
# Postgres: localhost:5432   pgAdmin: http://localhost:5050
services:
  postgres:
    image: postgres:16-alpine
    container_name: practiceql-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: practiceql
      POSTGRES_PASSWORD: practiceql
      POSTGRES_DB: practiceql
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: practiceql-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@practiceql.local
      PGADMIN_DEFAULT_PASSWORD: practiceql
      PGADMIN_CONFIG_SERVER_MODE: "False"
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
`;

const MYSQL_COMPOSE = `# Local MySQL 8 - native_password auth, persistent, port 3306.
services:
  mysql:
    image: mysql:8.0
    container_name: practiceql-mysql
    restart: unless-stopped
    command: --default-authentication-plugin=caching_sha2_password
    environment:
      MYSQL_ROOT_PASSWORD: practiceql
      MYSQL_DATABASE: practiceql
      MYSQL_USER: practiceql
      MYSQL_PASSWORD: practiceql
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-ppracticeql"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  mysql_data:
`;

const MYSQL_PHPMYADMIN_COMPOSE = `# MySQL 8 + phpMyAdmin web UI.
# MySQL: localhost:3306   phpMyAdmin: http://localhost:8080
services:
  mysql:
    image: mysql:8.0
    container_name: practiceql-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: practiceql
      MYSQL_DATABASE: practiceql
      MYSQL_USER: practiceql
      MYSQL_PASSWORD: practiceql
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin:5
    container_name: practiceql-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: mysql
      PMA_USER: practiceql
      PMA_PASSWORD: practiceql
    ports:
      - "8080:80"
    depends_on:
      - mysql

volumes:
  mysql_data:
`;

const FULLSTACK_COMPOSE = `# Everything-at-once local dev stack:
# - Postgres 16       localhost:5432
# - MySQL 8           localhost:3306
# - Redis 7           localhost:6379
# - Adminer (SQL UI)  http://localhost:8081
#
# Creds for both DBs:  user=practiceql password=practiceql db=practiceql
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: practiceql
      POSTGRES_PASSWORD: practiceql
      POSTGRES_DB: practiceql
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  mysql:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: practiceql
      MYSQL_DATABASE: practiceql
      MYSQL_USER: practiceql
      MYSQL_PASSWORD: practiceql
    ports: ["3306:3306"]
    volumes: [mysql_data:/var/lib/mysql]

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports: ["6379:6379"]
    volumes: [redis_data:/data]

  adminer:
    image: adminer:4
    restart: unless-stopped
    ports: ["8081:8080"]

volumes:
  postgres_data:
  mysql_data:
  redis_data:
`;

export const COMPOSE_RECIPES: ComposeRecipe[] = [
  {
    id: "postgres",
    title: "PostgreSQL 16",
    description:
      "The simplest possible local Postgres, with a persistent named volume and a health check.",
    filename: "docker-compose.postgres.yml",
    content: POSTGRES_COMPOSE,
    credentials: [
      { label: "Host", value: "localhost" },
      { label: "Port", value: "5432" },
      { label: "Database", value: "practiceql" },
      { label: "User", value: "practiceql" },
      { label: "Password", value: "practiceql" },
    ],
    connectionUrl:
      "postgresql://practiceql:practiceql@localhost:5432/practiceql",
    cli: "psql postgresql://practiceql:practiceql@localhost:5432/practiceql",
    tag: "postgres",
  },
  {
    id: "postgres-pgadmin",
    title: "PostgreSQL + pgAdmin",
    description:
      "Postgres plus a browser-based admin UI so you can explore tables without installing a desktop client.",
    filename: "docker-compose.postgres-pgadmin.yml",
    content: POSTGRES_PGADMIN_COMPOSE,
    credentials: [
      { label: "Postgres", value: "postgresql://practiceql:practiceql@localhost:5432/practiceql" },
      { label: "pgAdmin URL", value: "http://localhost:5050" },
      { label: "pgAdmin email", value: "admin@practiceql.local" },
      { label: "pgAdmin password", value: "practiceql" },
    ],
    connectionUrl:
      "postgresql://practiceql:practiceql@localhost:5432/practiceql",
    cli: "open http://localhost:5050  # then add server host=postgres",
    tag: "postgres",
  },
  {
    id: "mysql",
    title: "MySQL 8",
    description:
      "MySQL 8 with the modern caching_sha2_password auth plugin and a persistent named volume.",
    filename: "docker-compose.mysql.yml",
    content: MYSQL_COMPOSE,
    credentials: [
      { label: "Host", value: "localhost" },
      { label: "Port", value: "3306" },
      { label: "Database", value: "practiceql" },
      { label: "User", value: "practiceql" },
      { label: "Password", value: "practiceql" },
      { label: "Root password", value: "practiceql" },
    ],
    connectionUrl: "mysql://practiceql:practiceql@localhost:3306/practiceql",
    cli: "mysql -h 127.0.0.1 -u practiceql -p practiceql",
    tag: "mysql",
  },
  {
    id: "mysql-phpmyadmin",
    title: "MySQL + phpMyAdmin",
    description:
      "MySQL plus the classic phpMyAdmin UI for point-and-click schema editing.",
    filename: "docker-compose.mysql-phpmyadmin.yml",
    content: MYSQL_PHPMYADMIN_COMPOSE,
    credentials: [
      { label: "MySQL", value: "mysql://practiceql:practiceql@localhost:3306/practiceql" },
      { label: "phpMyAdmin URL", value: "http://localhost:8080" },
      { label: "phpMyAdmin user", value: "practiceql" },
      { label: "phpMyAdmin password", value: "practiceql" },
    ],
    connectionUrl: "mysql://practiceql:practiceql@localhost:3306/practiceql",
    cli: "open http://localhost:8080",
    tag: "mysql",
  },
  {
    id: "fullstack",
    title: "Postgres + MySQL + Redis + Adminer",
    description:
      "One compose file, every common dev dependency. Great as a scratch environment for polyglot backends.",
    filename: "docker-compose.dev-stack.yml",
    content: FULLSTACK_COMPOSE,
    credentials: [
      { label: "Postgres", value: "postgresql://practiceql:practiceql@localhost:5432/practiceql" },
      { label: "MySQL", value: "mysql://practiceql:practiceql@localhost:3306/practiceql" },
      { label: "Redis", value: "redis://localhost:6379" },
      { label: "Adminer UI", value: "http://localhost:8081" },
    ],
    connectionUrl:
      "postgresql://practiceql:practiceql@localhost:5432/practiceql",
    cli: "docker compose up -d && open http://localhost:8081",
    tag: "fullstack",
  },
];
