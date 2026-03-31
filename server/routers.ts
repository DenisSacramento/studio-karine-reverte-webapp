import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAppointment,
  createBlockedTime,
  createOffer,
  createService,
  deleteBlockedTime,
  getAllAppointments,
  getAllUsers,
  getAppointmentById,
  getAppointmentsByUser,
  getBlockedTimes,
  getBookedTimesForDate,
  getBusinessHours,
  getDashboardStats,
  getOfferById,
  getOffers,
  getServiceById,
  getServices,
  getUnnotifiedPublishedOffers,
  markReminderSent,
  updateAppointmentStatus,
  updateBusinessHour,
  updateOffer,
  updateService,
  updateUserProfile,
  getAppointmentsDueForReminder,
  getDb,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ─── Email helper ─────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!apiUrl || !apiKey) return false;
  try {
    const res = await fetch(`${apiUrl}/v1/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function appointmentConfirmationEmail(data: {
  clientName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
}) {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fff8f9; padding: 32px; border-radius: 12px; border: 1px solid #f0c4d4;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #8b1a4a; font-size: 24px; margin: 0;">Studio Karine Reverte</h1>
        <p style="color: #c0174a; margin: 4px 0; font-style: italic;">Seu salão de beleza de confiança</p>
      </div>
      <h2 style="color: #8b1a4a; font-size: 18px;">Agendamento Confirmado! ✨</h2>
      <p style="color: #444;">Olá, <strong>${data.clientName}</strong>!</p>
      <p style="color: #444;">Seu agendamento foi recebido com sucesso. Aguardamos você!</p>
      <div style="background: #fff; border: 1px solid #f0c4d4; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0; color: #444;"><strong>Serviço:</strong> ${data.serviceName}</p>
        <p style="margin: 4px 0; color: #444;"><strong>Data:</strong> ${data.appointmentDate}</p>
        <p style="margin: 4px 0; color: #444;"><strong>Horário:</strong> ${data.appointmentTime}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Em caso de dúvidas, entre em contato pelo WhatsApp: <strong>(11) 91092-8534</strong></p>
      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0c4d4;">
        <p style="color: #c0174a; font-size: 12px;">Travessa Nicola de Giosa, 37 — Itaim Paulista, São Paulo</p>
      </div>
    </div>
  `;
}

function appointmentReminderEmail(data: {
  clientName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
}) {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fff8f9; padding: 32px; border-radius: 12px; border: 1px solid #f0c4d4;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #8b1a4a; font-size: 24px; margin: 0;">Studio Karine Reverte</h1>
        <p style="color: #c0174a; margin: 4px 0; font-style: italic;">Seu salão de beleza de confiança</p>
      </div>
      <h2 style="color: #8b1a4a; font-size: 18px;">Lembrete de Agendamento 💅</h2>
      <p style="color: #444;">Olá, <strong>${data.clientName}</strong>!</p>
      <p style="color: #444;">Este é um lembrete do seu agendamento <strong>amanhã</strong>. Não se esqueça!</p>
      <div style="background: #fff; border: 1px solid #f0c4d4; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0; color: #444;"><strong>Serviço:</strong> ${data.serviceName}</p>
        <p style="margin: 4px 0; color: #444;"><strong>Data:</strong> ${data.appointmentDate}</p>
        <p style="margin: 4px 0; color: #444;"><strong>Horário:</strong> ${data.appointmentTime}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Precisa reagendar? Entre em contato pelo WhatsApp: <strong>(11) 91092-8534</strong></p>
      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0c4d4;">
        <p style="color: #c0174a; font-size: 12px;">Travessa Nicola de Giosa, 37 — Itaim Paulista, São Paulo</p>
      </div>
    </div>
  `;
}

function newOfferEmail(data: { clientName: string; offerTitle: string; offerContent: string; type: string }) {
  const typeLabel = data.type === "offer" ? "Nova Oferta Especial" : "Novidade do Studio";
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fff8f9; padding: 32px; border-radius: 12px; border: 1px solid #f0c4d4;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #8b1a4a; font-size: 24px; margin: 0;">Studio Karine Reverte</h1>
        <p style="color: #c0174a; margin: 4px 0; font-style: italic;">Seu salão de beleza de confiança</p>
      </div>
      <h2 style="color: #8b1a4a; font-size: 18px;">🌸 ${typeLabel}: ${data.offerTitle}</h2>
      <p style="color: #444;">Olá, <strong>${data.clientName}</strong>!</p>
      <div style="background: #fff; border: 1px solid #f0c4d4; border-radius: 8px; padding: 16px; margin: 20px 0; color: #444;">
        ${data.offerContent}
      </div>
      <p style="color: #666; font-size: 14px;">Aproveite! Agende pelo WhatsApp: <strong>(11) 91092-8534</strong></p>
      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0c4d4;">
        <p style="color: #c0174a; font-size: 12px;">Travessa Nicola de Giosa, 37 — Itaim Paulista, São Paulo</p>
      </div>
    </div>
  `;
}

// ─── Routers ──────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Services ───────────────────────────────────────────────────────────────
  services: router({
    list: publicProcedure
      .input(z.object({ all: z.boolean().optional() }).optional())
      .query(({ input }) => getServices(!input?.all)),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getServiceById(input.id)),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          durationMinutes: z.number().int().min(15),
          price: z.string().optional(),
          imageUrl: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => createService(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          durationMinutes: z.number().optional(),
          price: z.string().optional(),
          imageUrl: z.string().optional(),
          active: z.boolean().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateService(id, data);
      }),
  }),

  // ─── Appointments ────────────────────────────────────────────────────────────
  appointments: router({
    availableSlots: publicProcedure
      .input(z.object({ date: z.string(), serviceId: z.number() }))
      .query(async ({ input }) => {
        const [hours, booked, blocked, service] = await Promise.all([
          getBusinessHours(),
          getBookedTimesForDate(input.date),
          getBlockedTimes(input.date, input.date),
          getServiceById(input.serviceId),
        ]);

        const dateObj = new Date(input.date + "T12:00:00");
        const dayOfWeek = dateObj.getDay();
        const dayHours = hours.find((h) => h.dayOfWeek === dayOfWeek);

        if (!dayHours || !dayHours.isOpen) return [];

        const allDayBlocked = blocked.some((b) => b.allDay);
        if (allDayBlocked) return [];

        const blockedSpecific = blocked.filter((b) => !b.allDay).map((b) => b.blockedTime);
        const serviceDuration = service?.durationMinutes ?? 60;

        const [openH, openM] = dayHours.openTime.split(":").map(Number);
        const [closeH, closeM] = dayHours.closeTime.split(":").map(Number);
        const openMinutes = (openH ?? 9) * 60 + (openM ?? 0);
        const closeMinutes = (closeH ?? 19) * 60 + (closeM ?? 0);

        const slots: string[] = [];
        for (let m = openMinutes; m + serviceDuration <= closeMinutes; m += 30) {
          const h = Math.floor(m / 60);
          const min = m % 60;
          const timeStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

          const isBlocked = blockedSpecific.includes(timeStr);
          const isBooked = booked.some((b) => {
            const [bh, bm] = (b.appointmentTime as string).split(":").map(Number);
            const bookedStart = (bh ?? 0) * 60 + (bm ?? 0);
            const bookedEnd = bookedStart + (b.serviceDuration ?? 60);
            return m < bookedEnd && m + serviceDuration > bookedStart;
          });

          if (!isBlocked && !isBooked) slots.push(timeStr);
        }
        return slots;
      }),

    create: protectedProcedure
      .input(
        z.object({
          serviceId: z.number(),
          appointmentDate: z.string(),
          appointmentTime: z.string(),
          clientNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createAppointment({ ...input, userId: ctx.user.id });

        // Send confirmation email
        const service = await getServiceById(input.serviceId);
        if (ctx.user.email && service) {
          const dateFormatted = new Date(input.appointmentDate + "T12:00:00").toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          await sendEmail(
            ctx.user.email,
            "Agendamento recebido — Studio Karine Reverte",
            appointmentConfirmationEmail({
              clientName: ctx.user.name ?? "Cliente",
              serviceName: service.name,
              appointmentDate: dateFormatted,
              appointmentTime: input.appointmentTime,
            })
          );
        }

        await notifyOwner({
          title: "Novo agendamento",
          content: `${ctx.user.name ?? "Cliente"} agendou ${service?.name ?? "serviço"} para ${input.appointmentDate} às ${input.appointmentTime}`,
        });

        return { success: true };
      }),

    myList: protectedProcedure.query(({ ctx }) => getAppointmentsByUser(ctx.user.id)),

    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const appt = await getAppointmentById(input.id);
        if (!appt) throw new TRPCError({ code: "NOT_FOUND" });
        if (appt.userId !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        await updateAppointmentStatus(input.id, "cancelled");
        return { success: true };
      }),

    // Admin routes
    adminList: adminProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(({ input }) => getAllAppointments(input.date)),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateAppointmentStatus(input.id, input.status, input.adminNotes);

        if (input.status === "confirmed") {
          const appt = await getAppointmentById(input.id);
          if (appt?.clientEmail) {
            const dateFormatted = new Date(
              (appt.appointmentDate as unknown as string) + "T12:00:00"
            ).toLocaleDateString("pt-BR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            await sendEmail(
              appt.clientEmail,
              "Agendamento confirmado — Studio Karine Reverte",
              appointmentConfirmationEmail({
                clientName: appt.clientName ?? "Cliente",
                serviceName: appt.serviceName,
                appointmentDate: dateFormatted,
                appointmentTime: appt.appointmentTime as string,
              })
            );
          }
        }
        return { success: true };
      }),

    sendReminders: adminProcedure.mutation(async () => {
      const due = await getAppointmentsDueForReminder();
      let sent = 0;
      for (const appt of due) {
        if (appt.clientEmail) {
          const dateFormatted = new Date(
            (appt.appointmentDate as unknown as string) + "T12:00:00"
          ).toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const ok = await sendEmail(
            appt.clientEmail,
            "Lembrete de agendamento — Studio Karine Reverte",
            appointmentReminderEmail({
              clientName: appt.clientName ?? "Cliente",
              serviceName: appt.serviceName,
              appointmentDate: dateFormatted,
              appointmentTime: appt.appointmentTime as string,
            })
          );
          if (ok) {
            await markReminderSent(appt.id);
            sent++;
          }
        }
      }
      return { sent };
    }),
  }),

  // ─── Offers ──────────────────────────────────────────────────────────────────
  offers: router({
    list: publicProcedure
      .input(z.object({ all: z.boolean().optional() }).optional())
      .query(({ input }) => getOffers(!input?.all)),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getOfferById(input.id)),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          content: z.string().min(1),
          imageUrl: z.string().optional(),
          type: z.enum(["offer", "news"]),
          expiresAt: z.date().optional(),
        })
      )
      .mutation(({ input }) => createOffer(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          content: z.string().optional(),
          imageUrl: z.string().optional(),
          type: z.enum(["offer", "news"]).optional(),
          expiresAt: z.date().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateOffer(id, data);
      }),

    publish: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateOffer(input.id, { published: true, publishedAt: new Date() });

        // Send email to all clients
        const [offer, allUsers] = await Promise.all([getOfferById(input.id), getAllUsers()]);
        if (offer) {
          const emailPromises = allUsers
            .filter((u) => u.email)
            .map((u) =>
              sendEmail(
                u.email!,
                `${offer.type === "offer" ? "Oferta especial" : "Novidade"}: ${offer.title} — Studio Karine Reverte`,
                newOfferEmail({
                  clientName: u.name ?? "Cliente",
                  offerTitle: offer.title,
                  offerContent: offer.content,
                  type: offer.type,
                })
              )
            );
          await Promise.allSettled(emailPromises);
          await updateOffer(input.id, { notificationSent: true });
        }

        return { success: true };
      }),

    unpublish: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => updateOffer(input.id, { published: false })),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return;
        const { offers: offersTable } = await import("../drizzle/schema");
        await db.delete(offersTable).where(eq(offersTable.id, input.id));
        return { success: true };
      }),
  }),

  // ─── Users / Profile ─────────────────────────────────────────────────────────
  profile: router({
    update: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          birthDate: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(() => getDashboardStats()),

    clients: adminProcedure.query(() => getAllUsers()),

    businessHours: adminProcedure.query(() => getBusinessHours()),

    updateBusinessHour: adminProcedure
      .input(
        z.object({
          id: z.number(),
          openTime: z.string().optional(),
          closeTime: z.string().optional(),
          isOpen: z.boolean().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateBusinessHour(id, data);
      }),

    blockedTimes: adminProcedure
      .input(z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }).optional())
      .query(({ input }) => getBlockedTimes(input?.dateFrom, input?.dateTo)),

    createBlockedTime: adminProcedure
      .input(
        z.object({
          blockedDate: z.string(),
          blockedTime: z.string().optional(),
          allDay: z.boolean(),
          reason: z.string().optional(),
        })
      )
      .mutation(({ input }) => createBlockedTime(input)),

    deleteBlockedTime: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteBlockedTime(input.id)),

    updateUserRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return;
        await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
