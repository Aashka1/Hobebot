import { useLocation } from "wouter";
import { RiMentalHealthLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  isAuthenticated: boolean | null;
  setIsAuthenticated: (value: boolean) => void;
}

export default function Header({ isAuthenticated, setIsAuthenticated }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setIsAuthenticated(false);
      setLocation("/");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="w-full bg-white shadow-sm px-4 py-3">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center cursor-pointer" onClick={() => setLocation("/")}>
          <RiMentalHealthLine className="text-primary text-2xl mr-2" />
          <h1 className="text-xl font-semibold">HopeBot</h1>
        </div>
        
        {isAuthenticated && (
          <div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-neutral-100 rounded-full"
            >
              <span className="text-sm font-medium">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
