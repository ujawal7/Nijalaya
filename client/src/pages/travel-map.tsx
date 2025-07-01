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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlaceSchema, type Place, type InsertPlace, type FamilyMember } from "@shared/schema";
import { Plus, Search, MapPin, Calendar, Users, Camera, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function TravelMap() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: places = [], isLoading } = useQuery<Place[]>({
    queryKey: ["/api/places", user?.id],
    enabled: !!user,
  });

  const { data: familyMembers = [] } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family", user?.id],
    enabled: !!user,
  });

  const createPlaceMutation = useMutation({
    mutationFn: async (data: InsertPlace) => {
      const response = await apiRequest("POST", "/api/places", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places", user?.id] });
      setShowAddDialog(false);
      toast({ title: "Success", description: "Place added successfully" });
    },
  });

  const updatePlaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Place> }) => {
      const response = await apiRequest("PUT", `/api/places/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places", user?.id] });
      setEditingPlace(null);
      toast({ title: "Success", description: "Place updated successfully" });
    },
  });

  const deletePlaceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/places/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places", user?.id] });
      toast({ title: "Success", description: "Place deleted successfully" });
    },
  });

  const form = useForm<InsertPlace>({
    resolver: zodResolver(insertPlaceSchema.extend({
      userId: insertPlaceSchema.shape.userId.default(user?.id || 0),
    })),
    defaultValues: {
      userId: user?.id || 0,
      name: "",
      latitude: "",
      longitude: "",
      description: "",
      type: "",
      visitDate: undefined,
      linkedPersonIds: [],
      photos: [],
    },
  });

  const editForm = useForm<Partial<Place>>({
    defaultValues: {},
  });

  const filteredPlaces = places.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (place.description && place.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === "all" || place.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const onSubmit = async (data: InsertPlace) => {
    await createPlaceMutation.mutateAsync(data);
    form.reset();
  };

  const onUpdate = async (data: Partial<Place>) => {
    if (editingPlace) {
      await updatePlaceMutation.mutateAsync({ id: editingPlace.id, data });
      editForm.reset();
    }
  };

  const handleEdit = (place: Place) => {
    setEditingPlace(place);
    editForm.reset({
      name: place.name,
      latitude: place.latitude || "",
      longitude: place.longitude || "",
      description: place.description || "",
      type: place.type || "",
      visitDate: place.visitDate || undefined,
      linkedPersonIds: place.linkedPersonIds || [],
      photos: place.photos || [],
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this place?")) {
      await deletePlaceMutation.mutateAsync(id);
    }
  };

  const getPlaceIcon = (type: string | null) => {
    switch (type) {
      case 'visited': return '📍';
      case 'family_history': return '🏛️';
      case 'wishlist': return '⭐';
      default: return '📍';
    }
  };

  const getPlaceColor = (type: string | null) => {
    switch (type) {
      case 'visited': return 'from-green-500 to-emerald-500';
      case 'family_history': return 'from-amber-500 to-orange-500';
      case 'wishlist': return 'from-blue-500 to-indigo-500';
      default: return 'from-purple-500 to-indigo-500';
    }
  };

  const getLinkedPersonNames = (personIds: number[]) => {
    return personIds
      .map(id => familyMembers.find(member => member.id === id)?.name)
      .filter(Boolean);
  };

  const parsePersonIdsInput = (input: string): number[] => {
    return input.split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));
  };

  const parsePhotosInput = (input: string): string[] => {
    return input.split(',').map(photo => photo.trim()).filter(photo => photo.length > 0);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Travel Map</h1>
          <p className="text-slate-600 dark:text-slate-400">Track places you've visited and family history locations</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Place
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search places..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="visited">Visited</SelectItem>
            <SelectItem value="family_history">Family History</SelectItem>
            <SelectItem value="wishlist">Wishlist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{places.length}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Places</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">📍</div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {places.filter(p => p.type === 'visited').length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Visited</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🏛️</div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {places.filter(p => p.type === 'family_history').length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Family History</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">⭐</div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {places.filter(p => p.type === 'wishlist').length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Wishlist</p>
          </CardContent>
        </Card>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 dark:text-slate-400">Interactive map coming soon</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Will display all marked locations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Places List */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredPlaces.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No places found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {searchTerm || typeFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Start mapping your travels and family history"}
            </p>
            {!searchTerm && typeFilter === "all" && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Place
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPlaces
            .sort((a, b) => {
              if (a.visitDate && b.visitDate) {
                return new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime();
              }
              if (a.visitDate) return -1;
              if (b.visitDate) return 1;
              return a.name.localeCompare(b.name);
            })
            .map((place) => (
              <Card key={place.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getPlaceColor(place.type)} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {getPlaceIcon(place.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{place.name}</h3>
                          {place.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{place.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {place.type && (
                              <Badge variant="secondary">{place.type.replace('_', ' ')}</Badge>
                            )}
                            {place.visitDate && (
                              <Badge variant="outline">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(place.visitDate), 'MMM yyyy')}
                              </Badge>
                            )}
                            {place.linkedPersonIds && place.linkedPersonIds.length > 0 && (
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                {getLinkedPersonNames(place.linkedPersonIds).join(', ')}
                              </Badge>
                            )}
                            {place.photos && place.photos.length > 0 && (
                              <Badge variant="outline">
                                <Camera className="h-3 w-3 mr-1" />
                                {place.photos.length} photo{place.photos.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          {place.latitude && place.longitude && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              📍 {place.latitude}, {place.longitude}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(place)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(place.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Add Place Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Place</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter place name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select place type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="visited">Visited</SelectItem>
                        <SelectItem value="family_history">Family History</SelectItem>
                        <SelectItem value="wishlist">Wishlist</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="40.7128" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="-74.0060" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
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
                      <Textarea placeholder="Describe this place..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedPersonIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked People (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Family member IDs (comma separated)"
                        value={field.value?.join(', ') || ''}
                        onChange={(e) => field.onChange(parsePersonIdsInput(e.target.value))}
                      />
                    </FormControl>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Available IDs: {familyMembers.map(m => `${m.name} (${m.id})`).join(', ')}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={createPlaceMutation.isPending}>
                  Add Place
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Place Dialog */}
      <Dialog open={!!editingPlace} onOpenChange={() => setEditingPlace(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Place</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter place name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select place type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="visited">Visited</SelectItem>
                        <SelectItem value="family_history">Family History</SelectItem>
                        <SelectItem value="wishlist">Wishlist</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Textarea placeholder="Describe this place..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingPlace(null)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={updatePlaceMutation.isPending}>
                  Update Place
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
