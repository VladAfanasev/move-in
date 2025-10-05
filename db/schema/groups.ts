import {
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { profiles } from "./auth"
import { properties } from "./properties"

export const groupStatus = pgEnum("group_status", [
  "forming",
  "active",
  "viewing",
  "offer_made",
  "closed",
  "disbanded",
])

export const memberRole = pgEnum("member_role", ["owner", "admin", "member"])

export const memberStatus = pgEnum("member_status", ["pending", "active", "left", "removed"])

// Buying groups for shared property purchases
export const buyingGroups = pgTable("buying_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetBudget: decimal("target_budget", { precision: 12, scale: 2 }),
  currentFunds: decimal("current_funds", { precision: 12, scale: 2 }).default("0"),
  targetLocation: varchar("target_location", { length: 500 }),
  preferredPropertyType: jsonb("preferred_property_type").$type<string[]>(),
  status: groupStatus("status").notNull().default("forming"),
  maxMembers: integer("max_members").default(10),
  metadata: jsonb("metadata"),
  createdBy: uuid("created_by")
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Group members
export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .references(() => buyingGroups.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    role: memberRole("role").notNull().default("member"),
    status: memberStatus("status").notNull().default("pending"),
    contributionAmount: decimal("contribution_amount", { precision: 12, scale: 2 }),
    ownershipPercentage: decimal("ownership_percentage", { precision: 5, scale: 2 }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
    metadata: jsonb("metadata"),
  },
  table => ({
    pk: primaryKey({ columns: [table.groupId, table.userId] }),
  }),
)

// Properties saved/favorited by groups
export const groupProperties = pgTable(
  "group_properties",
  {
    groupId: uuid("group_id")
      .references(() => buyingGroups.id, { onDelete: "cascade" })
      .notNull(),
    propertyId: uuid("property_id")
      .references(() => properties.id, { onDelete: "cascade" })
      .notNull(),
    addedBy: uuid("added_by")
      .references(() => profiles.id)
      .notNull(),
    notes: text("notes"),
    rating: integer("rating"), // 1-5 rating
    status: varchar("status", { length: 50 }).default("saved"), // saved, viewing_scheduled, viewed, offer_made, rejected
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.groupId, table.propertyId] }),
  }),
)
