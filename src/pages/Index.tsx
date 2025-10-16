import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="mx-auto w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-glow">
          <Dumbbell className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-white">Fitness Center Management</h1>
        <p className="text-xl text-white/80">Professional gym management system</p>
        <Button onClick={() => navigate("/auth")} size="lg" className="bg-white text-primary hover:bg-white/90 shadow-primary">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
