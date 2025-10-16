import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MembershipDialog from "./memberships/MembershipDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MembershipsManagement = () => {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    const { data, error } = await supabase
      .from("memberships")
      .select("*, members(full_name), membership_types(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setMemberships(data || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Memberships</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Enroll Member
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>End Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberships.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.members?.full_name}</TableCell>
              <TableCell>{m.membership_types?.name}</TableCell>
              <TableCell>{m.status}</TableCell>
              <TableCell>{new Date(m.end_date).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <MembershipDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchMemberships} />
    </div>
  );
};

export default MembershipsManagement;
