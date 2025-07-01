import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertFamilyMemberSchema, insertMediaSchema, insertJournalEntrySchema,
  insertTaskSchema, insertEventSchema, insertPhotoSchema, insertBookmarkSchema,
  insertPlaceSchema, insertQuoteSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User/Auth routes
  app.get("/api/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });

  app.post("/api/users/:id/login", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { pin } = req.body;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check PIN if required
      if (user.pin && user.pin !== pin) {
        return res.status(401).json({ message: "Invalid PIN" });
      }

      // Update last login and set active
      const updatedUser = await storage.updateUser(id, { 
        lastLogin: new Date(), 
        isActive: true 
      });
      
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Login failed", error });
    }
  });

  // Family Members routes
  app.get("/api/family/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const members = await storage.getFamilyMembers(userId);
    res.json(members);
  });

  app.post("/api/family", async (req, res) => {
    try {
      const memberData = insertFamilyMemberSchema.parse(req.body);
      const member = await storage.createFamilyMember(memberData);
      res.json(member);
    } catch (error) {
      res.status(400).json({ message: "Invalid family member data", error });
    }
  });

  app.put("/api/family/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const memberData = req.body;
      const member = await storage.updateFamilyMember(id, memberData);
      if (!member) {
        return res.status(404).json({ message: "Family member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(400).json({ message: "Update failed", error });
    }
  });

  app.delete("/api/family/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteFamilyMember(id);
    if (!deleted) {
      return res.status(404).json({ message: "Family member not found" });
    }
    res.json({ success: true });
  });

  // Media routes
  app.get("/api/media/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const media = await storage.getMedia(userId);
    res.json(media);
  });

  app.post("/api/media", async (req, res) => {
    try {
      const mediaData = insertMediaSchema.parse(req.body);
      const media = await storage.createMedia(mediaData);
      res.json(media);
    } catch (error) {
      res.status(400).json({ message: "Invalid media data", error });
    }
  });

  app.put("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mediaData = req.body;
      const media = await storage.updateMedia(id, mediaData);
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }
      res.json(media);
    } catch (error) {
      res.status(400).json({ message: "Update failed", error });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteMedia(id);
    if (!deleted) {
      return res.status(404).json({ message: "Media not found" });
    }
    res.json({ success: true });
  });

  // Journal routes
  app.get("/api/journal/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const entries = await storage.getJournalEntries(userId);
    res.json(entries);
  });

  app.post("/api/journal", async (req, res) => {
    try {
      const entryData = insertJournalEntrySchema.parse(req.body);
      const entry = await storage.createJournalEntry(entryData);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid journal entry data", error });
    }
  });

  app.put("/api/journal/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entryData = req.body;
      const entry = await storage.updateJournalEntry(id, entryData);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: "Update failed", error });
    }
  });

  app.delete("/api/journal/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteJournalEntry(id);
    if (!deleted) {
      return res.status(404).json({ message: "Journal entry not found" });
    }
    res.json({ success: true });
  });

  // Tasks routes
  app.get("/api/tasks/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const tasks = await storage.getTasks(userId);
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data", error });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = req.body;
      const task = await storage.updateTask(id, taskData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Update failed", error });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteTask(id);
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ success: true });
  });

  // Events routes
  app.get("/api/events/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const events = await storage.getEvents(userId);
    res.json(events);
  });

  app.post("/api/events", async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.date && typeof body.date === 'string') {
        body.date = new Date(body.date);
      }
      const eventData = insertEventSchema.parse(body);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data", error });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const eventData = req.body;
      const event = await storage.updateEvent(id, eventData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Update failed", error });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteEvent(id);
    if (!deleted) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json({ success: true });
  });

  // Gallery/Photos routes
  app.get("/api/photos/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const photos = await storage.getPhotos(userId);
    res.json(photos);
  });

  app.post("/api/photos", async (req, res) => {
    try {
      const photoData = insertPhotoSchema.parse(req.body);
      const photo = await storage.createPhoto(photoData);
      res.json(photo);
    } catch (error) {
      res.status(400).json({ message: "Invalid photo data", error });
    }
  });

  // Bookmarks routes
  app.get("/api/bookmarks/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const bookmarks = await storage.getBookmarks(userId);
    res.json(bookmarks);
  });

  app.post("/api/bookmarks", async (req, res) => {
    try {
      const bookmarkData = insertBookmarkSchema.parse(req.body);
      const bookmark = await storage.createBookmark(bookmarkData);
      res.json(bookmark);
    } catch (error) {
      res.status(400).json({ message: "Invalid bookmark data", error });
    }
  });

  // Places routes
  app.get("/api/places/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const places = await storage.getPlaces(userId);
    res.json(places);
  });

  app.post("/api/places", async (req, res) => {
    try {
      const placeData = insertPlaceSchema.parse(req.body);
      const place = await storage.createPlace(placeData);
      res.json(place);
    } catch (error) {
      res.status(400).json({ message: "Invalid place data", error });
    }
  });

  // Quotes routes
  app.get("/api/quotes/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const quotes = await storage.getQuotes(userId);
    res.json(quotes);
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const quoteData = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(quoteData);
      res.json(quote);
    } catch (error) {
      res.status(400).json({ message: "Invalid quote data", error });
    }
  });

  // Dashboard stats route
  app.get("/api/stats/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    const [familyMembers, media, tasks, events] = await Promise.all([
      storage.getFamilyMembers(userId),
      storage.getMedia(userId),
      storage.getTasks(userId),
      storage.getEvents(userId)
    ]);

    const completedTasks = tasks.filter(task => task.isCompleted).length;
    const upcomingEvents = events.filter(event => 
      new Date(event.date) > new Date()
    ).length;

    const genderStats = familyMembers.reduce((acc, member) => {
      acc[member.gender] = (acc[member.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mediaByType = media.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      familyCount: familyMembers.length,
      mediaCount: media.length,
      tasksCompleted: completedTasks,
      upcomingEvents,
      genderStats,
      mediaByType
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
