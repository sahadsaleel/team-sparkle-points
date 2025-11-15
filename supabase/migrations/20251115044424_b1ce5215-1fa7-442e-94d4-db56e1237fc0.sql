-- Add yellow_cards and red_cards columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN yellow_cards integer NOT NULL DEFAULT 0,
ADD COLUMN red_cards integer NOT NULL DEFAULT 0;