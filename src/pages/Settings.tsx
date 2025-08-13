import { useEffect, useState } from 'react';
import { ApiKeySettings } from '@/components/ApiKeySettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Eye, EyeOff, Mail, Settings as SettingsIcon, User, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getCurrentUser } from '@/services/authService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('api-keys');
  const [userEmail, setUserEmail] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        setUserEmail(user?.email || '');
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/">Back to Dashboard</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  <Button
                    variant={activeTab === 'api-keys' ? 'secondary' : 'ghost'}
                    className="justify-start rounded-none h-10"
                    onClick={() => setActiveTab('api-keys')}
                  >
                    API Keys
                  </Button>
                  <Button
                    variant={activeTab === 'account' ? 'secondary' : 'ghost'}
                    className="justify-start rounded-none h-10"
                    onClick={() => setActiveTab('account')}
                  >
                    Account
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="space-y-4">
            {activeTab === 'api-keys' && <ApiKeySettings />}
            {activeTab === 'account' && (
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>View your email and update your password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{userEmail || 'Not logged in'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="max-w-md"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        onClick={async () => {
                          try {
                            // Supabase requires update via auth api
                            const { supabase } = await import('@/integrations/supabase/client');
                            const { error } = await supabase.auth.updateUser({ password: newPassword });
                            if (error) throw error;
                            toast({ title: 'Password updated' });
                            setNewPassword('');
                            setShowPassword(false);
                          } catch (err) {
                            toast({ title: 'Failed to update password', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
                          }
                        }}
                        disabled={!newPassword || newPassword.length < 6}
                      >
                        Update Password
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}