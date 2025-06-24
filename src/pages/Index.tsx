
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Route, Calendar, Wind } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-500 rounded-full">
              {/* Partly cloudy emoji icon */}
              <span className="text-5xl" role="img" aria-label="Partly cloudy">⛅</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-800">
            Sykkelvær
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto">
            Få detaljerte værvarsler for sykkelturen basert på ruter fra Strava og værdata fra Yr
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <Card>
            <CardHeader className="pb-3">
              <Route className="h-8 w-8 text-blue-500 mx-auto" />
              <CardTitle className="text-lg">Strava integrasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Legg inn din Strava-rute og få værdata langs hele turen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Wind className="h-8 w-8 text-green-500 mx-auto" />
              <CardTitle className="text-lg">Yr værtjeneste</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Presise værvarsler fra Meteorologisk institutt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Calendar className="h-8 w-8 text-purple-500 mx-auto" />
              <CardTitle className="text-lg">Planlegg turen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Velg dato, varighet og få værdata tilpasset din hastighet
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="pt-8">
          <Button 
            size="lg" 
            onClick={() => navigate('/weather')}
            className="px-8 py-3 text-lg"
          >
            Start planlegging
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
