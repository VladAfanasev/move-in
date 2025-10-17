import {
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { profiles } from "./auth"

export const propertyStatus = pgEnum("property_status", [
  "available",
  "in_option",
  "sold",
  "archived",
])
export const propertyType = pgEnum("property_type", ["house", "apartment"])

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description"),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).notNull().default("Nederland"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  squareFeet: integer("square_feet"),
  lotSize: decimal("lot_size", { precision: 10, scale: 2 }),
  yearBuilt: integer("year_built"),
  propertyType: propertyType("property_type").notNull(),
  status: propertyStatus("status").notNull().default("available"),
  images: jsonb("images").$type<string[]>(),
  features: jsonb("features").$type<string[]>(),
  metadata: jsonb("metadata"),
  listedBy: uuid("listed_by")
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
