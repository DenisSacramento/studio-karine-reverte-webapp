import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  date,
  time,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  birthDate: date("birthDate"),
  notes: text("notes"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Serviços ────────────────────────────────────────────────────────────────
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  durationMinutes: int("durationMinutes").notNull().default(60),
  price: decimal("price", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  active: boolean("active").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── Agendamentos ─────────────────────────────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  serviceId: int("serviceId").notNull(),
  appointmentDate: date("appointmentDate").notNull(),
  appointmentTime: time("appointmentTime").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"])
    .notNull()
    .default("pending"),
  clientNotes: text("clientNotes"),
  adminNotes: text("adminNotes"),
  reminderSent: boolean("reminderSent").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ─── Ofertas e Novidades ──────────────────────────────────────────────────────
export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  type: mysqlEnum("type", ["offer", "news"]).notNull().default("offer"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("publishedAt"),
  expiresAt: timestamp("expiresAt"),
  notificationSent: boolean("notificationSent").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = typeof offers.$inferInsert;

// ─── Horários de Funcionamento ────────────────────────────────────────────────
export const businessHours = mysqlTable("business_hours", {
  id: int("id").autoincrement().primaryKey(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Dom, 1=Seg, ..., 6=Sáb
  openTime: time("openTime").notNull(),
  closeTime: time("closeTime").notNull(),
  isOpen: boolean("isOpen").notNull().default(true),
});

export type BusinessHour = typeof businessHours.$inferSelect;

// ─── Horários Bloqueados ──────────────────────────────────────────────────────
export const blockedTimes = mysqlTable("blocked_times", {
  id: int("id").autoincrement().primaryKey(),
  blockedDate: date("blockedDate").notNull(),
  blockedTime: time("blockedTime"),
  allDay: boolean("allDay").notNull().default(false),
  reason: varchar("reason", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockedTime = typeof blockedTimes.$inferSelect;
