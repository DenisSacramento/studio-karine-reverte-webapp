import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import {
  InsertUser,
  appointments,
  blockedTimes,
  businessHours,
  offers,
  services,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _missingDatabaseUrlWarned = false;

function createSecureMysqlPool(connectionString: string) {
  const parsed = new URL(connectionString);
  const database = parsed.pathname.replace(/^\/+/, "");
  const parsedPort = Number(parsed.port);

  return createPool({
    host: parsed.hostname,
    port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT ?? 5),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 10000),
    ssl: {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    },
  });
}

export async function getDb() {
  const connectionString = ENV.databaseUrl || process.env.DATABASE_URL;

  if (!_db && connectionString) {
    try {
      const pool = createSecureMysqlPool(connectionString);
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }

  if (!_db && !connectionString && !_missingDatabaseUrlWarned) {
    _missingDatabaseUrlWarned = true;
    console.warn("[Database] DATABASE_URL is not configured. API calls will return empty fallback data.");
  }

  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "phone", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserProfile(
  userId: number,
  data: { name?: string; phone?: string; birthDate?: string }
) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? sql`${data.birthDate}` : null;
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(eq(users.role, "user"))
    .orderBy(desc(users.createdAt));
}

// ─── Services ─────────────────────────────────────────────────────────────────
export async function getServices(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(services);
  if (activeOnly) {
    return query.where(eq(services.active, true)).orderBy(services.sortOrder);
  }
  return query.orderBy(services.sortOrder);
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0];
}

export async function createService(data: {
  name: string;
  description?: string;
  durationMinutes: number;
  price?: string;
  imageUrl?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(services).values({ ...data, active: true });
}

export async function updateService(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    durationMinutes: number;
    price: string;
    imageUrl: string;
    active: boolean;
    sortOrder: number;
  }>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(services).set(data).where(eq(services.id, id));
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export async function createAppointment(data: {
  userId: number;
  serviceId: number;
  appointmentDate: string;
  appointmentTime: string;
  clientNotes?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(appointments).values({
    userId: data.userId,
    serviceId: data.serviceId,
    appointmentDate: sql`${data.appointmentDate}`,
    appointmentTime: data.appointmentTime,
    clientNotes: data.clientNotes,
    status: "pending",
  });
}

export async function getAppointmentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      appointmentTime: appointments.appointmentTime,
      status: appointments.status,
      clientNotes: appointments.clientNotes,
      adminNotes: appointments.adminNotes,
      createdAt: appointments.createdAt,
      serviceName: services.name,
      serviceDuration: services.durationMinutes,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(eq(appointments.userId, userId))
    .orderBy(desc(appointments.appointmentDate), desc(appointments.appointmentTime));
  return rows;
}

export async function getAllAppointments(dateFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      appointmentTime: appointments.appointmentTime,
      status: appointments.status,
      clientNotes: appointments.clientNotes,
      adminNotes: appointments.adminNotes,
      reminderSent: appointments.reminderSent,
      createdAt: appointments.createdAt,
      serviceName: services.name,
      serviceDuration: services.durationMinutes,
      clientName: users.name,
      clientEmail: users.email,
      clientPhone: users.phone,
      userId: appointments.userId,
      serviceId: appointments.serviceId,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(users, eq(appointments.userId, users.id))
    .where(dateFilter ? sql`${appointments.appointmentDate} = ${dateFilter}` : undefined)
    .orderBy(appointments.appointmentDate, appointments.appointmentTime);
  return rows;
}

export async function updateAppointmentStatus(
  id: number,
  status: "pending" | "confirmed" | "cancelled" | "completed",
  adminNotes?: string
) {
  const db = await getDb();
  if (!db) return;
  const data: Record<string, unknown> = { status };
  if (adminNotes !== undefined) data.adminNotes = adminNotes;
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      appointmentTime: appointments.appointmentTime,
      status: appointments.status,
      clientNotes: appointments.clientNotes,
      adminNotes: appointments.adminNotes,
      reminderSent: appointments.reminderSent,
      createdAt: appointments.createdAt,
      serviceName: services.name,
      serviceDuration: services.durationMinutes,
      servicePrice: services.price,
      clientName: users.name,
      clientEmail: users.email,
      clientPhone: users.phone,
      userId: appointments.userId,
      serviceId: appointments.serviceId,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(users, eq(appointments.userId, users.id))
    .where(eq(appointments.id, id))
    .limit(1);
  return rows[0];
}

export async function getBookedTimesForDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ appointmentTime: appointments.appointmentTime, serviceDuration: services.durationMinutes })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        sql`${appointments.appointmentDate} = ${date}`,
        sql`${appointments.status} != 'cancelled'`
      )
    );
}

