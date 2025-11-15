import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MemberCard from '@/components/MemberCard';
import AdminPointsDialog from '@/components/AdminPointsDialog';
import AdminCardsDialog from '@/components/AdminCardsDialog';
import TodaySpeakers from '@/components/TodaySpeakers';
import { Button } from '@/components/ui/button';
import { LogOut, Trophy, Users, Award, SquareActivity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  profile_picture: string | null;
  points: number;
  yellow_cards: number;
  red_cards: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [cardsDialogOpen, setCardsDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('points', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load members',
      });
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchProfiles();

      // Subscribe to realtime updates
      const channel = supabase
        .channel('profiles-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
          },
          () => {
            fetchProfiles();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">BCK228 Dashboard</h1>
                <p className="text-sm text-muted-foreground">Communication Session Points</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/points-system')}>
                <Award className="w-4 h-4 mr-2" />
                Point System
              </Button>
              {isAdmin && (
                <Button variant="outline" onClick={() => setCardsDialogOpen(true)}>
                  <SquareActivity className="w-4 h-4 mr-2" />
                  Manage Cards
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout} className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Speakers of the Day Section */}
        <div className="mb-8">
          <TodaySpeakers />
        </div>

        {/* Stats Section */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {profiles[0]?.points || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? 'Your Role' : 'Your Rank'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {isAdmin
                    ? 'Admin'
                    : `#${profiles.findIndex((p) => p.id === user?.id) + 1}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Leaderboard</h2>
          <p className="text-muted-foreground">Top performers this session</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profiles.map((profile, index) => (
            <MemberCard
              key={profile.id}
              name={profile.name}
              points={profile.points}
              profilePicture={profile.profile_picture || undefined}
              rank={index + 1}
              isCurrentUser={profile.id === user?.id}
              showManage={isAdmin}
              onManagePoints={() => setSelectedMember(profile)}
              yellowCards={profile.yellow_cards}
              redCards={profile.red_cards}
            />
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No members yet</h3>
            <p className="text-muted-foreground">
              Be the first to join the team!
            </p>
          </div>
        )}
      </main>

      {/* Admin Points Dialog */}
      {selectedMember && (
        <AdminPointsDialog
          open={!!selectedMember}
          onOpenChange={(open) => !open && setSelectedMember(null)}
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          currentPoints={selectedMember.points}
          onPointsUpdated={fetchProfiles}
        />
      )}

      {/* Admin Cards Dialog */}
      <AdminCardsDialog
        open={cardsDialogOpen}
        onOpenChange={setCardsDialogOpen}
        onCardsUpdated={fetchProfiles}
      />
    </div>
  );
};

export default Dashboard;
