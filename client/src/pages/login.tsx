import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Home, Plus, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  pin: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function Login() {
  const { users, login, createUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      username: "",
      pin: "",
    },
  });

  const handleLogin = async (userId: number, userPin?: string) => {
    try {
      await login(userId, userPin);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid PIN or user not found",
        variant: "destructive",
      });
    }
  };

  const handleUserSelect = async (userId: number, hasPin: boolean) => {
    if (!hasPin) {
      await handleLogin(userId);
    } else {
      setSelectedUser(userId);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      await handleLogin(selectedUser, pin);
      setSelectedUser(null);
      setPin("");
    }
  };

  const onCreateUser = async (data: CreateUserFormData) => {
    try {
      await createUser(data);
      setShowCreateUser(false);
      form.reset();
      toast({
        title: "Profile Created",
        description: "New user profile has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user profile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Nijalaya</CardTitle>
          <p className="text-slate-600 dark:text-slate-400">Choose your profile to continue</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 mb-4">No profiles found</p>
              <Button onClick={() => setShowCreateUser(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create First Profile
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id, !!user.pin)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
                    </div>
                    {user.pin && <Lock className="h-4 w-4 text-slate-400" />}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateUser(true)} 
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Profile
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* PIN Entry Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter PIN</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
            />
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setSelectedUser(null)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Login
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN (Optional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Set a 4-6 digit PIN" maxLength={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateUser(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create Profile
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
