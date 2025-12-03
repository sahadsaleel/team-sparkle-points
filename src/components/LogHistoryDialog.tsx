import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatInTimeZone } from 'date-fns-tz';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Log {
  id: string;
  member_name: string;
  points_changed: number;
  reason: string;
  created_at: string;
}

interface GroupedLogs {
  [date: string]: Log[];
}

export const LogHistoryDialog = ({ open, onOpenChange }: LogHistoryDialogProps) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAllLogs();
    }
  }, [open]);

  const fetchAllLogs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch admin logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Group logs by date (IST)
  const groupedLogs: GroupedLogs = logs.reduce((acc, log) => {
    const dateKey = formatInTimeZone(new Date(log.created_at), 'Asia/Kolkata', 'dd-MM-yyyy');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(log);
    return acc;
  }, {} as GroupedLogs);

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => {
    // Parse dd-MM-yyyy format for sorting
    const [dayA, monthA, yearA] = a.split('-').map(Number);
    const [dayB, monthB, yearB] = b.split('-').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Log History (IST)</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No logs found</div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 font-semibold text-foreground border-b border-border">
                    {date}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Time</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead className="w-24">Points</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedLogs[date].map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap font-mono text-sm">
                            {formatInTimeZone(new Date(log.created_at), 'Asia/Kolkata', 'hh:mm a')}
                          </TableCell>
                          <TableCell>{log.member_name}</TableCell>
                          <TableCell className={log.points_changed > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {log.points_changed > 0 ? '+' : ''}{log.points_changed}
                          </TableCell>
                          <TableCell>{log.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
