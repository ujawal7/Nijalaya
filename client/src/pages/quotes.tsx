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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuoteSchema, type Quote, type InsertQuote } from "@shared/schema";
import { Plus, Search, Quote as QuoteIcon, Heart, RefreshCw, Edit, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Quotes() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [featuredQuote, setFeaturedQuote] = useState<Quote | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes", user?.id],
    enabled: !!user,
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: InsertQuote) => {
      const response = await apiRequest("POST", "/api/quotes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", user?.id] });
      setShowAddDialog(false);
      toast({ title: "Success", description: "Quote added successfully" });
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Quote> }) => {
      const response = await apiRequest("PUT", `/api/quotes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", user?.id] });
      setEditingQuote(null);
      toast({ title: "Success", description: "Quote updated successfully" });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/quotes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", user?.id] });
      toast({ title: "Success", description: "Quote deleted successfully" });
    },
  });

  const form = useForm<InsertQuote>({
    resolver: zodResolver(insertQuoteSchema.extend({
      userId: insertQuoteSchema.shape.userId.default(user?.id || 0),
    })),
    defaultValues: {
      userId: user?.id || 0,
      text: "",
      author: "",
      source: "",
      category: "",
      isFavorite: false,
    },
  });

  const editForm = useForm<Partial<Quote>>({
    defaultValues: {},
  });

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.author && quote.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (quote.category && quote.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFavorites = !showFavorites || quote.isFavorite;
    
    return matchesSearch && matchesFavorites;
  });

  const onSubmit = async (data: InsertQuote) => {
    await createQuoteMutation.mutateAsync(data);
    form.reset();
  };

  const onUpdate = async (data: Partial<Quote>) => {
    if (editingQuote) {
      await updateQuoteMutation.mutateAsync({ id: editingQuote.id, data });
      editForm.reset();
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    editForm.reset({
      text: quote.text,
      author: quote.author || "",
      source: quote.source || "",
      category: quote.category || "",
      isFavorite: quote.isFavorite,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this quote?")) {
      await deleteQuoteMutation.mutateAsync(id);
    }
  };

  const toggleFavorite = async (id: number, isFavorite: boolean) => {
    await updateQuoteMutation.mutateAsync({ 
      id, 
      data: { isFavorite: !isFavorite }
    });
  };

  const getRandomQuote = () => {
    if (quotes.length > 0) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setFeaturedQuote(randomQuote);
    }
  };

  const getCategories = () => {
    const categories = [...new Set(quotes.map(quote => quote.category).filter(Boolean))];
    return categories;
  };

  // Set initial featured quote
  useState(() => {
    if (quotes.length > 0 && !featuredQuote) {
      getRandomQuote();
    }
  }, [quotes.length]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quotes & Reflections</h1>
          <p className="text-slate-600 dark:text-slate-400">Collect and organize your favorite quotes</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Quote
        </Button>
      </div>

      {/* Featured Quote */}
      {featuredQuote && (
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Quote of the Day</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={getRandomQuote}
                className="text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <blockquote className="text-lg italic mb-4">
              "{featuredQuote.text}"
            </blockquote>
            <cite className="text-white/80">
              — {featuredQuote.author || 'Unknown'}
            </cite>
            {featuredQuote.source && (
              <p className="text-white/70 text-sm mt-1">
                Source: {featuredQuote.source}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search quotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFavorites ? "default" : "outline"}
          onClick={() => setShowFavorites(!showFavorites)}
        >
          <Heart className={`h-4 w-4 mr-2 ${showFavorites ? 'fill-current' : ''}`} />
          {showFavorites ? 'All Quotes' : 'Favorites Only'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <QuoteIcon className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{quotes.length}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Quotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {quotes.filter(q => q.isFavorite).length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Favorites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">📚</div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{getCategories().length}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">✍️</div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {[...new Set(quotes.map(q => q.author).filter(Boolean))].length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Authors</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      {getCategories().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getCategories().map((category) => (
                <Badge 
                  key={category} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900"
                  onClick={() => setSearchTerm(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quotes List */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <QuoteIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No quotes found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {searchTerm || showFavorites 
                ? "Try adjusting your search or filters" 
                : "Start collecting your favorite quotes and reflections"}
            </p>
            {!searchTerm && !showFavorites && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Quote
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQuotes
            .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
            .map((quote) => (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <blockquote className="text-slate-700 dark:text-slate-300 italic mb-3 text-lg">
                        "{quote.text}"
                      </blockquote>
                      <cite className="text-slate-600 dark:text-slate-400 font-medium">
                        — {quote.author || 'Unknown'}
                      </cite>
                      {quote.source && (
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                          Source: {quote.source}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {quote.category && (
                          <Badge variant="outline">{quote.category}</Badge>
                        )}
                        {quote.isFavorite && (
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Favorite
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Added {format(new Date(quote.dateAdded), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleFavorite(quote.id, quote.isFavorite)}
                        className={quote.isFavorite ? "text-red-500" : "text-slate-400"}
                      >
                        <Heart className={`h-4 w-4 ${quote.isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(quote)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(quote.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Add Quote Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Quote</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote Text</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter the quote..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Who said this?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Book, movie, speech, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="inspirational, wisdom, humor, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFavorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as favorite</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={createQuoteMutation.isPending}>
                  Add Quote
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Quote Dialog */}
      <Dialog open={!!editingQuote} onOpenChange={() => setEditingQuote(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Quote</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote Text</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter the quote..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Who said this?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Book, movie, speech, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="inspirational, wisdom, humor, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="isFavorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as favorite</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingQuote(null)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={updateQuoteMutation.isPending}>
                  Update Quote
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