export async function getAppointmentsDueForReminder() {
  const db = await getDb();
  if (!db) return [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0]!;
  return db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      appointmentTime: appointments.appointmentTime,
      clientName: users.name,
      clientEmail: users.email,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.userId, users.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        sql`${appointments.appointmentDate} = ${tomorrowStr}`,
        eq(appointments.reminderSent, false),
        sql`${appointments.status} IN ('pending','confirmed')`
      )
    );
}

export async function markReminderSent(appointmentId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(appointments).set({ reminderSent: true }).where(eq(appointments.id, appointmentId));
}

// ─── Offers ───────────────────────────────────────────────────────────────────
export async function getOffers(publishedOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(offers);
  if (publishedOnly) {
    return query.where(eq(offers.published, 1)).orderBy(desc(offers.publishedAt));
  }
  return query.orderBy(desc(offers.createdAt));
}

export async function getServiceOffers(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: offers.id,
      serviceId: services.id,
      serviceName: services.name,
      serviceDuration: services.durationMinutes,
      serviceImageUrl: services.imageUrl,
      servicePrice: services.price,
      promotionalPrice: offers.promotionalPrice,
      offerDescription: offers.offerDescription,
      active: offers.active,
      published: offers.published,
      expiresAt: offers.expiresAt,
      updatedAt: offers.updatedAt,
      createdAt: offers.createdAt,
    })
    .from(offers)
    .innerJoin(services, eq(offers.serviceId, services.id))
    .where(
      and(
        eq(offers.type, "offer"),
        activeOnly ? eq(offers.active, 1) : undefined,
        activeOnly ? eq(offers.published, 1) : undefined
      )
    )
    .orderBy(desc(offers.updatedAt));
}

function toTinyIntBoolean(value: boolean | undefined): 0 | 1 | undefined {
  if (value === undefined) return undefined;
  return value ? 1 : 0;
}

function normalizeDecimal(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return undefined;
  return amount.toFixed(2);
}

export async function createServiceOffer(data: {
  serviceId: number;
  promotionalPrice: string;
  offerDescription: string;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(offers)
    .set({ active: 0, published: 0 })
    .where(
      and(
        eq(offers.serviceId, data.serviceId),
        eq(offers.type, "offer"),
        eq(offers.active, 1)
      )
    );

  const service = await getServiceById(data.serviceId);
  const title = service
    ? `Oferta Relampago - ${service.name}`
    : "Oferta Relampago";

  await db.insert(offers).values({
    serviceId: data.serviceId,
    title,
    content: data.offerDescription,
    offerDescription: data.offerDescription,
    promotionalPrice: normalizeDecimal(data.promotionalPrice),
    type: "offer",
    active: 1,
    published: 1,
    publishedAt: new Date(),
    notificationSent: 1,
    expiresAt: data.expiresAt,
  });
}

export async function setServiceOfferActive(id: number, active: boolean) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(offers)
    .set({
      active: toTinyIntBoolean(active) as any,
      published: toTinyIntBoolean(active) as any,
      publishedAt: active ? new Date() : null,
    })
    .where(eq(offers.id, id));
}

