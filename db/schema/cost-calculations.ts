import {
  decimal,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { profiles } from "./auth"
import { buyingGroups } from "./groups"
import { properties } from "./properties"

export const proposalStatus = pgEnum("proposal_status", [
  "draft",
  "submitted",
  "accepted",
  "rejected",
  "expired",
])

// Cost calculation sessions for specific properties in groups
export const costCalculations = pgTable("cost_calculations", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .references(() => buyingGroups.id, { onDelete: "cascade" })
    .notNull(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),
  createdBy: uuid("created_by")
    .references(() => profiles.id)
    .notNull(),

  // Property purchase details
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }).notNull(),

  // Additional costs
  notaryFees: decimal("notary_fees", { precision: 12, scale: 2 }).default("0"),
  transferTax: decimal("transfer_tax", { precision: 12, scale: 2 }).default("0"),
  renovationCosts: decimal("renovation_costs", { precision: 12, scale: 2 }).default("0"),
  brokerFees: decimal("broker_fees", { precision: 12, scale: 2 }).default("0"),
  inspectionCosts: decimal("inspection_costs", { precision: 12, scale: 2 }).default("0"),
  otherCosts: decimal("other_costs", { precision: 12, scale: 2 }).default("0"),

  // Financing details
  mortgageAmount: decimal("mortgage_amount", { precision: 12, scale: 2 }),
  mortgageInterestRate: decimal("mortgage_interest_rate", { precision: 5, scale: 3 }),
  mortgageTerm: integer("mortgage_term"), // in years

  // Total calculations
  totalCosts: decimal("total_costs", { precision: 12, scale: 2 }).notNull(),
  totalEquityNeeded: decimal("total_equity_needed", { precision: 12, scale: 2 }).notNull(),

  // Session metadata
  title: varchar("title", { length: 255 }),
  notes: text("notes"),
  isActive: text("is_active").default("true"), // Using text for boolean to avoid migration issues
  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Member investment proposals for cost calculations
export const memberProposals = pgTable(
  "member_proposals",
  {
    calculationId: uuid("calculation_id")
      .references(() => costCalculations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),

    // Investment proposal
    investmentAmount: decimal("investment_amount", { precision: 12, scale: 2 }).notNull(),
    investmentPercentage: decimal("investment_percentage", { precision: 5, scale: 2 }).notNull(),

    // Optional member details
    notes: text("notes"),
    maxInvestment: decimal("max_investment", { precision: 12, scale: 2 }),
    preferredInvestment: decimal("preferred_investment", { precision: 12, scale: 2 }),

    status: proposalStatus("status").notNull().default("draft"),

    submittedAt: timestamp("submitted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.calculationId, table.userId] }),
  }),
)

// Comments on cost calculations for group discussion
export const calculationComments = pgTable("calculation_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  calculationId: uuid("calculation_id")
    .references(() => costCalculations.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),

  content: text("content").notNull(),
  isSystemMessage: text("is_system_message").default("false"), // Using text for boolean

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
