import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerOAuthRoutes } from "./oauth";
import { serveStatic, setupVite } from "./vite";

export async function buildApp(options?: {
  attachFrontend?: boolean;
  development?: boolean;
}) {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (options?.attachFrontend) {
    const server = createServer(app);
    if (options.development) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    return { app, server };
  }

  return { app, server: null };
}
