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

interface MembershipTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: any;
  onSuccess: () => void;
}

const MembershipTypeDialog = ({ open, onOpenChange, type, onSuccess }: MembershipTypeDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_months: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (type) {
      setFormData({
        name: type.name || "",
        description: type.description || "",
        duration_months: type.duration_months?.toString() || "",
        price: type.price?.toString() || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        duration_months: "",
        price: "",
      });
    }
  }, [type, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        duration_months: parseInt(formData.duration_months),
        price: parseFloat(formData.price),
      };

      if (type) {
        const { error } = await supabase
          .from("membership_types")
          .update(data)
          .eq("id", type.id);

        if (error) throw error;
        toast({ title: "Membership type updated successfully" });
      } else {
        const { error } = await supabase.from("membership_types").insert([data]);

        if (error) throw error;
        toast({ title: "Membership type created successfully" });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type ? "Edit Membership Type" : "Add Membership Type"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Premium Membership"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the membership..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_months">Duration (months) *</Label>
              <Input
                id="duration_months"
                type="number"
                value={formData.duration_months}
                onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-accent hover:opacity-90">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipTypeDialog;
