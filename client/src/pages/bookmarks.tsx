import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookmarkSchema, type Bookmark, type InsertBookmark } from "@shared/schema";
import { Plus, Search, Bookmark as BookmarkIcon, ExternalLink, Tag, Calendar, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Bookmarks() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bookmarks = [], isLoading } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks", user?.id],
    enabled: !!user,
  });

  const createBookmarkMutation = useMutation({
    mutationFn: async (data: InsertBookmark) => {
      const response = await apiRequest("POST", "/api/bookmarks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", user?.id] });
      setShowAddDialog(false);
      toast({ title: "Success", description: "Bookmark added successfully" });
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Bookmark> }) => {
      const response = await apiRequest("PUT", `/api/bookmarks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", user?.id] });
      setEditingBookmark(null);
      toast({ title: "Success", description: "Bookmark updated successfully" });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/bookmarks/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", user?.id] });
      toast({ title: "Success", description: "Bookmark deleted successfully" });
    },
  });

  const form = useForm<InsertBookmark>({
    resolver: zodResolver(insertBookmarkSchema.extend({
      userId: insertBookmarkSchema.shape.userId.default(user?.id || 0),
    })),
    defaultValues: {
      userId: user?.id || 0,
      title: "",
      url: "",
      description: "",
      tags: [],
      favicon: "",
    },
  });

  const editForm = useForm<Partial<Bookmark>>({
    defaultValues: {},
  });

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bookmark.description && bookmark.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    bookmark.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const onSubmit = async (data: InsertBookmark) => {
    const tags = data.tags || [];
    await createBookmarkMutation.mutateAsync({ ...data, tags });
    form.reset();
  };

  const onUpdate = async (data: Partial<Bookmark>) => {
    if (editingBookmark) {
      await updateBookmarkMutation.mutateAsync({ id: editingBookmark.id, data });
      editForm.reset();
    }
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    editForm.reset({
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description || "",
      tags: bookmark.tags || [],
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this bookmark?")) {
      await deleteBookmarkMutation.mutateAsync(id);
    }
  };

  const parseTagsInput = (input: string): string[] => {
    return input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  const extractDomain = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const getAllTags = () => {
    const allTags = bookmarks.flatMap(bookmark => bookmark.tags || []);
    return [...new Set(allTags)].sort();
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bookmarks</h1>
          <p className="text-slate-600 dark:text-slate-400">Save and organize your favorite links</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bookmark
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search bookmarks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookmarkIcon className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{bookmarks.length}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Bookmarks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Tag className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{getAllTags().length}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Unique Tags</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ExternalLink className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {[...new Set(bookmarks.map(b => extractDomain(b.url)))].length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Unique Domains</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {bookmarks.filter(b => {
                const daysSinceAdded = Math.floor((Date.now() - new Date(b.dateAdded).getTime()) / (1000 * 60 * 60 * 24));
                return daysSinceAdded <= 7;
              }).length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Tags */}
      {getAllTags().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getAllTags().slice(0, 10).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900"
                  onClick={() => setSearchTerm(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookmarks List */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookmarkIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No bookmarks found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {searchTerm ? "Try adjusting your search" : "Start saving your favorite links and articles"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Bookmark
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBookmarks
            .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
            .map((bookmark) => (
              <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        {bookmark.favicon ? (
                          <img 
                            src={bookmark.favicon} 
                            alt=""
                            className="w-6 h-6"
                          />
                        ) : (
                          <ExternalLink className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                              {bookmark.title}
                            </h3>
                            <a 
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-flex items-center"
                            >
                              {extractDomain(bookmark.url)}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                            {bookmark.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                {bookmark.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {bookmark.tags?.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Added {format(new Date(bookmark.dateAdded), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(bookmark)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(bookmark.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Add Bookmark Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bookmark</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Bookmark title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What is this link about?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="tech, articles, reference (comma separated)"
                        value={field.value?.join(', ') || ''}
                        onChange={(e) => field.onChange(parseTagsInput(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={createBookmarkMutation.isPending}>
                  Save Bookmark
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Bookmark Dialog */}
      <Dialog open={!!editingBookmark} onOpenChange={() => setEditingBookmark(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Bookmark title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What is this link about?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="tech, articles, reference (comma separated)"
                        value={field.value?.join(', ') || ''}
                        onChange={(e) => field.onChange(parseTagsInput(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingBookmark(null)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={updateBookmarkMutation.isPending}>
                  Update Bookmark
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
