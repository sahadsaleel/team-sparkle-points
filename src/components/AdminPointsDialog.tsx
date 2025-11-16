import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AdminPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  currentPoints: number;
  onPointsUpdated: () => void;
}

const pointReasons = [
  { label: 'Completing and uploading first (+5)', value: 'upload_first', points: 5 },
  { label: 'Uploading before 10 PM (+3)', value: 'upload_early', points: 3 },
  { label: 'No daily task for 2 days (-5)', value: 'no_task', points: -5 },
  { label: 'Joining session on time (+2)', value: 'on_time', points: 2 },
  { label: 'Late (5+ min without informing) (-5)', value: 'late', points: -5 },
];

const AdminPointsDialog = ({
  open,
  onOpenChange,
  memberId,
  memberName,
  currentPoints,
  onPointsUpdated,
}: AdminPointsDialogProps) => {
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdatePoints = async () => {
    if (selectedPoints === null) {
      toast({
        variant: 'destructive',
        title: 'Select points',
        description: 'Please select a point value',
      });
      return;
    }

    if (!selectedReason) {
      toast({
        variant: 'destructive',
        title: 'Select reason',
        description: 'Please select a reason for the point change',
      });
      return;
    }

    setLoading(true);

    const newPoints = currentPoints + selectedPoints;

    // Prevent negative points
    if (newPoints < 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot subtract',
        description: 'Points cannot go below zero',
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', memberId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      // Create log entry
      const reasonLabel = pointReasons.find(r => r.value === selectedReason)?.label || selectedReason;
      const fullReason = additionalNotes ? `${reasonLabel} - ${additionalNotes}` : reasonLabel;
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      await supabase.from('admin_logs').insert({
        member_id: memberId,
        member_name: memberName,
        points_changed: selectedPoints,
        reason: fullReason,
        admin_id: currentUser?.id || '',
      });

      toast({
        title: 'Points updated!',
        description: `${selectedPoints > 0 ? 'Added' : 'Subtracted'} ${Math.abs(selectedPoints)} points ${selectedPoints > 0 ? 'to' : 'from'} ${memberName}`,
      });
      setSelectedPoints(null);
      setSelectedReason('');
      setAdditionalNotes('');
      onPointsUpdated();
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Points</DialogTitle>
          <DialogDescription>
            Add or subtract points for {memberName}. Current points: {currentPoints}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Points</Label>
            <div className="flex gap-2">
              {[5, 3, 2].map((point) => (
                <Button
                  key={point}
                  type="button"
                  variant={selectedPoints === point ? 'default' : 'outline'}
                  onClick={() => setSelectedPoints(point)}
                  className="flex-1"
                >
                  +{point}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {[-5, -3, -2].map((point) => (
                <Button
                  key={point}
                  type="button"
                  variant={selectedPoints === point ? 'destructive' : 'outline'}
                  onClick={() => setSelectedPoints(point)}
                  className="flex-1"
                >
                  {point}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Select Reason</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {pointReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional context..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleUpdatePoints}
            disabled={loading || selectedPoints === null || !selectedReason}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Update Points
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPointsDialog;
