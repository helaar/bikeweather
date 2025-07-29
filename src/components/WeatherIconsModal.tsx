import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WeatherIcons } from '@/components/icons/WeatherIcons';

interface WeatherIconsModalProps {
  trigger?: React.ReactNode;
}

export const WeatherIconsModal: React.FC<WeatherIconsModalProps> = ({ 
  trigger = <Button variant="ghost" size="sm"><HelpCircle className="h-4 w-4 mr-1" /> Værsymboler</Button> 
}) => {
  // Function to generate weather icons with the same styling as in WeatherDisplay
  const getWeatherIcon = (type: string) => {
    const iconSize = "h-5 w-5";
    const smallIconSize = "h-4 w-4";
    const tinyIconSize = "h-3 w-3";
    
    switch (type) {
      case 'thunderstorm':
        return <WeatherIcons.Thunderstorm size={iconSize} />;
      
      case 'light-rain':
        return <WeatherIcons.LightRain size={iconSize} />;
      
      case 'rain':
        return <WeatherIcons.Rain size={iconSize} />;
      
      case 'heavy-rain':
        return <WeatherIcons.HeavyRain size={iconSize} />;
      
      case 'light-snow':
        return <WeatherIcons.LightSnow size={iconSize} />;
      
      case 'snow':
        return <WeatherIcons.Snow size={iconSize} />;
      
      case 'heavy-snow':
        return <WeatherIcons.HeavySnow size={iconSize} />;
      
      case 'sleet':
        return <WeatherIcons.Sleet size={iconSize} />;
      
      case 'fog':
        return <WeatherIcons.Fog size={iconSize} />;
      
      case 'partly-cloudy':
        return <WeatherIcons.PartlyCloudy size={iconSize} smallSize={smallIconSize} />;
      
      case 'cloudy':
        return <WeatherIcons.Cloudy size={iconSize} />;
      
      case 'clear':
        return <WeatherIcons.Clear size={iconSize} />;
      
      default:
        return <WeatherIcons.Cloudy size={iconSize} />;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle>Værsymboler</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Denne tabellen viser hvordan ulike værbeskrivelser fra Yr vises som ikoner i applikasjonen.
          </p>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Definisjon</TableHead>
                <TableHead className="w-1/4">Ikon</TableHead>
                <TableHead className="w-1/2">Yr statusverdier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Clear / Sunny */}
              <TableRow>
                <TableCell className="font-medium">Klart / Sol</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('clear')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  clearsky_day, clearsky_night, clearsky_polartwilight
                </TableCell>
              </TableRow>
              
              {/* Partly Cloudy */}
              <TableRow>
                <TableCell className="font-medium">Delvis skyet</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('partly-cloudy')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  fair_day, fair_night, fair_polartwilight, partlycloudy_day, partlycloudy_night, partlycloudy_polartwilight
                </TableCell>
              </TableRow>
              
              {/* Cloudy */}
              <TableRow>
                <TableCell className="font-medium">Skyet</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('cloudy')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  cloudy
                </TableCell>
              </TableRow>
              
              {/* Fog */}
              <TableRow>
                <TableCell className="font-medium">Tåke</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('fog')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  fog
                </TableCell>
              </TableRow>
              
              {/* Light Rain */}
              <TableRow>
                <TableCell className="font-medium">Lett regn</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('light-rain')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  lightrainshowers_day, lightrainshowers_night, lightrainshowers_polartwilight, lightrain
                </TableCell>
              </TableRow>
              
              {/* Rain */}
              <TableRow>
                <TableCell className="font-medium">Regn</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('rain')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  rainshowers_day, rainshowers_night, rainshowers_polartwilight, rain
                </TableCell>
              </TableRow>
              
              {/* Heavy Rain */}
              <TableRow>
                <TableCell className="font-medium">Kraftig regn</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('heavy-rain')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  heavyrainshowers_day, heavyrainshowers_night, heavyrainshowers_polartwilight, heavyrain
                </TableCell>
              </TableRow>
              
              {/* Light Snow */}
              <TableRow>
                <TableCell className="font-medium">Lett snø / Snøbyger</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('light-snow')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  lightsnowshowers_day, lightsnowshowers_night, lightsnowshowers_polartwilight, lightsnow
                </TableCell>
              </TableRow>
              
              {/* Snow */}
              <TableRow>
                <TableCell className="font-medium">Snø</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('snow')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  snowshowers_day, snowshowers_night, snowshowers_polartwilight, snow
                </TableCell>
              </TableRow>
              
              {/* Heavy Snow */}
              <TableRow>
                <TableCell className="font-medium">Kraftig snø</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('heavy-snow')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  heavysnowshowers_day, heavysnowshowers_night, heavysnowshowers_polartwilight, heavysnow
                </TableCell>
              </TableRow>
              
              {/* Sleet */}
              <TableRow>
                <TableCell className="font-medium">Sludd</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('sleet')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  sleetshowers_day, sleetshowers_night, sleetshowers_polartwilight, sleet
                </TableCell>
              </TableRow>
              
              {/* Thunderstorm */}
              <TableRow>
                <TableCell className="font-medium">Torden</TableCell>
                <TableCell>
                  <div className="flex justify-center items-center h-10 w-10 relative">
                    {getWeatherIcon('thunderstorm')}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  thundershowers_day, thundershowers_night, thundershowers_polartwilight, thunder
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};