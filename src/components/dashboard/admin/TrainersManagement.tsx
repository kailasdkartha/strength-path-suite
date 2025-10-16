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
import TrainerDialog from "./trainers/TrainerDialog";

interface Trainer {
  id: string;
  user_id: string;
  specialization: string | null;
  experience_years: number | null;
  bio: string | null;
  profiles: {
    full_name: string;
    email: string;
  };
}

const TrainersManagement = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    const { data, error } = await supabase
      .from("trainers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching trainers",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Fetch profiles separately
    const trainersWithProfiles = await Promise.all(
      (data || []).map(async (trainer) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", trainer.user_id)
          .single();
        
        return { ...trainer, profiles: profile || { full_name: "N/A", email: "N/A" } };
      })
    );

    setTrainers(trainersWithProfiles);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trainer?")) return;

    const { error } = await supabase.from("trainers").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting trainer",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Trainer deleted successfully" });
    fetchTrainers();
  };

  const handleEdit = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedTrainer(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trainers Management</h1>
          <p className="text-muted-foreground">Manage fitness trainers</p>
        </div>
        <Button onClick={handleAdd} className="bg-gradient-secondary hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Add Trainer
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell className="font-medium">{trainer.profiles?.full_name}</TableCell>
                <TableCell>{trainer.profiles?.email}</TableCell>
                <TableCell>{trainer.specialization || "N/A"}</TableCell>
                <TableCell>{trainer.experience_years ? `${trainer.experience_years} years` : "N/A"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(trainer)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(trainer.id)}
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

      <TrainerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        trainer={selectedTrainer}
        onSuccess={fetchTrainers}
      />
    </div>
  );
};

export default TrainersManagement;
