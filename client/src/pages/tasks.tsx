import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task, type InsertTask } from "@shared/schema";
import { Plus, Search, CheckCircle, Circle, Calendar, RotateCcw, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Tasks() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", user?.id],
    enabled: !!user,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", user?.id] });
      setShowAddDialog(false);
      toast({ title: "Success", description: "Task added successfully" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", user?.id] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", user?.id] });
      toast({ title: "Success", description: "Task deleted successfully" });
    },
  });

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema.extend({
      userId: insertTaskSchema.shape.userId.default(user?.id || 0),
    })),
    defaultValues: {
      userId: user?.id || 0,
      title: "",
      description: "",
      category: "",
      isCompleted: false,
      isHabit: false,
      dueDate: undefined,
    },
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
    
    const matchesTab = activeTab === "all" || 
      (activeTab === "pending" && !task.isCompleted) ||
      (activeTab === "completed" && task.isCompleted) ||
      (activeTab === "habits" && task.isHabit);
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  const onSubmit = async (data: InsertTask) => {
    await createTaskMutation.mutateAsync(data);
    form.reset();
  };

  const toggleTaskCompletion = async (id: number, isCompleted: boolean) => {
    await updateTaskMutation.mutateAsync({ 
      id, 
      data: { isCompleted: !isCompleted }
    });
  };

  const deleteTask = async (id: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTaskMutation.mutateAsync(id);
    }
  };

  const getTasksByCategory = () => {
    const categories = [...new Set(tasks.map(task => task.category).filter(Boolean))];
    return categories;
  };

  const getPriorityColor = (dueDate: string | null) => {
    if (!dueDate) return "";
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-red-600 dark:text-red-400";
    if (diffDays <= 1) return "text-orange-600 dark:text-orange-400";
    if (diffDays <= 3) return "text-yellow-600 dark:text-yellow-400";
    return "";
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks & Habits</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your daily tasks and build healthy habits</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {getTasksByCategory().map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Circle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {tasks.filter(t => !t.isCompleted).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {tasks.filter(t => t.isCompleted).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RotateCcw className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Habits</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {tasks.filter(t => t.isHabit).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No tasks found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {searchTerm || categoryFilter !== "all" 
                    ? "Try adjusting your filters" 
                    : "Start by adding your first task"}
                </p>
                {!searchTerm && categoryFilter === "all" && (
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Task
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTasks
                .sort((a, b) => {
                  // Sort by completion status, then by due date
                  if (a.isCompleted !== b.isCompleted) {
                    return a.isCompleted ? 1 : -1;
                  }
                  if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                  }
                  return 0;
                })
                .map((task) => (
                  <Card key={task.id} className={task.isCompleted ? "opacity-75" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={task.isCompleted}
                          onCheckedChange={() => toggleTaskCompletion(task.id, task.isCompleted)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={`font-medium ${task.isCompleted 
                                ? "line-through text-slate-500 dark:text-slate-400" 
                                : "text-slate-900 dark:text-white"
                              }`}>
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {task.category && (
                                  <Badge variant="outline">{task.category}</Badge>
                                )}
                                {task.isHabit && (
                                  <Badge variant="secondary">
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Habit
                                  </Badge>
                                )}
                                {task.dueDate && (
                                  <Badge variant="outline" className={getPriorityColor(task.dueDate)}>
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(task.dueDate), 'MMM d')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteTask(task.id)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Task Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
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
                      <Input placeholder="What needs to be done?" {...field} />
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
                      <Textarea placeholder="Additional details..." {...field} />
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
                      <Input placeholder="e.g., Work, Personal, Health" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isHabit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This is a recurring habit</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={createTaskMutation.isPending}>
                  Add Task
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
