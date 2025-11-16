-- Create admin_logs table for tracking point changes
CREATE TABLE public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  points_changed INTEGER NOT NULL,
  reason TEXT NOT NULL,
  admin_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all logs" 
ON public.admin_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert logs" 
ON public.admin_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries on created_at
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at DESC);