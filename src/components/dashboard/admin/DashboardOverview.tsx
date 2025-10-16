import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, CreditCard, TrendingUp } from "lucide-react";

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalTrainers: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [members, trainers, activeMemberships, revenue] = await Promise.all([
      supabase.from("members").select("*", { count: "exact", head: true }),
      supabase.from("trainers").select("*", { count: "exact", head: true }),
      supabase.from("memberships").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("memberships").select("payment_amount")
        .gte("payment_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
    ]);

    const totalRevenue = revenue.data?.reduce((sum, m) => sum + Number(m.payment_amount), 0) || 0;

    setStats({
      totalMembers: members.count || 0,
      totalTrainers: trainers.count || 0,
      activeMembers: activeMemberships.count || 0,
      monthlyRevenue: totalRevenue,
    });
  };

  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      gradient: "bg-gradient-primary",
    },
    {
      title: "Total Trainers",
      value: stats.totalTrainers,
      icon: UserPlus,
      gradient: "bg-gradient-secondary",
    },
    {
      title: "Active Memberships",
      value: stats.activeMembers,
      icon: CreditCard,
      gradient: "bg-gradient-accent",
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      icon: TrendingUp,
      gradient: "bg-gradient-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to the admin dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 ${stat.gradient} rounded-lg flex items-center justify-center shadow-primary`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardOverview;
