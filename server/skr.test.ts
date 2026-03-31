import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "karine@studio.com",
    name: "Karine Reverte",
    phone: null,
    birthDate: null,
    notes: null,
    loginMethod: "email",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "cliente@email.com",
    name: "Maria Cliente",
    phone: null,
    birthDate: null,
    notes: null,
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Karine Reverte");
    expect(result?.role).toBe("admin");
  });

  it("returns null when not authenticated", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ─── Admin guard tests ────────────────────────────────────────────────────────
describe("admin procedures", () => {
  it("blocks non-admin users from admin.stats", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("blocks unauthenticated users from admin.stats", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });
});

// ─── Services tests ───────────────────────────────────────────────────────────
describe("services.list", () => {
  it("is accessible without authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw — public procedure
    const result = await caller.services.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("services.create", () => {
  it("blocks non-admin from creating services", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.services.create({ name: "Test", durationMinutes: 60 })
    ).rejects.toThrow();
  });
});

// ─── Offers tests ─────────────────────────────────────────────────────────────
describe("offers.list", () => {
  it("is accessible without authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.offers.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("offers.create", () => {
  it("blocks non-admin from creating offers", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.offers.create({ title: "Test", content: "Content", type: "offer" })
    ).rejects.toThrow();
  });
});

// ─── Appointments tests ───────────────────────────────────────────────────────
describe("appointments.myList", () => {
  it("blocks unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.appointments.myList()).rejects.toThrow();
  });
});

describe("appointments.adminList", () => {
  it("blocks non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.appointments.adminList({})).rejects.toThrow();
  });
});

// ─── Profile tests ────────────────────────────────────────────────────────────
describe("profile.update", () => {
  it("blocks unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.profile.update({ name: "Test" })).rejects.toThrow();
  });
});
