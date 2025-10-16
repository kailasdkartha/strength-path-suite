import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const MembershipDialog = ({ open, onOpenChange, onSuccess }: any) => {
  const [members, setMembers] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [formData, setFormData] = useState({ member_id: "", type_id: "", trainer_id: "", payment: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      supabase.from("members").select("*").then(({ data }) => setMembers(data || []));
      supabase.from("membership_types").select("*").then(({ data }) => setTypes(data || []));
      supabase.from("trainers").select("*").then(({ data }) => setTrainers(data || []));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const type = types.find(t => t.id === formData.type_id);
    if (!type) return;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + type.duration_months);

    const { error } = await supabase.from("memberships").insert([{
      member_id: formData.member_id,
      membership_type_id: formData.type_id,
      trainer_id: formData.trainer_id || null,
      end_date: endDate.toISOString().split('T')[0],
      payment_amount: parseFloat(formData.payment),
    }]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Membership created successfully" });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Enroll Member</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Member</Label>
            <Select value={formData.member_id} onValueChange={(v) => setFormData({ ...formData, member_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Membership Type</Label>
            <Select value={formData.type_id} onValueChange={(v) => setFormData({ ...formData, type_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Trainer (Optional)</Label>
            <Select value={formData.trainer_id} onValueChange={(v) => setFormData({ ...formData, trainer_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {trainers.map(t => <SelectItem key={t.id} value={t.id}>Trainer {t.id.slice(0,8)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment Amount</Label>
            <Input type="number" step="0.01" value={formData.payment} onChange={(e) => setFormData({ ...formData, payment: e.target.value })} required />
          </div>
          <Button type="submit" className="w-full bg-gradient-primary">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipDialog;
