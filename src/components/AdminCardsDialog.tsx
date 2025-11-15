import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
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

interface AdminCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardsUpdated: () => void;
}

interface Profile {
  id: string;
  name: string;
  points: number;
  yellow_cards: number;
  red_cards: number;
}

const AdminCardsDialog = ({
  open,
  onOpenChange,
  onCardsUpdated,
}: AdminCardsDialogProps) => {
  const [members, setMembers] = useState<Profile[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [cardType, setCardType] = useState<'yellow' | 'red' | ''>('');
  const [pointsToDeduct, setPointsToDeduct] = useState('5');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, points, yellow_cards, red_cards')
      .order('name');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load members',
      });
    } else {
      setMembers(data || []);
    }
    setLoadingMembers(false);
  };

  const handleGiveCard = async () => {
    if (!selectedMemberId) {
      toast({
        variant: 'destructive',
        title: 'Select member',
        description: 'Please select a member',
      });
      return;
    }

    if (!cardType) {
      toast({
        variant: 'destructive',
        title: 'Select card type',
        description: 'Please select Yellow or Red card',
      });
      return;
    }

    const selectedMember = members.find((m) => m.id === selectedMemberId);
    if (!selectedMember) return;

    setLoading(true);

    try {
      let updateData: any = {};
      
      if (cardType === 'yellow') {
        updateData = {
          yellow_cards: selectedMember.yellow_cards + 1,
        };
      } else if (cardType === 'red') {
        const deductPoints = parseInt(pointsToDeduct) || 5;
        const newPoints = Math.max(0, selectedMember.points - deductPoints);
        
        updateData = {
          red_cards: selectedMember.red_cards + 1,
          points: newPoints,
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedMemberId);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      } else {
        toast({
          title: 'Card given!',
          description: `${cardType === 'yellow' ? 'Yellow' : 'Red'} card given to ${selectedMember.name}${
            cardType === 'red' ? ` (-${pointsToDeduct} points)` : ''
          }`,
        });
        setSelectedMemberId('');
        setCardType('');
        setPointsToDeduct('5');
        onCardsUpdated();
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to give card',
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Cards</DialogTitle>
          <DialogDescription>
            Give yellow or red cards to members for Malayalam usage during class time (9:00 AM – 5:30 PM)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="member">Select Member</Label>
            {loadingMembers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger id="member">
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardType">Card Type</Label>
            <Select value={cardType} onValueChange={(value) => setCardType(value as 'yellow' | 'red')}>
              <SelectTrigger id="cardType">
                <SelectValue placeholder="Select card type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yellow">Yellow Card</SelectItem>
                <SelectItem value="red">Red Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {cardType === 'red' && (
            <div className="space-y-2">
              <Label htmlFor="points">Points to Deduct</Label>
              <Input
                id="points"
                type="number"
                min="0"
                value={pointsToDeduct}
                onChange={(e) => setPointsToDeduct(e.target.value)}
                placeholder="Enter points to deduct"
              />
              <p className="text-sm text-muted-foreground">Default: 5 points</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleGiveCard}
            disabled={loading || !selectedMemberId || !cardType}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Give Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCardsDialog;
