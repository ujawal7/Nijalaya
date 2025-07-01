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
import { insertFamilyMemberSchema, type FamilyMember, type InsertFamilyMember } from "@shared/schema";
import { Plus, Search, Users, TreePine, Edit, Trash2, UserPlus, Cake, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function FamilyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: familyMembers = [], isLoading } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family", user?.id],
    enabled: !!user?.id,
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: InsertFamilyMember) => {
      const response = await apiRequest("POST", "/api/family", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", user?.id] });
      setShowAddDialog(false);
      toast({ title: "Success", description: "Family member added successfully" });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FamilyMember> }) => {
      const response = await apiRequest("PUT", `/api/family/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family", user?.id] });
      setEditingMember(null);
      toast({ title: "Success", description: "Family member updated successfully" });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/family/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", user?.id] });
      toast({ title: "Success", description: "Family member deleted successfully" });
    },
  });

  const form = useForm<InsertFamilyMember>({
    resolver: zodResolver(insertFamilyMemberSchema.extend({
      userId: insertFamilyMemberSchema.shape.userId.default(user?.id || 0),
    })),
    defaultValues: {
      userId: user?.id || 0,
      name: "",
      gender: "",
      birthDate: "",
      photo: "",
      relationship: "",
      notes: "",
      parentId: null,
    },
  });

  const editForm = useForm<Partial<FamilyMember>>({
    defaultValues: {},
  });

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.relationship?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRelationshipColor = (relationship?: string) => {
    if (!relationship) return "bg-gray-100 text-gray-800";
    const rel = relationship.toLowerCase();
    if (rel.includes('parent') || rel.includes('father') || rel.includes('mother')) return "bg-blue-100 text-blue-800";
    if (rel.includes('child') || rel.includes('son') || rel.includes('daughter')) return "bg-green-100 text-green-800";
    if (rel.includes('spouse') || rel.includes('wife') || rel.includes('husband')) return "bg-pink-100 text-pink-800";
    if (rel.includes('sibling') || rel.includes('brother') || rel.includes('sister')) return "bg-purple-100 text-purple-800";
    return "bg-orange-100 text-orange-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Users className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Family Members</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/family-tree">
            <Button variant="outline">
              <TreePine className="w-4 h-4 mr-2" />
              View Family Tree
            </Button>
          </Link>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Family Member
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search family members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Family Members Grid */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {familyMembers.length === 0 ? "No Family Members Yet" : "No Members Found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {familyMembers.length === 0 
                ? "Start building your family tree by adding your first family member"
                : "Try adjusting your search terms"
              }
            </p>
            {familyMembers.length === 0 && (
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add First Family Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {member.gender || "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMember(member);
                        editForm.reset(member);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMemberMutation.mutate(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {member.relationship && (
                  <Badge className={getRelationshipColor(member.relationship)}>
                    {member.relationship}
                  </Badge>
                )}
                
                {member.birthDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cake className="w-4 h-4" />
                    {new Date(member.birthDate).toLocaleDateString()}
                  </div>
                )}
                
                {member.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {member.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Family Member</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => createMemberMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Father, Mother, Son, Daughter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional information..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMemberMutation.isPending}>
                  {createMemberMutation.isPending ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Family Member</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(data => updateMemberMutation.mutate({ id: editingMember.id, data }))} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Father, Mother, Son, Daughter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional information..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingMember(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMemberMutation.isPending}>
                    {updateMemberMutation.isPending ? "Updating..." : "Update Member"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}