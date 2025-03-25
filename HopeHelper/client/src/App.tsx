import { useEffect, useState } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication status whenever location changes
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
        
        // Redirect based on auth status
        if (data.authenticated && location === "/") {
          setLocation("/chat");
        } else if (!data.authenticated && location === "/chat") {
          setLocation("/");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuthStatus();
  }, [location, setLocation]);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <>
      <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Switch>
        <Route path="/" component={() => {
          // If authenticated, redirect to chat
          if (isAuthenticated) {
            return <Redirect to="/chat" />;
          }
          // Otherwise show home/login page
          return <Home setIsAuthenticated={setIsAuthenticated} />;
        }} />
        
        <Route path="/chat" component={() => {
          // If not authenticated, redirect to home/login
          if (!isAuthenticated) {
            return <Redirect to="/" />;
          }
          // Otherwise show chat interface
          return <Chat />;
        }} />
        
        <Route component={NotFound} />
      </Switch>
      <Footer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
