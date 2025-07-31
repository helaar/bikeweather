import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { StravaAuth } from '@/components/StravaAuth';

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">
            Innstillinger
          </h1>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tilkoblinger</CardTitle>
            </CardHeader>
            <CardContent>
              <StravaAuth />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Settings;