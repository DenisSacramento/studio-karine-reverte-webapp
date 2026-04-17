import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { upsertUser } from "../../server/db";
import { appRouter } from "../../server/routers";
import { getSessionCookieOptions } from "../../server/_core/cookies";
import { createFetchContext } from "../../server/_core/context";
import { sdk } from "../../server/_core/sdk";

function toCookieHeader(name, value, options) {
  const cookieParts = [`${name}=${encodeURIComponent(value)}`];
  if (options.path) cookieParts.push(`Path=${options.path}`);
  if (options.httpOnly) cookieParts.push("HttpOnly");
  if (options.secure) cookieParts.push("Secure");
  if (options.sameSite) cookieParts.push(`SameSite=${String(options.sameSite)}`);
  if (options.maxAge !== undefined) {
    cookieParts.push(`Max-Age=${Math.floor(Number(options.maxAge) / 1000)}`);
  }
  if (options.domain) cookieParts.push(`Domain=${options.domain}`);
  return cookieParts.join("; ");
}

function buildRequest(event) {
  const proto = event.headers["x-forwarded-proto"] || "https";
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const rawUrl = `${proto}://${host}${event.rawUrl ? new URL(event.rawUrl).pathname + (new URL(event.rawUrl).search || "") : event.path}`;
  const headers = new Headers();

  for (const [key, value] of Object.entries(event.headers)) {
    if (typeof value === "string") headers.set(key, value);
  }

  const method = event.httpMethod || "GET";
  const body = event.body && !["GET", "HEAD"].includes(method)
    ? (event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body)
    : undefined;

  return new Request(rawUrl, { method, headers, body });
}

async function handleOAuthCallback(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return Response.json({ error: "code and state are required" }, { status: 400 });
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      return Response.json({ error: "openId missing from user info" }, { status: 400 });
    }

    await upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    const reqLike = {
      protocol: request.headers.get("x-forwarded-proto") ?? "https",
      headers: {
        "x-forwarded-proto": request.headers.get("x-forwarded-proto") ?? undefined,
      },
    };

    const cookieOptions = getSessionCookieOptions(reqLike);
    const setCookie = toCookieHeader(COOKIE_NAME, sessionToken, {
      ...cookieOptions,
      maxAge: ONE_YEAR_MS,
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": setCookie,
      },
    });
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return Response.json({ error: "OAuth callback failed" }, { status: 500 });
  }
}

export const handler = async (event) => {
  const request = buildRequest(event);
  const pathname = new URL(request.url).pathname;

  if (pathname.startsWith("/api/oauth/callback")) {
    const response = await handleOAuthCallback(request);
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
    };
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: createFetchContext,
  });

  const headers = Object.fromEntries(response.headers.entries());
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    headers["set-cookie"] = setCookie;
  }

  return {
    statusCode: response.status,
    headers,
    body: await response.text(),
  };
};
