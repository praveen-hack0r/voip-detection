import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// VoIP traces schema for storing call data
export const voipTraces = pgTable("voip_traces", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  type: text("type").notNull(), // "VoIP", "Virtual", "Suspicious", etc.
  originLocation: text("origin_location").notNull(),
  destinationLocation: text("destination_location").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  duration: integer("duration").notNull(), // in seconds
  serviceProvider: text("service_provider"),
  riskScore: integer("risk_score"), // 0-100
});

export const insertVoipTraceSchema = createInsertSchema(voipTraces).omit({
  id: true,
});

// Packet data schema
export const packetData = pgTable("packet_data", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  protocol: text("protocol").notNull(),
  info: text("info").notNull(),
  rawData: jsonb("raw_data"), // Store complete packet data
});

export const insertPacketDataSchema = createInsertSchema(packetData).omit({
  id: true,
});

// Number metadata schema
export const numberMetadata = pgTable("number_metadata", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  type: text("type").notNull(), // "VoIP", "Virtual", "Suspicious", etc.
  provider: text("provider"),
  location: text("location"),
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  riskScore: integer("risk_score"), // 0-100
  metadata: jsonb("metadata"), // Additional metadata
});

export const insertNumberMetadataSchema = createInsertSchema(numberMetadata).omit({
  id: true,
});

// API services status
export const apiServices = pgTable("api_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  status: text("status").notNull(), // "Operational", "Degraded", "Down"
  quotaRemaining: integer("quota_remaining"), // percentage
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertApiServiceSchema = createInsertSchema(apiServices).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type VoipTrace = typeof voipTraces.$inferSelect;
export type InsertVoipTrace = z.infer<typeof insertVoipTraceSchema>;

export type PacketData = typeof packetData.$inferSelect;
export type InsertPacketData = z.infer<typeof insertPacketDataSchema>;

export type NumberMetadata = typeof numberMetadata.$inferSelect;
export type InsertNumberMetadata = z.infer<typeof insertNumberMetadataSchema>;

export type ApiService = typeof apiServices.$inferSelect;
export type InsertApiService = z.infer<typeof insertApiServiceSchema>;
