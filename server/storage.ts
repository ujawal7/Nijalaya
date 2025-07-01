import { 
  users, familyMembers, media, journalEntries, tasks, events, photos, bookmarks, places, quotes,
  type User, type InsertUser, type FamilyMember, type InsertFamilyMember, type Media, type InsertMedia,
  type JournalEntry, type InsertJournalEntry, type Task, type InsertTask, type Event, type InsertEvent,
  type Photo, type InsertPhoto, type Bookmark, type InsertBookmark, type Place, type InsertPlace,
  type Quote, type InsertQuote
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Family Members
  getFamilyMembers(userId: number): Promise<FamilyMember[]>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: number, member: Partial<FamilyMember>): Promise<FamilyMember | undefined>;
  deleteFamilyMember(id: number): Promise<boolean>;
  
  // Media
  getMedia(userId: number): Promise<Media[]>;
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: number, media: Partial<Media>): Promise<Media | undefined>;
  deleteMedia(id: number): Promise<boolean>;
  
  // Journal
  getJournalEntries(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, entry: Partial<JournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<boolean>;
  
  // Tasks
  getTasks(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Events
  getEvents(userId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Photos
  getPhotos(userId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, photo: Partial<Photo>): Promise<Photo | undefined>;
  deletePhoto(id: number): Promise<boolean>;
  
  // Bookmarks
  getBookmarks(userId: number): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: number, bookmark: Partial<Bookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: number): Promise<boolean>;
  
  // Places
  getPlaces(userId: number): Promise<Place[]>;
  createPlace(place: InsertPlace): Promise<Place>;
  updatePlace(id: number, place: Partial<Place>): Promise<Place | undefined>;
  deletePlace(id: number): Promise<boolean>;
  
  // Quotes
  getQuotes(userId: number): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<Quote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private familyMembers: Map<number, FamilyMember> = new Map();
  private media: Map<number, Media> = new Map();
  private journalEntries: Map<number, JournalEntry> = new Map();
  private tasks: Map<number, Task> = new Map();
  private events: Map<number, Event> = new Map();
  private photos: Map<number, Photo> = new Map();
  private bookmarks: Map<number, Bookmark> = new Map();
  private places: Map<number, Place> = new Map();
  private quotes: Map<number, Quote> = new Map();
  
  private currentId = 1;

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isActive: false, 
      lastLogin: null,
      pin: insertUser.pin ?? null,
      avatar: insertUser.avatar ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...userData };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Family Members
  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values()).filter(member => member.userId === userId);
  }

  async createFamilyMember(insertMember: InsertFamilyMember): Promise<FamilyMember> {
    const id = this.currentId++;
    const member: FamilyMember = { 
      ...insertMember, 
      id,
      birthDate: insertMember.birthDate ?? null,
      photo: insertMember.photo ?? null,
      relationship: insertMember.relationship ?? null,
      notes: insertMember.notes ?? null,
      parentId: insertMember.parentId ?? null
    };
    this.familyMembers.set(id, member);
    return member;
  }

  async updateFamilyMember(id: number, memberData: Partial<FamilyMember>): Promise<FamilyMember | undefined> {
    const member = this.familyMembers.get(id);
    if (!member) return undefined;
    const updated = { ...member, ...memberData };
    this.familyMembers.set(id, updated);
    return updated;
  }

  async deleteFamilyMember(id: number): Promise<boolean> {
    return this.familyMembers.delete(id);
  }

  // Media
  async getMedia(userId: number): Promise<Media[]> {
    return Array.from(this.media.values()).filter(item => item.userId === userId);
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const id = this.currentId++;
    const mediaItem: Media = { 
      ...insertMedia, 
      id, 
      dateAdded: new Date(), 
      dateCompleted: null,
      notes: insertMedia.notes ?? null,
      rating: insertMedia.rating ?? null,
      genre: insertMedia.genre ?? null,
      year: insertMedia.year ?? null,
      tmdbId: insertMedia.tmdbId ?? null,
      coverImage: insertMedia.coverImage ?? null
    };
    this.media.set(id, mediaItem);
    return mediaItem;
  }

  async updateMedia(id: number, mediaData: Partial<Media>): Promise<Media | undefined> {
    const mediaItem = this.media.get(id);
    if (!mediaItem) return undefined;
    const updated = { ...mediaItem, ...mediaData };
    this.media.set(id, updated);
    return updated;
  }

  async deleteMedia(id: number): Promise<boolean> {
    return this.media.delete(id);
  }

  // Journal Entries
  async getJournalEntries(userId: number): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values()).filter(entry => entry.userId === userId);
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.currentId++;
    const entry: JournalEntry = { 
      ...insertEntry, 
      id, 
      date: new Date(),
      title: insertEntry.title ?? null,
      tags: insertEntry.tags ? [...insertEntry.tags] : null
    };
    this.journalEntries.set(id, entry);
    return entry;
  }

  async updateJournalEntry(id: number, entryData: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const entry = this.journalEntries.get(id);
    if (!entry) return undefined;
    const updated = { ...entry, ...entryData };
    this.journalEntries.set(id, updated);
    return updated;
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    return this.journalEntries.delete(id);
  }

  // Tasks
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    const task: Task = { 
      ...insertTask, 
      id, 
      completedDate: null,
      description: insertTask.description ?? null,
      category: insertTask.category ?? null,
      isCompleted: insertTask.isCompleted ?? null,
      isHabit: insertTask.isHabit ?? null,
      dueDate: insertTask.dueDate ?? null
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...taskData };
    if (updated.isCompleted && !task.isCompleted) {
      updated.completedDate = new Date();
    } else if (!updated.isCompleted && task.isCompleted) {
      updated.completedDate = null;
    }
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Events
  async getEvents(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => event.userId === userId);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentId++;
    const event: Event = { 
      ...insertEvent, 
      id,
      description: insertEvent.description ?? null,
      isRecurring: insertEvent.isRecurring ?? null,
      linkedPersonId: insertEvent.linkedPersonId ?? null,
      location: insertEvent.location ?? null,
      notificationEnabled: insertEvent.notificationEnabled ?? null
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    const updated = { ...event, ...eventData };
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Photos
  async getPhotos(userId: number): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(photo => photo.userId === userId);
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.currentId++;
    const photo: Photo = { 
      ...insertPhoto, 
      id, 
      uploadDate: new Date(),
      caption: insertPhoto.caption ?? null,
      tags: insertPhoto.tags ? [...insertPhoto.tags] : null,
      linkedPersonIds: insertPhoto.linkedPersonIds ? [...insertPhoto.linkedPersonIds] : null,
      linkedEventId: insertPhoto.linkedEventId ?? null
    };
    this.photos.set(id, photo);
    return photo;
  }

  async updatePhoto(id: number, photoData: Partial<Photo>): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;
    const updated = { ...photo, ...photoData };
    this.photos.set(id, updated);
    return updated;
  }

  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }

  // Bookmarks
  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(bookmark => bookmark.userId === userId);
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.currentId++;
    const bookmark: Bookmark = { 
      ...insertBookmark, 
      id, 
      dateAdded: new Date(),
      tags: insertBookmark.tags ? [...insertBookmark.tags] : null,
      description: insertBookmark.description ?? null,
      favicon: insertBookmark.favicon ?? null
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async updateBookmark(id: number, bookmarkData: Partial<Bookmark>): Promise<Bookmark | undefined> {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) return undefined;
    const updated = { ...bookmark, ...bookmarkData };
    this.bookmarks.set(id, updated);
    return updated;
  }

  async deleteBookmark(id: number): Promise<boolean> {
    return this.bookmarks.delete(id);
  }

  // Places
  async getPlaces(userId: number): Promise<Place[]> {
    return Array.from(this.places.values()).filter(place => place.userId === userId);
  }

  async createPlace(insertPlace: InsertPlace): Promise<Place> {
    const id = this.currentId++;
    const place: Place = { 
      ...insertPlace, 
      id,
      type: insertPlace.type ?? null,
      description: insertPlace.description ?? null,
      photos: insertPlace.photos ? [...insertPlace.photos] : null,
      linkedPersonIds: insertPlace.linkedPersonIds ? [...insertPlace.linkedPersonIds] : null,
      latitude: insertPlace.latitude ?? null,
      longitude: insertPlace.longitude ?? null,
      visitDate: insertPlace.visitDate ?? null
    };
    this.places.set(id, place);
    return place;
  }

  async updatePlace(id: number, placeData: Partial<Place>): Promise<Place | undefined> {
    const place = this.places.get(id);
    if (!place) return undefined;
    const updated = { ...place, ...placeData };
    this.places.set(id, updated);
    return updated;
  }

  async deletePlace(id: number): Promise<boolean> {
    return this.places.delete(id);
  }

  // Quotes
  async getQuotes(userId: number): Promise<Quote[]> {
    return Array.from(this.quotes.values()).filter(quote => quote.userId === userId);
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const id = this.currentId++;
    const quote: Quote = { 
      ...insertQuote, 
      id, 
      dateAdded: new Date(),
      source: insertQuote.source ?? null,
      category: insertQuote.category ?? null,
      author: insertQuote.author ?? null,
      isFavorite: insertQuote.isFavorite ?? null
    };
    this.quotes.set(id, quote);
    return quote;
  }

  async updateQuote(id: number, quoteData: Partial<Quote>): Promise<Quote | undefined> {
    const quote = this.quotes.get(id);
    if (!quote) return undefined;
    const updated = { ...quote, ...quoteData };
    this.quotes.set(id, updated);
    return updated;
  }

  async deleteQuote(id: number): Promise<boolean> {
    return this.quotes.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    return await db.select().from(familyMembers).where(eq(familyMembers.userId, userId));
  }

  async createFamilyMember(insertMember: InsertFamilyMember): Promise<FamilyMember> {
    const [member] = await db
      .insert(familyMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  async updateFamilyMember(id: number, memberData: Partial<FamilyMember>): Promise<FamilyMember | undefined> {
    const [member] = await db
      .update(familyMembers)
      .set(memberData)
      .where(eq(familyMembers.id, id))
      .returning();
    return member || undefined;
  }

  async deleteFamilyMember(id: number): Promise<boolean> {
    const result = await db.delete(familyMembers).where(eq(familyMembers.id, id));
    return result.rowCount > 0;
  }

  async getMedia(userId: number): Promise<Media[]> {
    return await db.select().from(media).where(eq(media.userId, userId));
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const [mediaItem] = await db
      .insert(media)
      .values(insertMedia)
      .returning();
    return mediaItem;
  }

  async updateMedia(id: number, mediaData: Partial<Media>): Promise<Media | undefined> {
    const [mediaItem] = await db
      .update(media)
      .set(mediaData)
      .where(eq(media.id, id))
      .returning();
    return mediaItem || undefined;
  }

  async deleteMedia(id: number): Promise<boolean> {
    const result = await db.delete(media).where(eq(media.id, id));
    return result.rowCount > 0;
  }

  async getJournalEntries(userId: number): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries).where(eq(journalEntries.userId, userId));
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const [entry] = await db
      .insert(journalEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async updateJournalEntry(id: number, entryData: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .update(journalEntries)
      .set(entryData)
      .where(eq(journalEntries.id, id))
      .returning();
    return entry || undefined;
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    const result = await db.delete(journalEntries).where(eq(journalEntries.id, id));
    return result.rowCount > 0;
  }

  async getTasks(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  async getEvents(userId: number): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.userId, userId));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount > 0;
  }

  async getPhotos(userId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.userId, userId));
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const [photo] = await db
      .insert(photos)
      .values(insertPhoto)
      .returning();
    return photo;
  }

  async updatePhoto(id: number, photoData: Partial<Photo>): Promise<Photo | undefined> {
    const [photo] = await db
      .update(photos)
      .set(photoData)
      .where(eq(photos.id, id))
      .returning();
    return photo || undefined;
  }

  async deletePhoto(id: number): Promise<boolean> {
    const result = await db.delete(photos).where(eq(photos.id, id));
    return result.rowCount > 0;
  }

  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values(insertBookmark)
      .returning();
    return bookmark;
  }

  async updateBookmark(id: number, bookmarkData: Partial<Bookmark>): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .update(bookmarks)
      .set(bookmarkData)
      .where(eq(bookmarks.id, id))
      .returning();
    return bookmark || undefined;
  }

  async deleteBookmark(id: number): Promise<boolean> {
    const result = await db.delete(bookmarks).where(eq(bookmarks.id, id));
    return result.rowCount > 0;
  }

  async getPlaces(userId: number): Promise<Place[]> {
    return await db.select().from(places).where(eq(places.userId, userId));
  }

  async createPlace(insertPlace: InsertPlace): Promise<Place> {
    const [place] = await db
      .insert(places)
      .values(insertPlace)
      .returning();
    return place;
  }

  async updatePlace(id: number, placeData: Partial<Place>): Promise<Place | undefined> {
    const [place] = await db
      .update(places)
      .set(placeData)
      .where(eq(places.id, id))
      .returning();
    return place || undefined;
  }

  async deletePlace(id: number): Promise<boolean> {
    const result = await db.delete(places).where(eq(places.id, id));
    return result.rowCount > 0;
  }

  async getQuotes(userId: number): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.userId, userId));
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db
      .insert(quotes)
      .values(insertQuote)
      .returning();
    return quote;
  }

  async updateQuote(id: number, quoteData: Partial<Quote>): Promise<Quote | undefined> {
    const [quote] = await db
      .update(quotes)
      .set(quoteData)
      .where(eq(quotes.id, id))
      .returning();
    return quote || undefined;
  }

  async deleteQuote(id: number): Promise<boolean> {
    const result = await db.delete(quotes).where(eq(quotes.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
