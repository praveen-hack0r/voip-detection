import {
  users, type User, type InsertUser,
  voipTraces, type VoipTrace, type InsertVoipTrace,
  packetData, type PacketData, type InsertPacketData,
  numberMetadata, type NumberMetadata, type InsertNumberMetadata,
  apiServices, type ApiService, type InsertApiService
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";


export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // VoIP trace operations
  getVoipTraces(): Promise<VoipTrace[]>;
  getVoipTraceById(id: number): Promise<VoipTrace | undefined>;
  createVoipTrace(trace: InsertVoipTrace): Promise<VoipTrace>;
  
  // Packet data operations
  getPacketData(): Promise<PacketData[]>;
  getPacketDataById(id: number): Promise<PacketData | undefined>;
  createPacketData(packet: InsertPacketData): Promise<PacketData>;
  
  // Number metadata operations
  getNumberMetadata(): Promise<NumberMetadata[]>;
  getNumberMetadataByNumber(phoneNumber: string): Promise<NumberMetadata | undefined>;
  createNumberMetadata(metadata: InsertNumberMetadata): Promise<NumberMetadata>;
  updateNumberMetadata(phoneNumber: string, metadata: Partial<NumberMetadata>): Promise<NumberMetadata>;
  
  // API service operations
  getApiServices(): Promise<ApiService[]>;
  getApiServiceByName(name: string): Promise<ApiService | undefined>;
  createApiService(service: InsertApiService): Promise<ApiService>;
  updateApiService(name: string, service: Partial<ApiService>): Promise<ApiService | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize default API services if they don't exist
    this.initializeApiServices();
  }

  private async initializeApiServices() {
    const existingServices = await this.getApiServices();
    
    if (existingServices.length === 0) {
      const defaultServices = [
        {
          name: "Phone Lookup API",
          status: "Operational",
          quotaRemaining: 85,
          lastUpdated: new Date()
        },
        {
          name: "IP Geolocation API",
          status: "Operational",
          quotaRemaining: 62,
          lastUpdated: new Date()
        },
        {
          name: "WHOIS API",
          status: "Degraded",
          quotaRemaining: 98,
          lastUpdated: new Date()
        },
        {
          name: "Scapy Interface",
          status: "Operational",
          quotaRemaining: 100,
          lastUpdated: new Date()
        }
      ];

      for (const service of defaultServices) {
        await this.createApiService(service);
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // VoIP trace operations
  async getVoipTraces(): Promise<VoipTrace[]> {
    return db.select().from(voipTraces).orderBy(voipTraces.timestamp);
  }

  async getVoipTraceById(id: number): Promise<VoipTrace | undefined> {
    const [trace] = await db.select().from(voipTraces).where(eq(voipTraces.id, id));
    return trace;
  }

  async createVoipTrace(insertTrace: InsertVoipTrace): Promise<VoipTrace> {
    const values = {
      ...insertTrace,
      timestamp: insertTrace.timestamp || new Date()
    };
    const [trace] = await db.insert(voipTraces).values(values).returning();
    return trace;
  }

  // Packet data operations
  async getPacketData(): Promise<PacketData[]> {
    return db.select().from(packetData).orderBy(packetData.timestamp);
  }

  async getPacketDataById(id: number): Promise<PacketData | undefined> {
    const [packet] = await db.select().from(packetData).where(eq(packetData.id, id));
    return packet;
  }

  async createPacketData(insertPacket: InsertPacketData): Promise<PacketData> {
    const values = {
      ...insertPacket,
      timestamp: insertPacket.timestamp || new Date()
    };
    const [packet] = await db.insert(packetData).values(values).returning();
    return packet;
  }

  // Number metadata operations
  async getNumberMetadata(): Promise<NumberMetadata[]> {
    return db.select().from(numberMetadata);
  }

  async getNumberMetadataByNumber(phoneNumber: string): Promise<NumberMetadata | undefined> {
    const [metadata] = await db
      .select()
      .from(numberMetadata)
      .where(eq(numberMetadata.phoneNumber, phoneNumber));
    return metadata;
  }

  async createNumberMetadata(insertMetadata: InsertNumberMetadata): Promise<NumberMetadata> {
    // Check if the number already exists
    const existing = await this.getNumberMetadataByNumber(insertMetadata.phoneNumber);
    
    if (existing) {
      // Update the existing record with last seen time
      const updated = await this.updateNumberMetadata(insertMetadata.phoneNumber, {
        ...insertMetadata,
        lastSeen: new Date()
      });
      
      if (!updated) {
        throw new Error(`Failed to update metadata for phone number ${insertMetadata.phoneNumber}`);
      }
      
      return updated;
    }
    
    // Create a new record with default timestamps
    const now = new Date();
    const values = {
      ...insertMetadata,
      firstSeen: insertMetadata.firstSeen || now,
      lastSeen: insertMetadata.lastSeen || now,
      // Ensure all required fields have values
      riskScore: insertMetadata.riskScore ?? null,
      provider: insertMetadata.provider ?? null,
      location: insertMetadata.location ?? null,
      metadata: insertMetadata.metadata ?? {}
    };
    
    const [metadata] = await db.insert(numberMetadata).values(values).returning();
    return metadata;
  }

  async updateNumberMetadata(phoneNumber: string, partialMetadata: Partial<NumberMetadata>): Promise<NumberMetadata> {
    const [metadata] = await db
      .update(numberMetadata)
      .set(partialMetadata)
      .where(eq(numberMetadata.phoneNumber, phoneNumber))
      .returning();
      
    if (!metadata) {
      throw new Error(`Phone number ${phoneNumber} not found for update`);
    }
    
    return metadata;
  }

  // API service operations
  async getApiServices(): Promise<ApiService[]> {
    return db.select().from(apiServices);
  }

  async getApiServiceByName(name: string): Promise<ApiService | undefined> {
    const [service] = await db
      .select()
      .from(apiServices)
      .where(eq(apiServices.name, name));
    return service;
  }

  async createApiService(insertService: InsertApiService): Promise<ApiService> {
    const values = {
      ...insertService,
      lastUpdated: insertService.lastUpdated || new Date(),
      quotaRemaining: insertService.quotaRemaining ?? null
    };
    const [service] = await db.insert(apiServices).values(values).returning();
    return service;
  }

  async updateApiService(name: string, partialService: Partial<ApiService>): Promise<ApiService | undefined> {
    const [service] = await db
      .update(apiServices)
      .set(partialService)
      .where(eq(apiServices.name, name))
      .returning();
    return service;
  }
}

export const storage = new DatabaseStorage();
