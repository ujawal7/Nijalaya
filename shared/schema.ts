import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Profiles table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  pin: text("pin"), // Optional PIN for profile protection
  avatar: text("avatar"), // Base64 encoded avatar or path
  isActive: boolean("is_active").default(false),
  lastLogin: timestamp("last_login"),
});

// Family members table
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  gender: text("gender").notNull(), // 'male', 'female', 'other'
  birthDate: text("birth_date"), // ISO date string
  photo: text("photo"), // Base64 encoded photo or path
  relationship: text("relationship"), // relationship to user
  notes: text("notes"),
  parentId: integer("parent_id"), // For family tree relationships
});

// Media tracking table
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'movie', 'series', 'book', 'game'
  status: text("status").notNull(), // 'wishlist', 'completed', 'in_progress'
  rating: integer("rating"), // 1-5 stars
  notes: text("notes"),
  genre: text("genre"),
  year: integer("year"),
  tmdbId: text("tmdb_id"), // For TMDB integration
  coverImage: text("cover_image"),
  dateAdded: timestamp("date_added").defaultNow(),
  dateCompleted: timestamp("date_completed"),
});

// Journal entries table
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title"),
  content: text("content").notNull(),
  tags: json("tags").$type<string[]>().default([]),
  date: timestamp("date").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  isCompleted: boolean("is_completed").default(false),
  isHabit: boolean("is_habit").default(false),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'birthday', 'anniversary', 'travel', 'other'
  date: timestamp("date").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  linkedPersonId: integer("linked_person_id"), // Link to family member
  location: text("location"),
  notificationEnabled: boolean("notification_enabled").default(true),
});

// Gallery/Photos table
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  caption: text("caption"),
  tags: json("tags").$type<string[]>().default([]),
  linkedPersonIds: json("linked_person_ids").$type<number[]>().default([]),
  linkedEventId: integer("linked_event_id"),
  uploadDate: timestamp("upload_date").defaultNow(),
});

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  tags: json("tags").$type<string[]>().default([]),
  favicon: text("favicon"),
  dateAdded: timestamp("date_added").defaultNow(),
});

// Travel/Places table
export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  description: text("description"),
  type: text("type"), // 'visited', 'family_history', 'wishlist'
  visitDate: timestamp("visit_date"),
  linkedPersonIds: json("linked_person_ids").$type<number[]>().default([]),
  photos: json("photos").$type<string[]>().default([]),
});

// Quotes table
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  text: text("text").notNull(),
  author: text("author"),
  source: text("source"),
  category: text("category"),
  isFavorite: boolean("is_favorite").default(false),
  dateAdded: timestamp("date_added").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, isActive: true, lastLogin: true });
export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({ id: true });
export const insertMediaSchema = createInsertSchema(media).omit({ id: true, dateAdded: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, date: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, completedDate: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true, uploadDate: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true, dateAdded: true });
export const insertPlaceSchema = createInsertSchema(places).omit({ id: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, dateAdded: true });

// Types
// Relations
export const usersRelations = relations(users, ({ many }) => ({
  familyMembers: many(familyMembers),
  media: many(media),
  journalEntries: many(journalEntries),
  tasks: many(tasks),
  events: many(events),
  photos: many(photos),
  bookmarks: many(bookmarks),
  places: many(places),
  quotes: many(quotes),
}));

export const familyMembersRelations = relations(familyMembers, ({ one, many }) => ({
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
  parent: one(familyMembers, {
    fields: [familyMembers.parentId],
    references: [familyMembers.id],
  }),
  children: many(familyMembers),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  user: one(users, {
    fields: [media.userId],
    references: [users.id],
  }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  linkedPerson: one(familyMembers, {
    fields: [events.linkedPersonId],
    references: [familyMembers.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
  linkedEvent: one(events, {
    fields: [photos.linkedEventId],
    references: [events.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
}));

export const placesRelations = relations(places, ({ one }) => ({
  user: one(users, {
    fields: [places.userId],
    references: [users.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  user: one(users, {
    fields: [quotes.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Place = typeof places.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
