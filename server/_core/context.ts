import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type ContextRequest = {
  headers: {
    cookie?: string;
    [key: string]: string | string[] | undefined;
  };
  protocol?: string;
  get: (name: string) => string | undefined;
};

export type ContextResponse = {
  cookie: (name: string, value: string, options?: Record<string, unknown>) => void;
  clearCookie: (name: string, options?: Record<string, unknown>) => void;
};

export type TrpcContext = {
  req: ContextRequest;
  res: ContextResponse;
  user: User | null;
  responseHeaders?: Headers;
};

async function resolveUser(req: { headers: { cookie?: string } }): Promise<User | null> {
  try {
    return await sdk.authenticateRequest(req as any);
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await resolveUser(opts.req as any);

  return {
    req: opts.req as any,
    res: opts.res as any,
    user,
  };
}

export async function createFetchContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  const request = opts.req;
  const responseHeaders = opts.resHeaders;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? undefined;

  const req: ContextRequest = {
    protocol: request.headers.get("x-forwarded-proto") ?? undefined,
    headers: {
      cookie: request.headers.get("cookie") ?? undefined,
      host,
      "x-forwarded-host": request.headers.get("x-forwarded-host") ?? undefined,
      "x-forwarded-proto": request.headers.get("x-forwarded-proto") ?? undefined,
    },
    get(name: string) {
      return request.headers.get(name) ?? undefined;
    },
  };

  const res: ContextResponse = {
    cookie(name, value, options = {}) {
      const cookieParts = [`${name}=${encodeURIComponent(value)}`];
      if (options.path) cookieParts.push(`Path=${options.path}`);
      if (options.httpOnly) cookieParts.push("HttpOnly");
      if (options.secure) cookieParts.push("Secure");
      if (options.sameSite) cookieParts.push(`SameSite=${String(options.sameSite)}`);
      if (options.maxAge !== undefined) {
        cookieParts.push(`Max-Age=${Math.floor(Number(options.maxAge) / 1000)}`);
      }
      if (options.domain) cookieParts.push(`Domain=${options.domain}`);
      responseHeaders.append("set-cookie", cookieParts.join("; "));
    },
    clearCookie(name, options = {}) {
      const cookieParts = [`${name}=`, "Max-Age=0"];
      if (options.path) cookieParts.push(`Path=${options.path}`);
      if (options.httpOnly) cookieParts.push("HttpOnly");
      if (options.secure) cookieParts.push("Secure");
      if (options.sameSite) cookieParts.push(`SameSite=${String(options.sameSite)}`);
      if (options.domain) cookieParts.push(`Domain=${options.domain}`);
      responseHeaders.append("set-cookie", cookieParts.join("; "));
    },
  };

  const user = await resolveUser(req);
  return { req, res, user, responseHeaders };
}
