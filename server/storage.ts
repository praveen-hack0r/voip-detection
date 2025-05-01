import {
  users, type User, type InsertUser,
  voipTraces, type VoipTrace, type InsertVoipTrace,
  packetData, type PacketData, type InsertPacketData,
  numberMetadata, type NumberMetadata, type InsertNumberMetadata,
  apiServices, type ApiService, type InsertApiService
} from "@shared/schema";

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
  updateNumberMetadata(phoneNumber: string, metadata: Partial<NumberMetadata>): Promise<NumberMetadata | undefined>;
  
  // API service operations
  getApiServices(): Promise<ApiService[]>;
  getApiServiceByName(name: string): Promise<ApiService | undefined>;
  createApiService(service: InsertApiService): Promise<ApiService>;
  updateApiService(name: string, service: Partial<ApiService>): Promise<ApiService | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private voipTraces: Map<number, VoipTrace>;
  private packetData: Map<number, PacketData>;
  private numberMetadata: Map<number, NumberMetadata>;
  private apiServices: Map<number, ApiService>;
  
  currentUserId: number;
  currentVoipTraceId: number;
  currentPacketDataId: number;
  currentNumberMetadataId: number;
  currentApiServiceId: number;

  constructor() {
    this.users = new Map();
    this.voipTraces = new Map();
    this.packetData = new Map();
    this.numberMetadata = new Map();
    this.apiServices = new Map();
    
    this.currentUserId = 1;
    this.currentVoipTraceId = 1;
    this.currentPacketDataId = 1;
    this.currentNumberMetadataId = 1;
    this.currentApiServiceId = 1;
    
    // Initialize with default API services
    this.initializeApiServices();
  }

  private initializeApiServices() {
    const services = [
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

    services.forEach(service => {
      this.createApiService(service);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // VoIP trace operations
  async getVoipTraces(): Promise<VoipTrace[]> {
    return Array.from(this.voipTraces.values());
  }

  async getVoipTraceById(id: number): Promise<VoipTrace | undefined> {
    return this.voipTraces.get(id);
  }

  async createVoipTrace(insertTrace: InsertVoipTrace): Promise<VoipTrace> {
    const id = this.currentVoipTraceId++;
    const trace: VoipTrace = { ...insertTrace, id };
    this.voipTraces.set(id, trace);
    return trace;
  }

  // Packet data operations
  async getPacketData(): Promise<PacketData[]> {
    return Array.from(this.packetData.values());
  }

  async getPacketDataById(id: number): Promise<PacketData | undefined> {
    return this.packetData.get(id);
  }

  async createPacketData(insertPacket: InsertPacketData): Promise<PacketData> {
    const id = this.currentPacketDataId++;
    const packet: PacketData = { ...insertPacket, id };
    this.packetData.set(id, packet);
    return packet;
  }

  // Number metadata operations
  async getNumberMetadata(): Promise<NumberMetadata[]> {
    return Array.from(this.numberMetadata.values());
  }

  async getNumberMetadataByNumber(phoneNumber: string): Promise<NumberMetadata | undefined> {
    return Array.from(this.numberMetadata.values()).find(
      (metadata) => metadata.phoneNumber === phoneNumber,
    );
  }

  async createNumberMetadata(insertMetadata: InsertNumberMetadata): Promise<NumberMetadata> {
    const id = this.currentNumberMetadataId++;
    const metadata: NumberMetadata = { ...insertMetadata, id };
    this.numberMetadata.set(id, metadata);
    return metadata;
  }

  async updateNumberMetadata(phoneNumber: string, partialMetadata: Partial<NumberMetadata>): Promise<NumberMetadata | undefined> {
    const metadata = await this.getNumberMetadataByNumber(phoneNumber);
    if (!metadata) return undefined;

    const updatedMetadata: NumberMetadata = { ...metadata, ...partialMetadata };
    this.numberMetadata.set(metadata.id, updatedMetadata);
    return updatedMetadata;
  }

  // API service operations
  async getApiServices(): Promise<ApiService[]> {
    return Array.from(this.apiServices.values());
  }

  async getApiServiceByName(name: string): Promise<ApiService | undefined> {
    return Array.from(this.apiServices.values()).find(
      (service) => service.name === name,
    );
  }

  async createApiService(insertService: InsertApiService): Promise<ApiService> {
    const id = this.currentApiServiceId++;
    const service: ApiService = { ...insertService, id };
    this.apiServices.set(id, service);
    return service;
  }

  async updateApiService(name: string, partialService: Partial<ApiService>): Promise<ApiService | undefined> {
    const service = await this.getApiServiceByName(name);
    if (!service) return undefined;

    const updatedService: ApiService = { ...service, ...partialService };
    this.apiServices.set(service.id, updatedService);
    return updatedService;
  }
}

export const storage = new MemStorage();
