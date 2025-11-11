import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mic, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  name: string;
  profile_picture: string | null;
}

const TodaySpeakers = () => {
  const [speakers, setSpeakers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [reshuffling, setReshuffling] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchTodaySpeakers = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we already have speakers for today
      const { data: dailySpeakers } = await supabase
        .from('daily_speakers')
        .select('member_ids')
        .eq('selected_date', today)
        .maybeSingle();

      if (dailySpeakers?.member_ids && dailySpeakers.member_ids.length > 0) {
        // Fetch the profiles for these speakers
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, profile_picture')
          .in('id', dailySpeakers.member_ids);
        
        setSpeakers(profiles || []);
      } else {
        // No speakers selected yet, select 2 random members
        await selectRandomSpeakers();
      }
    } catch (error) {
      console.error('Error fetching speakers:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectRandomSpeakers = async () => {
    try {
      // Get all profiles
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, name, profile_picture');

      if (!allProfiles || allProfiles.length === 0) return;

      // Get speaker history to find who hasn't spoken recently
      const { data: history } = await supabase
        .from('speaker_history')
        .select('member_id, selection_count')
        .order('selection_count', { ascending: true })
        .order('last_selected_date', { ascending: true });

      // Create a set of members who have spoken
      const spokenMembers = new Set(history?.map(h => h.member_id) || []);
      
      // Get members who haven't spoken yet
      const unspokenMembers = allProfiles.filter(p => !spokenMembers.has(p.id));
      
      let selectedMembers: Profile[];
      
      if (unspokenMembers.length >= 2) {
        // Select from unspoken members
        selectedMembers = unspokenMembers
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
      } else if (unspokenMembers.length === 1) {
        // One unspoken member + one from spoken (least recent)
        const leastRecentSpoken = allProfiles
          .filter(p => spokenMembers.has(p.id))
          .sort((a, b) => {
            const aHistory = history?.find(h => h.member_id === a.id);
            const bHistory = history?.find(h => h.member_id === b.id);
            return (aHistory?.selection_count || 0) - (bHistory?.selection_count || 0);
          })[0];
        selectedMembers = [unspokenMembers[0], leastRecentSpoken];
      } else {
        // All have spoken, reset and select 2 least recent
        const sortedByCount = allProfiles
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        selectedMembers = sortedByCount;
      }

      // Save to database
      const today = new Date().toISOString().split('T')[0];
      const memberIds = selectedMembers.map(m => m.id);

      await supabase
        .from('daily_speakers')
        .upsert({
          selected_date: today,
          member_ids: memberIds,
        });

      // Update speaker history
      for (const member of selectedMembers) {
        const { data: existing } = await supabase
          .from('speaker_history')
          .select('selection_count')
          .eq('member_id', member.id)
          .maybeSingle();

        await supabase
          .from('speaker_history')
          .upsert({
            member_id: member.id,
            last_selected_date: today,
            selection_count: (existing?.selection_count || 0) + 1,
          });
      }

      setSpeakers(selectedMembers);
    } catch (error) {
      console.error('Error selecting speakers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to select speakers',
      });
    }
  };

  const handleReshuffle = async () => {
    setReshuffling(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Delete today's selection
      await supabase
        .from('daily_speakers')
        .delete()
        .eq('selected_date', today);

      // Select new speakers
      await selectRandomSpeakers();

      toast({
        title: 'Success',
        description: 'New speakers selected!',
      });
    } catch (error) {
      console.error('Error reshuffling:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reshuffle speakers',
      });
    } finally {
      setReshuffling(false);
    }
  };

  useEffect(() => {
    fetchTodaySpeakers();
  }, []);

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Today's Speakers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Today's Speakers
        </CardTitle>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReshuffle}
            disabled={reshuffling}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${reshuffling ? 'animate-spin' : ''}`} />
            Reshuffle
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Selected for personalized self-introduction
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {speakers.map((speaker, index) => (
            <div
              key={speaker.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-accent/20 border border-accent/30 hover:bg-accent/30 transition-colors animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarImage src={speaker.profile_picture || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(speaker.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{speaker.name}</h3>
                <p className="text-sm text-muted-foreground">Speaker {index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaySpeakers;
