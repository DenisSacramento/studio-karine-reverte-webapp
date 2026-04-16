import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

const parsed = new URL(connectionString);
const database = parsed.pathname.replace(/^\/+/, "");

if (!database) {
  throw new Error("DATABASE_URL must include a database name");
}

const parsedPort = Number(parsed.port);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: parsed.hostname,
    port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    ssl: {
      rejectUnauthorized: true,
    },
  },
});
