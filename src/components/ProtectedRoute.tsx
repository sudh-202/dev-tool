import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '@/services/authService';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        const authed = await isLoggedIn();
        console.log("Authentication status:", authed);
        
        setAuthenticated(authed);
        
        if (!authed) {
          toast({
            title: "Authentication required",
            description: "Please log in to access this page",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Authentication check error:", error);
        setAuthenticated(false);
        toast({
          title: "Authentication error",
          description: "Failed to check authentication status",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
} 