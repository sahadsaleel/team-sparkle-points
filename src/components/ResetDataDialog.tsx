import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ResetDataDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDataReset: () => void;
}

type ResetType = 'points' | 'cards' | 'all' | null;

export const ResetDataDialog = ({ open, onOpenChange, onDataReset }: ResetDataDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [confirmType, setConfirmType] = useState<ResetType>(null);
    const { toast } = useToast();

    const handleReset = async (type: 'points' | 'cards' | 'all') => {
        setConfirmType(type);
    };

    const executeReset = async () => {
        if (!confirmType) return;

        try {
            setLoading(true);
            let updateData = {};
            let successMessage = '';

            switch (confirmType) {
                case 'points':
                    updateData = { points: 0 };
                    successMessage = 'All points have been reset to 0';
                    break;
                case 'cards':
                    updateData = { yellow_cards: 0, red_cards: 0 };
                    successMessage = 'All cards have been reset to 0';
                    break;
                case 'all':
                    updateData = { points: 0, yellow_cards: 0, red_cards: 0 };
                    successMessage = 'All data has been reset';
                    break;
            }

            // We need to update all rows. Since Supabase update requires a WHERE clause usually,
            // or we can use a condition that is always true if RLS allows it.
            // Assuming RLS allows admin to update all profiles.
            // A common trick to update all rows is to use a condition that matches all, e.g., id is not null.
            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Effectively all valid UUIDs

            if (error) throw error;

            toast({
                title: 'Success',
                description: successMessage,
            });

            onDataReset();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error resetting data:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to reset data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
            setConfirmType(null);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5" />
                            Reset Data
                        </DialogTitle>
                        <DialogDescription>
                            Choose what data you want to reset for ALL members. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Button
                            variant="outline"
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReset('points')}
                            disabled={loading}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset All Points
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReset('cards')}
                            disabled={loading}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset All Cards (Yellow/Red)
                        </Button>

                        <Button
                            variant="destructive"
                            className="w-full justify-start"
                            onClick={() => handleReset('all')}
                            disabled={loading}
                        >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Reset Everything
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!confirmType} onOpenChange={(open) => !open && setConfirmType(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will reset {confirmType === 'all' ? 'ALL data' : `all ${confirmType}`} for every member in the database.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeReset}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {loading ? 'Resetting...' : 'Yes, Reset All'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
