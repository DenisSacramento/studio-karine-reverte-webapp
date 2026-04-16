import "dotenv/config";
import { eq } from "drizzle-orm";
import { businessHours, services, type InsertService } from "../drizzle/schema";
import { getDb } from "./db";

type ServiceSeed = {
  name: string;
  price: string;
  durationMinutes: number;
  description: string;
};

const SERVICES_SEED: ServiceSeed[] = [
  { name: "Corte Simples", price: "35.00", durationMinutes: 45, description: "Corte tradicional" },
  { name: "Corte Long Bob/Chanel", price: "40.00", durationMinutes: 60, description: "Corte Long Bob ou Chanel" },
  { name: "Progressiva P e M", price: "150.00", durationMinutes: 180, description: "Progressiva para cabelo pequeno e medio" },
  { name: "Progressiva G", price: "200.00", durationMinutes: 240, description: "Progressiva para cabelo grande" },
  { name: "Coloracao + Hidratacao", price: "65.00", durationMinutes: 120, description: "Coloracao com hidratacao" },
  { name: "Escova Simples Mega Hair", price: "70.00", durationMinutes: 90, description: "Escova simples para mega hair" },
  { name: "Escova Mega Hair + Hidratacao", price: "80.00", durationMinutes: 120, description: "Escova com hidratacao para mega hair" },
  { name: "Hidroreconstrucao", price: "70.00", durationMinutes: 90, description: "Tratamento de hidroreconstrucao" },
  { name: "Hidronutricao + Finalizacao", price: "70.00", durationMinutes: 90, description: "Hidronutricao com finalizacao" },
  { name: "Escova + Hidratacao", price: "50.00", durationMinutes: 75, description: "Escova com hidratacao" },
  { name: "Escova Simples", price: "40.00", durationMinutes: 60, description: "Escova simples" },
  { name: "Botox (A partir de)", price: "90.00", durationMinutes: 120, description: "Botox capilar" },
  { name: "Reconstrucao", price: "80.00", durationMinutes: 90, description: "Reconstrucao capilar" },
  { name: "Selagem (A partir de)", price: "100.00", durationMinutes: 150, description: "Selagem capilar" },
  { name: "Cristalizacao", price: "75.00", durationMinutes: 90, description: "Cristalizacao capilar" },
  { name: "Cauterizacao", price: "80.00", durationMinutes: 90, description: "Cauterizacao capilar" },
  { name: "Cronograma Capilar (4 sessoes)", price: "200.00", durationMinutes: 120, description: "Pacote de 4 sessoes" },
];

async function seedServices() {
  const db = await getDb();
  if (!db) {
    throw new Error("Banco indisponivel. Verifique DATABASE_URL.");
  }

  let inserted = 0;
  let updated = 0;

  for (let index = 0; index < SERVICES_SEED.length; index++) {
    const item = SERVICES_SEED[index]!;
    const existing = await db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.name, item.name))
      .limit(1);

    const payload: Partial<InsertService> = {
      name: item.name,
      description: item.description,
      durationMinutes: item.durationMinutes,
      price: item.price,
      active: true,
      sortOrder: index,
    };

    if (existing.length > 0) {
      await db
        .update(services)
        .set(payload)
        .where(eq(services.id, existing[0].id));
      updated++;
    } else {
      await db.insert(services).values(payload as InsertService);
      inserted++;
    }
  }

  console.log(`[seed] services inseridos: ${inserted}, atualizados: ${updated}`);
}

async function seedBusinessHours() {
  const db = await getDb();
  if (!db) {
    throw new Error("Banco indisponivel. Verifique DATABASE_URL.");
  }

  let inserted = 0;
  let updated = 0;

  for (let day = 0; day <= 6; day++) {
    const isOpen = day >= 1 && day <= 6;

    const existing = await db
      .select({ id: businessHours.id })
      .from(businessHours)
      .where(eq(businessHours.dayOfWeek, day))
      .limit(1);

    const payload = {
      dayOfWeek: day,
      openTime: "08:00",
      closeTime: "18:00",
      isOpen,
    };

    if (existing.length > 0) {
      await db
        .update(businessHours)
        .set(payload)
        .where(eq(businessHours.id, existing[0].id));
      updated++;
    } else {
      await db.insert(businessHours).values(payload);
      inserted++;
    }
  }

  console.log(`[seed] business_hours inseridos: ${inserted}, atualizados: ${updated}`);
}

async function main() {
  await seedServices();
  await seedBusinessHours();
  console.log("[seed] concluido com sucesso");
}

main().catch((error) => {
  console.error("[seed] falhou:", error);
  process.exit(1);
});
