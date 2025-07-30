import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { StravaIcon } from '@/components/icons/StravaIcon';
import { StravaRoutes } from '@/components/StravaRoutes';
import { StravaAuth } from '@/components/StravaAuth';
import { useStrava } from '@/hooks/use-strava';

interface RouteSelectionModalProps {
  onRouteSelect: (gpxFile: File, routeName: string, routeDistance?: number) => void;
  trigger?: React.ReactNode;
  initialTab?: string;
}

export const RouteSelectionModal: React.FC<RouteSelectionModalProps> = ({
  onRouteSelect,
  trigger = <Button>Velg rute</Button>,
  initialTab = 'upload'
}) => {
  const { isAuthenticated } = useStrava();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [open, setOpen] = useState(false);
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [routeName, setRouteName] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.gpx')) {
      setGpxFile(file);
      setRouteName(file.name.replace('.gpx', ''));
      
      // Calculate route length from GPX file
      try {
        const gpxText = await file.text();
        const parser = new DOMParser();
        const gpxDoc = parser.parseFromString(gpxText, 'application/xml');
        
        // Extract track points from GPX
        const trackPoints = Array.from(gpxDoc.querySelectorAll('trkpt')).map(point => ({
          lat: parseFloat(point.getAttribute('lat') || '0'),
          lon: parseFloat(point.getAttribute('lon') || '0')
        }));
        
        if (trackPoints.length > 0) {
          // Calculate route length using Haversine formula
          let totalDistance = 0;
          for (let i = 0; i < trackPoints.length - 1; i++) {
            totalDistance += calculateDistance(
              trackPoints[i].lat, trackPoints[i].lon,
              trackPoints[i+1].lat, trackPoints[i+1].lon
            );
          }
          
          // Convert to meters for consistency with Strava routes
          const routeDistance = totalDistance * 1000;
          
          // Close the modal and pass the file to the parent component
          setOpen(false);
          onRouteSelect(file, routeName, routeDistance);
        } else {
          // Close the modal and pass the file to the parent component without distance
          setOpen(false);
          onRouteSelect(file, routeName);
        }
      } catch (error) {
        console.error('Error calculating route length:', error);
        // Close the modal and pass the file to the parent component without distance
        setOpen(false);
        onRouteSelect(file, routeName);
      }
    } else {
      alert('Vennligst velg en gyldig GPX-fil');
    }
  };
  
  // Calculate distance between two points using Haversine formula (in kilometers)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Handle route selection from Strava
  const handleStravaRouteSelect = (gpxString: string, name: string, distance?: number) => {
    // Convert GPX string to File object
    const blob = new Blob([gpxString], { type: 'application/gpx+xml' });
    const file = new File([blob], `${name}.gpx`, { type: 'application/gpx+xml' });
    
    // Close the modal and pass the file to the parent component
    setOpen(false);
    onRouteSelect(file, name, distance);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Velg rute</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Last opp GPX
              </TabsTrigger>
              <TabsTrigger value="strava" className="flex items-center gap-2">
                <StravaIcon className="h-4 w-4 text-orange-500" />
                Strava-ruter
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gpxFile" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  GPX-fil for ruten
                </Label>
                <Input
                  id="gpxFile"
                  type="file"
                  accept=".gpx"
                  onChange={handleFileChange}
                  required
                />
              </div>
            </TabsContent>
            
            <TabsContent value="strava" className="space-y-4">
              <div className="space-y-4">
                {/* Show only StravaAuth when not authenticated */}
                {!isAuthenticated && <StravaAuth />}
                
                {/* When authenticated, show routes */}
                {isAuthenticated && (
                  <StravaRoutes onRouteSelect={handleStravaRouteSelect} />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};