export async function createOffer(data: {
  title: string;
  content: string;
  type: "offer" | "news";
  serviceId?: number;
  offerDescription?: string;
  promotionalPrice?: string;
  active?: boolean;
  published?: boolean;
  publishedAt?: Date;
  notificationSent?: boolean;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) return;

  const insertData = {
    serviceId: data.serviceId,
    title: data.title.trim(),
    content: data.content.trim(),
    offerDescription: data.offerDescription?.trim() || undefined,
    promotionalPrice: normalizeDecimal(data.promotionalPrice),
    active: toTinyIntBoolean(data.active ?? false) ?? 0,
    type: data.type,
    published: toTinyIntBoolean(data.published ?? false) ?? 0,
    publishedAt: data.publishedAt instanceof Date ? data.publishedAt : undefined,
    expiresAt: data.expiresAt,
    notificationSent: toTinyIntBoolean(data.notificationSent ?? false) ?? 0,
  };

  await db.insert(offers).values({
    ...insertData,
  });
}

export async function updateOffer(
  id: number,
  data: Partial<{
    serviceId: number;
    title: string;
    content: string;
    offerDescription: string;
    promotionalPrice: string;
    active: boolean;
    type: "offer" | "news";
    published: boolean;
    publishedAt: Date;
    expiresAt: Date;
    notificationSent: boolean;
  }>
) {
  const db = await getDb();
  if (!db) return;

  const updateData: Record<string, unknown> = {
    ...data,
  };

  if (data.active !== undefined) {
    updateData.active = toTinyIntBoolean(data.active);
  }
  if (data.published !== undefined) {
    updateData.published = toTinyIntBoolean(data.published);
  }
  if (data.notificationSent !== undefined) {
    updateData.notificationSent = toTinyIntBoolean(data.notificationSent);
  }
  if (data.promotionalPrice !== undefined) {
    updateData.promotionalPrice = normalizeDecimal(data.promotionalPrice);
  }

  await db.update(offers).set(updateData).where(eq(offers.id, id));
}

export async function getOfferById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  return result[0];
}

export async function getUnnotifiedPublishedOffers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(offers)
    .where(and(eq(offers.published, 1), eq(offers.notificationSent, 0)));
}

// ─── Business Hours ───────────────────────────────────────────────────────────
export async function getBusinessHours() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessHours).orderBy(businessHours.dayOfWeek);
}

export async function updateBusinessHour(
  id: number,
  data: { openTime?: string; closeTime?: string; isOpen?: boolean }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(businessHours).set(data).where(eq(businessHours.id, id));
}

// ─── Blocked Times ────────────────────────────────────────────────────────────
export async function getBlockedTimes(dateFrom?: string, dateTo?: string) {
  const db = await getDb();
  if (!db) return [];
  if (dateFrom && dateTo) {
    return db
      .select()
      .from(blockedTimes)
      .where(
        and(
          sql`${blockedTimes.blockedDate} >= ${dateFrom}`,
          sql`${blockedTimes.blockedDate} <= ${dateTo}`
        )
      );
  }
  return db.select().from(blockedTimes).orderBy(blockedTimes.blockedDate);
}

export async function createBlockedTime(data: {
  blockedDate: string;
  blockedTime?: string;
  allDay: boolean;
  reason?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(blockedTimes).values({
    blockedDate: sql`${data.blockedDate}`,
    blockedTime: data.blockedTime,
    allDay: data.allDay,
    reason: data.reason,
  });
}

export async function deleteBlockedTime(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(blockedTimes).where(eq(blockedTimes.id, id));
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { todayCount: 0, pendingCount: 0, totalClients: 0, monthCount: 0 };

  const today = new Date().toISOString().split("T")[0]!;
  const firstOfMonth = today.substring(0, 7) + "-01";

  const [todayRows, pendingRows, clientRows, monthRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          sql`${appointments.appointmentDate} = ${today}`,
          sql`${appointments.status} != 'cancelled'`
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.status, "pending")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "user")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          sql`${appointments.appointmentDate} >= ${firstOfMonth}`,
          sql`${appointments.status} != 'cancelled'`
        )
      ),
  ]);

  return {
    todayCount: Number(todayRows[0]?.count ?? 0),
    pendingCount: Number(pendingRows[0]?.count ?? 0),
    totalClients: Number(clientRows[0]?.count ?? 0),
    monthCount: Number(monthRows[0]?.count ?? 0),
  };
}
