import { 
  users, messages, resources, 
  type User, type InsertUser, 
  type Message, type InsertMessage, 
  type Resource, type InsertResource
} from "@shared/schema";
import { compare, hash } from "./chatbot";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Import pg Pool for the session store
import { pool } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message operations
  getMessagesByUserId(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Resource operations
  getAllResources(): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Create session store using PostgreSQL
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Initialize with sample resources (only if not already present)
    this.initializeResources();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await hash(insertUser.password);
    
    // Create user with hashed password
    const [user] = await db.insert(users).values({
      ...insertUser,
      // Make username and email lowercase for easier matching
      username: insertUser.username.toLowerCase(),
      email: insertUser.email.toLowerCase(),
      password: hashedPassword
    }).returning();
    
    return user;
  }

  // Message operations
  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values({
      userId: insertMessage.userId as number,
      content: insertMessage.content,
      isBot: insertMessage.isBot || "false"
    }).returning();
    
    return message;
  }

  // Resource operations
  async getAllResources(): Promise<Resource[]> {
    return await db.select().from(resources);
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources)
      .values(insertResource)
      .returning();
    
    return resource;
  }

  // Initialize with predefined resources if none exist
  private async initializeResources(): Promise<void> {
    // Check if resources already exist
    const existingResources = await this.getAllResources();
    
    if (existingResources.length === 0) {
      // Add default resources if none exist
      const defaultResources: InsertResource[] = [
        {
          title: "Understanding Mental Health vs Mental Illness",
          description: "Learn the difference between mental health and mental illness",
          icon: "article-line",
          url: "/resources/mental-health-vs-illness"
        },
        {
          title: "Crisis Support Hotlines",
          description: "Emergency hotlines for immediate mental health support",
          icon: "first-aid-kit-line",
          url: "/resources/crisis-hotlines"
        },
        {
          title: "Coping Strategies for Stress",
          description: "Effective techniques to manage stress in daily life",
          icon: "mental-health-line",
          url: "/resources/coping-strategies"
        },
        {
          title: "Self-care Techniques",
          description: "Practical self-care approaches for better mental wellbeing",
          icon: "heart-pulse-line",
          url: "/resources/self-care"
        }
      ];

      for (const resource of defaultResources) {
        await this.createResource(resource);
      }
      
      console.log("Initialized default resources");
    }
  }
}

// Use the database storage
export const storage = new DatabaseStorage();
