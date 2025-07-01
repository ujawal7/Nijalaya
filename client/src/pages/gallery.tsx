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
import { insertPhotoSchema, type Photo, type InsertPhoto, type FamilyMember } from "@shared/schema";
import { Plus, Search, Image as ImageIcon, Upload, Tag, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Gallery() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: photos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos", user?.id],
    enabled: !!user,
  });

  const { data: familyMembers = [] } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family", user?.id],
    enabled: !!user,
  });

  const createPhotoMutation = useMutation({
    mutationFn: async (data: InsertPhoto) => {
      const response = await apiRequest("POST", "/api/photos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos", user?.id] });
      setShowAddDialog(false);
      toast({ title: "Success", description: "Photo added successfully" });
    },
  });

  const form = useForm<InsertPhoto>({
    resolver: zodResolver(insertPhotoSchema.extend({
      userId: insertPhotoSchema.shape.userId.default(user?.id || 0),
    })),
    defaultValues: {
      userId: user?.id || 0,
      filename: "",
      caption: "",
      tags: [],
      linkedPersonIds: [],
      linkedEventId: undefined,
    },
  });

  const filteredPhotos = photos.filter(photo => 
    photo.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    photo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    photo.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: InsertPhoto) => {
    await createPhotoMutation.mutateAsync(data);
    form.reset();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        form.setValue("filename", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const parseTagsInput = (input: string): string[] => {
    return input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  const parsePersonIdsInput = (input: string): number[] => {
    return input.split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));
  };

  const getPersonNames = (personIds: number[]) => {
    return personIds
      .map(id => familyMembers.find(member => member.id === id)?.name)
      .filter(Boolean);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gallery</h1>
          <p className="text-slate-600 dark:text-slate-400">Organize and tag your family photos</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Photo
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search photos by caption, tags, or filename..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ImageIcon className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{photos.length}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Photos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Tag className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {[...new Set(photos.flatMap(p => p.tags || []))].length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Unique Tags</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {photos.filter(p => p.linkedPersonIds && p.linkedPersonIds.length > 0).length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Tagged People</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {photos.filter(p => p.linkedEventId).length}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Event Photos</p>
          </CardContent>
        </Card>
      </div>

      {/* Photo Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredPhotos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No photos found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {searchTerm 
                ? "Try adjusting your search" 
                : "Start building your family photo collection"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload First Photo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos
            .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
            .map((photo) => (
              <Card key={photo.id} className="overflow-hidden cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                <div className="aspect-square bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  {photo.filename ? (
                    <img 
                      src={photo.filename} 
                      alt={photo.caption || "Photo"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-slate-400" />
                  )}
                </div>
                <CardContent className="p-3">
                  {photo.caption && (
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-2 line-clamp-2">
                      {photo.caption}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {photo.tags?.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {photo.tags && photo.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{photo.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {format(new Date(photo.uploadDate), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Photo Detail Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Photo Details</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                {selectedPhoto.filename ? (
                  <img 
                    src={selectedPhoto.filename} 
                    alt={selectedPhoto.caption || "Photo"}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <ImageIcon className="h-24 w-24 text-slate-400" />
                )}
              </div>
              <div className="space-y-4">
                {selectedPhoto.caption && (
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">Caption</h3>
                    <p className="text-slate-600 dark:text-slate-400">{selectedPhoto.caption}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">Upload Date</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {format(new Date(selectedPhoto.uploadDate), 'PPP')}
                  </p>
                </div>

                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPhoto.linkedPersonIds && selectedPhoto.linkedPersonIds.length > 0 && (
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Tagged People</h3>
                    <div className="flex flex-wrap gap-2">
                      {getPersonNames(selectedPhoto.linkedPersonIds).map((name, index) => (
                        <Badge key={index} variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Photo Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="filename"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo File</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                        {field.value && (
                          <div className="w-full h-32 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                            <img 
                              src={field.value} 
                              alt="Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe this photo..." {...field} />
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
                        placeholder="family, vacation, birthday (comma separated)"
                        value={field.value?.join(', ') || ''}
                        onChange={(e) => field.onChange(parseTagsInput(e.target.value))}
                      />
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
                    <FormLabel>Tag People (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Select family members to tag"
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
                <Button type="submit" className="flex-1" disabled={createPhotoMutation.isPending}>
                  Upload Photo
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
