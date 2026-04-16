import { relations } from "drizzle-orm";
import { offers, services } from "./schema";

export const servicesRelations = relations(services, ({ many }) => ({
	offers: many(offers),
}));

export const offersRelations = relations(offers, ({ one }) => ({
	service: one(services, {
		fields: [offers.serviceId],
		references: [services.id],
	}),
}));
