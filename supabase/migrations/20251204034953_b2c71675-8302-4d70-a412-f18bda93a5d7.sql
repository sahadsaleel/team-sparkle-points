-- Allow all authenticated users to view admin logs
CREATE POLICY "Authenticated users can view logs"
ON public.admin_logs
FOR SELECT
USING (auth.uid() IS NOT NULL);