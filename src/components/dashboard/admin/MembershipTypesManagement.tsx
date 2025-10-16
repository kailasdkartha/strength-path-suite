import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import MembershipTypeDialog from "./membership-types/MembershipTypeDialog";

interface MembershipType {
  id: string;
  name: string;
  description: string | null;
  duration_months: number;
  price: number;
}

const MembershipTypesManagement = () => {
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [selectedType, setSelectedType] = useState<MembershipType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    const { data, error } = await supabase
      .from("membership_types")
      .select("*")
      .order("price", { ascending: true });

    if (error) {
      toast({
        title: "Error fetching membership types",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTypes(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this membership type?")) return;

    const { error } = await supabase.from("membership_types").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting membership type",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Membership type deleted successfully" });
    fetchTypes();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Membership Types</h1>
          <p className="text-muted-foreground">Manage membership plans</p>
        </div>
        <Button onClick={() => { setSelectedType(null); setDialogOpen(true); }} className="bg-gradient-accent hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Add Type
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell>{type.description || "N/A"}</TableCell>
                <TableCell>{type.duration_months} months</TableCell>
                <TableCell>${type.price.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedType(type); setDialogOpen(true); }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(type.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MembershipTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={selectedType}
        onSuccess={fetchTypes}
      />
    </div>
  );
};

export default MembershipTypesManagement;
