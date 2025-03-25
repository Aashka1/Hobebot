import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { compare, generateResponse } from "./chatbot";
import { insertUserSchema, loginUserSchema, insertMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import session from "express-session";

// Extend the Express session interface to include userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware using PostgreSQL session store
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "hopebot-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production", 
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      },
      // Use the PostgreSQL session store from storage
      store: storage.sessionStore
    })
  );

  // Check authentication status
  app.get("/api/auth/status", (req, res) => {
    if (req.session.userId) {
      res.json({ authenticated: true, userId: req.session.userId });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({
          message: "Email already in use"
        });
      }
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({
          message: "Username already taken"
        });
      }
      
      // Create user
      const user = await storage.createUser(userData);
      
      // Store user ID in session
      req.session.userId = user.id;
      
      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Invalid input data",
          errors: error.errors
        });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({
          message: "Failed to register user"
        });
      }
    }
  });

  // Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginUserSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }
      
      // Verify password
      const passwordValid = await compare(user.password, loginData.password);
      if (!passwordValid) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }
      
      // Store user ID in session
      req.session.userId = user.id;
      
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Invalid input data",
          errors: error.errors
        });
      } else {
        console.error("Login error:", error);
        res.status(500).json({
          message: "Failed to login"
        });
      }
    }
  });

  // Logout user
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({
          message: "Failed to logout"
        });
      }
      
      res.json({
        message: "Logout successful"
      });
    });
  });

  // Get current user
  app.get("/api/users/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email
    });
  });

  // Get chat history
  app.get("/api/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }
    
    const messages = await storage.getMessagesByUserId(req.session.userId);
    res.json(messages);
  });
  
  // Get conversation history grouped by date
  app.get("/api/conversations", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }
    
    try {
      // Get all messages for the user
      const allMessages = await storage.getMessagesByUserId(req.session.userId);
      
      // Group messages by date
      const conversations = groupMessagesByDate(allMessages);
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({
        message: "Failed to fetch conversation history"
      });
    }
  });
  
  // Helper function to group messages by date
  function groupMessagesByDate(messages: Array<any>) {
    // Create a map to store conversations by date
    const conversationMap = new Map();
    
    // Group messages by date (based on createdAt)
    messages.forEach(message => {
      const createdAt = new Date(message.createdAt);
      const dateStr = createdAt.toLocaleDateString(); // Use local date format
      
      if (!conversationMap.has(dateStr)) {
        conversationMap.set(dateStr, []);
      }
      
      conversationMap.get(dateStr).push(message);
    });
    
    // Convert map to array format expected by frontend
    const result = [];
    
    // Convert map entries to array first to avoid iterator issues
    const entries = Array.from(conversationMap.entries());
    
    for (const [date, msgs] of entries) {
      // For each date, include a representative message (first message)
      if (msgs.length > 0) {
        let dateLabel = date;
        
        // Check if date is today
        const today = new Date().toLocaleDateString();
        if (date === today) {
          dateLabel = "Today";
        }
        // Check if date is yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (date === yesterday.toLocaleDateString()) {
          dateLabel = "Yesterday";
        }
        
        result.push({
          date: dateLabel,
          messages: msgs
        });
      }
    }
    
    // Sort by date (most recent first)
    result.sort((a, b) => {
      if (a.date === "Today") return -1;
      if (b.date === "Today") return 1;
      if (a.date === "Yesterday") return -1;
      if (b.date === "Yesterday") return 1;
      
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    return result;
  }

  // Send message and get response
  app.post("/api/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }
    
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== "string" || content.trim() === "") {
        return res.status(400).json({
          message: "Message content is required"
        });
      }
      
      // Save user message
      const userMessage = {
        userId: req.session.userId,
        content,
        isBot: "false"
      };
      
      await storage.createMessage(userMessage);
      
      // Generate bot response - now asynchronous
      const botResponse = await generateResponse(content);
      
      // Save bot message
      const botMessage = {
        userId: req.session.userId,
        content: botResponse,
        isBot: "true"
      };
      
      const savedBotMessage = await storage.createMessage(botMessage);
      
      res.json({
        message: "Message sent successfully",
        response: savedBotMessage
      });
    } catch (error) {
      console.error("Message error:", error);
      res.status(500).json({
        message: "Failed to process message"
      });
    }
  });

  // Get resources
  app.get("/api/resources", async (_req, res) => {
    const resources = await storage.getAllResources();
    res.json(resources);
  });

  const httpServer = createServer(app);
  return httpServer;
}
