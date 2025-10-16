import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface TrainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainer: any;
  onSuccess: () => void;
}

const TrainerDialog = ({ open, onOpenChange, trainer, onSuccess }: TrainerDialogProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    specialization: "",
    experience_years: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (trainer) {
      setFormData({
        email: trainer.profiles?.email || "",
        password: "",
        full_name: trainer.profiles?.full_name || "",
        specialization: trainer.specialization || "",
        experience_years: trainer.experience_years?.toString() || "",
        bio: trainer.bio || "",
      });
    } else {
      setFormData({
        email: "",
        password: "",
        full_name: "",
        specialization: "",
        experience_years: "",
        bio: "",
      });
    }
  }, [trainer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (trainer) {
        // Update existing trainer
        const { error: trainerError } = await supabase
          .from("trainers")
          .update({
            specialization: formData.specialization,
            experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
            bio: formData.bio,
          })
          .eq("id", trainer.id);

        if (trainerError) throw trainerError;

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
          })
          .eq("id", trainer.user_id);

        if (profileError) throw profileError;

        toast({ title: "Trainer updated successfully" });
      } else {
        // Create new trainer account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
            },
          },
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("User creation failed");

        // Add trainer role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{ user_id: authData.user.id, role: "trainer" }]);

        if (roleError) throw roleError;

        // Create trainer record
        const { error: trainerError } = await supabase
          .from("trainers")
          .insert([{
            user_id: authData.user.id,
            specialization: formData.specialization,
            experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
            bio: formData.bio,
          }]);

        if (trainerError) throw trainerError;

        toast({ title: "Trainer created successfully" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{trainer ? "Edit Trainer" : "Add Trainer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {!trainer && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </>
            )}

            <div className="space-y-2 col-span-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., Weight Training, Yoga"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_years">Experience (years)</Label>
              <Input
                id="experience_years"
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief description of the trainer..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-secondary hover:opacity-90">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TrainerDialog;
