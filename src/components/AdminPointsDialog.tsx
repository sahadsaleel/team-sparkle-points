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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Minus } from 'lucide-react';

interface AdminPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  currentPoints: number;
  onPointsUpdated: () => void;
}

const AdminPointsDialog = ({
  open,
  onOpenChange,
  memberId,
  memberName,
  currentPoints,
  onPointsUpdated,
}: AdminPointsDialogProps) => {
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdatePoints = async (add: boolean) => {
    if (!points || parseInt(points) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid points',
        description: 'Please enter a valid positive number',
      });
      return;
    }

    setLoading(true);

    const pointsValue = parseInt(points);
    const newPoints = add ? currentPoints + pointsValue : currentPoints - pointsValue;

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
      toast({
        title: 'Points updated!',
        description: `${add ? 'Added' : 'Subtracted'} ${pointsValue} points ${add ? 'to' : 'from'} ${memberName}`,
      });
      setPoints('');
      setReason('');
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
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              placeholder="Enter points amount"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why are you adjusting points?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleUpdatePoints(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Minus className="mr-2 h-4 w-4" />
            )}
            Subtract
          </Button>
          <Button
            onClick={() => handleUpdatePoints(true)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Points
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPointsDialog;
