import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { LogOut, Users, Salad, Dumbbell as DumbbellIcon, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import AssignedMembers from "./trainer/AssignedMembers";
import WorkoutPlansManagement from "./trainer/WorkoutPlansManagement";
import DietPlansManagement from "./trainer/DietPlansManagement";

interface TrainerDashboardProps {
  user: User;
}

const TrainerDashboard = ({ user }: TrainerDashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<string>("members");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/auth");
  };

  const menuItems = [
    { id: "members", label: "My Members", icon: Users },
    { id: "workout-plans", label: "Workout Plans", icon: Activity },
    { id: "diet-plans", label: "Diet Plans", icon: Salad },
  ];

  const renderContent = () => {
    switch (activeView) {
      case "members":
        return <AssignedMembers userId={user.id} />;
      case "workout-plans":
        return <WorkoutPlansManagement userId={user.id} />;
      case "diet-plans":
        return <DietPlansManagement userId={user.id} />;
      default:
        return <AssignedMembers userId={user.id} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r">
          <SidebarContent>
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
                  <DumbbellIcon className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Fitness Center</h2>
                  <p className="text-xs text-muted-foreground">Trainer Portal</p>
                </div>
              </div>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(item.id)}
                        isActive={activeView === item.id}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TrainerDashboard;
