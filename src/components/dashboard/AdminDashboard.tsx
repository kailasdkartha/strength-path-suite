import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { LogOut, Users, UserPlus, CreditCard, Activity, FileText, Dumbbell } from "lucide-react";
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
import MembersManagement from "./admin/MembersManagement";
import TrainersManagement from "./admin/TrainersManagement";
import MembershipTypesManagement from "./admin/MembershipTypesManagement";
import MembershipsManagement from "./admin/MembershipsManagement";
import ReportsView from "./admin/ReportsView";
import DashboardOverview from "./admin/DashboardOverview";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<string>("overview");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/auth");
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "members", label: "Members", icon: Users },
    { id: "trainers", label: "Trainers", icon: UserPlus },
    { id: "membership-types", label: "Membership Types", icon: CreditCard },
    { id: "memberships", label: "Memberships", icon: Dumbbell },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <DashboardOverview />;
      case "members":
        return <MembersManagement />;
      case "trainers":
        return <TrainersManagement />;
      case "membership-types":
        return <MembershipTypesManagement />;
      case "memberships":
        return <MembershipsManagement />;
      case "reports":
        return <ReportsView />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r">
          <SidebarContent>
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Fitness Center</h2>
                  <p className="text-xs text-muted-foreground">Admin Portal</p>
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

export default AdminDashboard;
