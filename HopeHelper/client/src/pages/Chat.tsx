import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import ResourceSection from "@/components/ResourceSection";

export default function Chat() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/auth/status")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true);
        } else {
          // Redirect to home page if not authenticated
          setLocation("/");
        }
      })
      .catch(() => {
        setLocation("/");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
      <ChatInterface />
      <ResourceSection />
    </main>
  );
}
