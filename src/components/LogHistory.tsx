import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";
import { History, Loader2 } from "lucide-react";

interface Log {
    id: string;
    created_at: string;
    admin_id: string;
    member_name: string;
    points_changed: number;
    reason: string;
}

export const LogHistory = () => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data, error } = await supabase
                    .from("admin_logs")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(50);

                if (error) throw error;

                setLogs(data || []);
            } catch (error) {
                console.error("Error fetching logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Log History
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Member</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Reason</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {formatInTimeZone(
                                                new Date(log.created_at),
                                                "Asia/Kolkata",
                                                "MMM d, HH:mm"
                                            )}
                                        </TableCell>

                                        <TableCell>{log.member_name}</TableCell>

                                        <TableCell
                                            className={
                                                log.points_changed > 0
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }
                                        >
                                            {log.points_changed > 0 ? "+" : ""}
                                            {log.points_changed}
                                        </TableCell>

                                        <TableCell>{log.reason}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center py-4 text-muted-foreground"
                                    >
                                        No logs found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};
