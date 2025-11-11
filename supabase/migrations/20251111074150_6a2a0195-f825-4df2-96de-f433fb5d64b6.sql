-- Create table to track daily speaker selections
CREATE TABLE public.daily_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  selected_date date NOT NULL DEFAULT CURRENT_DATE,
  member_ids uuid[] NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(selected_date)
);

-- Enable RLS
ALTER TABLE public.daily_speakers ENABLE ROW LEVEL SECURITY;

-- Anyone can view daily speakers
CREATE POLICY "Anyone can view daily speakers"
ON public.daily_speakers
FOR SELECT
USING (true);

-- Only admins can manage daily speakers
CREATE POLICY "Admins can manage daily speakers"
ON public.daily_speakers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table to track speaker history for cycling
CREATE TABLE public.speaker_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_selected_date date NOT NULL,
  selection_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(member_id)
);

-- Enable RLS
ALTER TABLE public.speaker_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view speaker history
CREATE POLICY "Anyone can view speaker history"
ON public.speaker_history
FOR SELECT
USING (true);

-- Only admins can manage speaker history
CREATE POLICY "Admins can manage speaker history"
ON public.speaker_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_speaker_history_updated_at
BEFORE UPDATE ON public.speaker_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();