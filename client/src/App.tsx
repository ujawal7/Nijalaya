import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/use-auth";
import Layout from "@/components/Layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Family from "@/pages/family";
import FamilyTree from "@/pages/family-tree";
import MediaTracker from "@/pages/media-tracker";
import Journal from "@/pages/journal";
import Tasks from "@/pages/tasks";
import Events from "@/pages/events";
import Gallery from "@/pages/gallery";
import Bookmarks from "@/pages/bookmarks";
import TravelMap from "@/pages/travel-map";
import Quotes from "@/pages/quotes";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={() => <Layout><Dashboard /></Layout>} />
      <Route path="/family" component={() => <Layout><Family /></Layout>} />
      <Route path="/family-tree" component={() => <Layout><FamilyTree /></Layout>} />
      <Route path="/media" component={() => <Layout><MediaTracker /></Layout>} />
      <Route path="/journal" component={() => <Layout><Journal /></Layout>} />
      <Route path="/tasks" component={() => <Layout><Tasks /></Layout>} />
      <Route path="/events" component={() => <Layout><Events /></Layout>} />
      <Route path="/gallery" component={() => <Layout><Gallery /></Layout>} />
      <Route path="/bookmarks" component={() => <Layout><Bookmarks /></Layout>} />
      <Route path="/travel" component={() => <Layout><TravelMap /></Layout>} />
      <Route path="/quotes" component={() => <Layout><Quotes /></Layout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
