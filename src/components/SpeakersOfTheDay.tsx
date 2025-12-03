import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";
import { Loader2, Mic } from "lucide-react";
import { toast } from "sonner";

interface Speaker {
  id: string;
  name: string;
  profile_picture: string | null;
}

export const SpeakersOfTheDay = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndSelectSpeakers = async () => {
      try {
        // Use IST timezone for date to match server expectations
        const today = formatInTimeZone(new Date(), "Asia/Kolkata", "yyyy-MM-dd");

        // 1. Check if speakers are already selected for today
        const { data: existingDaily, error: fetchError } = await supabase
          .from("daily_speakers")
          .select("member_ids")
          .eq("selected_date", today)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingDaily) {
          // Fetch profiles for existing speakers
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name, profile_picture")
            .in("id", existingDaily.member_ids);

          if (profilesError) throw profilesError;
          setSpeakers(profiles || []);
        } else {
          // 2. Select new speakers
          // Get all members
          const { data: allMembers, error: membersError } = await supabase
            .from("profiles")
            .select("id, name, profile_picture");

          if (membersError) throw membersError;

          if (!allMembers || allMembers.length === 0) {
            setSpeakers([]);
            return;
          }

          // Get recent history to avoid repetition
          const { data: history, error: historyError } = await supabase
            .from("speaker_history")
            .select("member_id, last_selected_date");

          if (historyError) throw historyError;

          // Filter eligible candidates (not spoken recently)
          // Exclude those who spoke in the last 14 days
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          const cutoffDate = formatInTimeZone(twoWeeksAgo, "Asia/Kolkata", "yyyy-MM-dd");

          let candidates = allMembers.filter(m => {
            const h = history?.find(h => h.member_id === m.id);
            if (!h) return true; // Never spoken
            return h.last_selected_date < cutoffDate; // Spoken long ago
          });

          // If we run out of candidates (everyone spoke recently), fallback to everyone
          if (candidates.length < 2) {
            candidates = allMembers;
          }

          // Shuffle candidates
          candidates = candidates.sort(() => 0.5 - Math.random());

          // Pick top 2
          const selected = candidates.slice(0, 2);
          const selectedIds = selected.map(s => s.id);

          // Save to daily_speakers
          const { error: insertError } = await supabase
            .from("daily_speakers")
            .insert({
              selected_date: today,
              member_ids: selectedIds
            });

          if (insertError) {
            // Handle race condition: if someone else inserted just now
            if (insertError.code === '23505') { // Unique violation
              // Retry fetch
              return fetchAndSelectSpeakers();
            }
            throw insertError;
          }

          // Update speaker_history
          for (const member of selected) {
            const { error: historyUpdateError } = await supabase
              .from("speaker_history")
              .upsert({
                member_id: member.id,
                last_selected_date: today,
                // We might want to increment count, but let's just set date for now
              });
            if (historyUpdateError) console.error("Error updating history", historyUpdateError);
          }

          setSpeakers(selected);
        }
      } catch (error) {
        console.error("Error in speakers logic:", error);
        toast.error("Failed to load speakers of the day");
      } finally {
        setLoading(false);
      }
    };

    fetchAndSelectSpeakers();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Speakers of the Day
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card via-card to-muted/30 border-border/50 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-transparent to-primary/5">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Mic className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Speakers of the Day</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {speakers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {speakers.map((speaker, index) => (
              <div
                key={speaker.id}
                className="group flex items-center gap-4 p-4 bg-gradient-to-br from-background to-muted/30 rounded-xl shadow-md border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Avatar className="h-14 w-14 border-2 border-primary/30 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                  <AvatarImage src={speaker.profile_picture || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                    {speaker.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-lg">{speaker.name}</p>
                  <p className="text-sm text-primary font-medium">Today's Speaker</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No speakers selected for today.</p>
        )}
      </CardContent>
    </Card>
  );
};
