import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, Film, CheckCircle, Calendar, UserPlus, Plus, PenTool, CalendarPlus,
  Cake, Heart, Plane, UserCog, Book, StickyNote, RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import type { FamilyMember, Quote } from "@shared/schema";

interface DashboardStats {
  familyCount: number;
  mediaCount: number;
  tasksCompleted: number;
  upcomingEvents: number;
  genderStats: Record<string, number>;
  mediaByType: Record<string, number>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [featuredMember, setFeaturedMember] = useState<FamilyMember | null>(null);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats", user?.id],
    enabled: !!user,
  });

  const { data: familyMembers = [] } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family", user?.id],
    enabled: !!user,
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes", user?.id],
    enabled: !!user,
  });

  // Set random featured member and quote
  useEffect(() => {
    if (familyMembers.length > 0) {
      const randomMember = familyMembers[Math.floor(Math.random() * familyMembers.length)];
      setFeaturedMember(randomMember);
    }
  }, [familyMembers]);

  useEffect(() => {
    if (quotes.length > 0) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setDailyQuote(randomQuote);
    } else {
      // Default quote if none exists
      setDailyQuote({
        id: 0,
        userId: user?.id || 0,
        text: "Family is not an important thing, it's everything.",
        author: "Michael J. Fox",
        source: null,
        category: null,
        isFavorite: false,
        dateAdded: new Date(),
      });
    }
  }, [quotes, user?.id]);

  const getNewQuote = () => {
    if (quotes.length > 1) {
      let newQuote;
      do {
        newQuote = quotes[Math.floor(Math.random() * quotes.length)];
      } while (newQuote.id === dailyQuote?.id);
      setDailyQuote(newQuote);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.name}! 👋
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Here's what's happening in your family world today</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.familyCount || 0}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Family Members</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <Film className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.mediaCount || 0}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Media Tracked</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.tasksCompleted || 0}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tasks Done</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.upcomingEvents || 0}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Upcoming Events</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts and Quick Actions Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Family Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statsLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Male</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {stats?.genderStats.male || 0} ({stats?.familyCount ? Math.round((stats.genderStats.male || 0) / stats.familyCount * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${stats?.familyCount ? (stats.genderStats.male || 0) / stats.familyCount * 100 : 0}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Female</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {stats?.genderStats.female || 0} ({stats?.familyCount ? Math.round((stats.genderStats.female || 0) / stats.familyCount * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-pink-500 h-2 rounded-full" 
                    style={{ width: `${stats?.familyCount ? (stats.genderStats.female || 0) / stats.familyCount * 100 : 0}%` }}
                  ></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/family">
                <Button variant="outline" className="h-auto p-3 flex flex-col items-center space-y-2 w-full">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-600">Add Person</span>
                </Button>
              </Link>
              
              <Link href="/media">
                <Button variant="outline" className="h-auto p-3 flex flex-col items-center space-y-2 w-full">
                  <Plus className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-600">Track Media</span>
                </Button>
              </Link>
              
              <Link href="/journal">
                <Button variant="outline" className="h-auto p-3 flex flex-col items-center space-y-2 w-full">
                  <PenTool className="h-5 w-5 text-pink-600" />
                  <span className="text-sm font-medium text-pink-600">Write Note</span>
                </Button>
              </Link>
              
              <Link href="/events">
                <Button variant="outline" className="h-auto p-3 flex flex-col items-center space-y-2 w-full">
                  <CalendarPlus className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">Add Event</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Highlights */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Featured Family Member */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Featured Family Member</h3>
            {featuredMember ? (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full border-2 border-white/30 flex items-center justify-center">
                  <span className="text-xl font-bold">
                    {featuredMember.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{featuredMember.name}</h4>
                  <p className="text-white/80 text-sm">{featuredMember.relationship || 'Family Member'}</p>
                  <p className="text-white/70 text-xs mt-1">
                    {featuredMember.birthDate ? `Born ${new Date(featuredMember.birthDate).getFullYear()}` : 'Family member'}
                    {featuredMember.notes && ` • ${featuredMember.notes.slice(0, 30)}...`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full border-2 border-white/30 flex items-center justify-center">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">No family members yet</h4>
                  <p className="text-white/80 text-sm">Add your first family member to get started</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Quote */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quote of the Day</h3>
            {dailyQuote && (
              <>
                <blockquote className="text-slate-600 dark:text-slate-400 italic mb-3">
                  "{dailyQuote.text}"
                </blockquote>
                <cite className="text-sm text-slate-500 dark:text-slate-500">
                  — {dailyQuote.author || 'Unknown'}
                </cite>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={getNewQuote}
                  className="mt-3 text-indigo-600 hover:text-indigo-800 p-0 h-auto"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  New Quote
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Activity tracking coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
