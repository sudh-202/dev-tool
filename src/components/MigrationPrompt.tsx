import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { migrateLocalStorageToSupabase } from '@/utils/migrationUtils';
import { toast } from '@/hooks/use-toast';

interface MigrationPromptProps {
  onComplete: () => void;
}

export function MigrationPrompt({ onComplete }: MigrationPromptProps) {
  const [loading, setLoading] = useState(false);

  const handleMigrate = async () => {
    setLoading(true);
    try {
      const result = await migrateLocalStorageToSupabase();
      
      if (result.success) {
        if (result.count > 0) {
          toast({
            title: 'Migration successful',
            description: `${result.count} tools have been migrated to your account.`,
          });
          
          // Mark migration as completed in localStorage
          localStorage.setItem('migration-completed', 'true');
        } else {
          toast({
            title: 'No data to migrate',
            description: 'No tools were found in localStorage to migrate.',
          });
        }
        onComplete();
      } else {
        toast({
          title: 'Migration failed',
          description: result.error || 'Failed to migrate tools. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Migration error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Mark migration as skipped but completed
    localStorage.setItem('migration-completed', 'true');
    onComplete();
  };

  return (
    <div className="py-2">
      <p className="text-sm text-muted-foreground mb-4">
        Migrating will store your tools securely in your account, making them accessible from any device when you log in.
      </p>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handleSkip} disabled={loading}>
          Skip
        </Button>
        <Button onClick={handleMigrate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrating...
            </>
          ) : (
            'Migrate Tools'
          )}
        </Button>
      </div>
    </div>
  );
} 