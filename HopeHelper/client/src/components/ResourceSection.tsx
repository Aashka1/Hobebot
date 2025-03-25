import { useEffect, useState } from "react";
import { 
  RiArticleLine, 
  RiFirstAidKitLine, 
  RiMentalHealthLine, 
  RiHeartPulseLine 
} from "react-icons/ri";
import { Resource } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function ResourceSection() {
  const [resources, setResources] = useState<Resource[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch("/api/resources");
      if (!response.ok) {
        throw new Error("Failed to load resources");
      }
      const data = await response.json();
      setResources(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load mental health resources",
        variant: "destructive",
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "article-line":
        return <RiArticleLine className="text-primary mr-2" />;
      case "first-aid-kit-line":
        return <RiFirstAidKitLine className="text-primary mr-2" />;
      case "mental-health-line":
        return <RiMentalHealthLine className="text-primary mr-2" />;
      case "heart-pulse-line":
        return <RiHeartPulseLine className="text-primary mr-2" />;
      default:
        return <RiArticleLine className="text-primary mr-2" />;
    }
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-4">
      <h3 className="font-medium text-lg mb-3">Mental Health Resources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resources.map((resource) => (
          <a 
            key={resource.id}
            href={resource.url} 
            className="flex items-center p-3 border border-neutral-200 rounded-md hover:bg-neutral-50 transition"
          >
            {getIconComponent(resource.icon)}
            <span className="text-sm">{resource.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
