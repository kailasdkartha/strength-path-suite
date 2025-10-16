import { useEffect, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VitalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
}

const VitalsDialog = ({ open, onOpenChange, member }: VitalsDialogProps) => {
  const [vitals, setVitals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    height_cm: "",
    weight_kg: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (member && open) {
      fetchVitals();
    }
  }, [member, open]);

  const fetchVitals = async () => {
    const { data, error } = await supabase
      .from("member_vitals")
      .select("*")
      .eq("member_id", member.id)
      .order("recorded_date", { ascending: false });

    if (error) {
      toast({ title: "Error fetching vitals", description: error.message, variant: "destructive" });
      return;
    }

    setVitals(data || []);
  };

  const calculateBMI = (height: number, weight: number) => {
    if (height > 0 && weight > 0) {
      const heightM = height / 100;
      return (weight / (heightM * heightM)).toFixed(2);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const height = parseFloat(formData.height_cm);
      const weight = parseFloat(formData.weight_kg);
      const bmi = calculateBMI(height, weight);

      const { error } = await supabase.from("member_vitals").insert([{
        member_id: member.id,
        height_cm: height,
        weight_kg: weight,
        bmi: bmi ? parseFloat(bmi) : null,
        notes: formData.notes,
      }]);

      if (error) throw error;

      toast({ title: "Vitals recorded successfully" });
      setFormData({ height_cm: "", weight_kg: "", notes: "" });
      fetchVitals();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Member Vitals - {member?.full_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 border-b pb-4">
          <h3 className="font-semibold">Record New Vitals</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height_cm">Height (cm)</Label>
              <Input
                id="height_cm"
                type="number"
                step="0.01"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight_kg">Weight (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.01"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bmi">BMI (Auto-calculated)</Label>
              <Input
                id="bmi"
                value={calculateBMI(parseFloat(formData.height_cm), parseFloat(formData.weight_kg)) || ""}
                disabled
              />
            </div>

            <div className="space-y-2 col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="bg-gradient-primary hover:opacity-90">
            {loading ? "Saving..." : "Record Vitals"}
          </Button>
        </form>

        <div className="space-y-4">
          <h3 className="font-semibold">Vitals History</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Height (cm)</TableHead>
                  <TableHead>Weight (kg)</TableHead>
                  <TableHead>BMI</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vitals.map((vital) => (
                  <TableRow key={vital.id}>
                    <TableCell>{new Date(vital.recorded_date).toLocaleDateString()}</TableCell>
                    <TableCell>{vital.height_cm}</TableCell>
                    <TableCell>{vital.weight_kg}</TableCell>
                    <TableCell>{vital.bmi?.toFixed(2)}</TableCell>
                    <TableCell>{vital.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VitalsDialog;
