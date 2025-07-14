import { useState } from 'react';
import { ApiKeySettings } from '@/components/ApiKeySettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('api-keys');

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
                  {/* Add more settings categories here as needed */}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="space-y-4">
            {activeTab === 'api-keys' && <ApiKeySettings />}
            {/* Add more settings tabs here as needed */}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}