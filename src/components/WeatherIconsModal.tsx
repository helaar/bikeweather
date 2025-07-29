import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Cloud, 
  Droplet, 
  HelpCircle, 
  Sun, 
  CloudLightning
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
        return <CloudLightning className={`${iconSize} text-purple-500`} />;
      
      case 'light-rain':
        return (
          <div className="relative">
            <Cloud className={`${iconSize} text-blue-600`} />
            {/* Single centered droplet */}
            <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
              <Droplet className={`${tinyIconSize} text-blue-600`} />
            </div>
          </div>
        );
      
      case 'rain':
        return (
          <div className="relative">
            <Cloud className={`${iconSize} text-blue-600`} />
            {/* Two droplets */}
            <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-0.5">
              <Droplet className={`${tinyIconSize} text-blue-600`} />
              <Droplet className={`${tinyIconSize} text-blue-600`} />
            </div>
          </div>
        );
      
      case 'heavy-rain':
        return (
          <div className="relative">
            <Cloud className={`${iconSize} text-blue-600`} />
            {/* Three droplets */}
            <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1">
              <Droplet className={`${tinyIconSize} text-blue-600`} />
              <Droplet className={`${tinyIconSize} text-blue-600`} />
              <Droplet className={`${tinyIconSize} text-blue-600`} />
            </div>
          </div>
        );
      
      case 'light-snow':
        return (
          <div className="relative">
            <Cloud className={`${iconSize} text-gray-400`} />
            {/* Single centered snowflake */}
            <div className="absolute -bottom-1 left-0 right-0 flex justify-center">
              <div className="text-blue-600 text-xs">❄</div>
            </div>
          </div>
        );
      
      case 'snow':
        return (
          <div className="relative">
            <Cloud className={`${iconSize} text-gray-400`} />
            {/* Two snowflakes */}
            <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-0.5">
              <div className="text-blue-600 text-xs">❄</div>
              <div className="text-blue-600 text-xs">❄</div>
            </div>
          </div>
        );
      
      case 'heavy-snow':
        return (
          <div className="relative">
            <Cloud className={`${iconSize} text-gray-400`} />
            {/* Three snowflakes */}
            <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-0.5">
              <div className="text-blue-600 text-xs">❄</div>
              <div className="text-blue-600 text-xs">❄</div>
              <div className="text-blue-600 text-xs">❄</div>
            </div>
          </div>
        );
      
      case 'sleet':
        return (
          <div className="relative">
            <Cloud className={`${iconSize} text-blue-600`} />
            {/* Mix of droplet and snowflake */}
            <div className="absolute -bottom-2 left-0 right-0 flex justify-center items-center gap-0.5">
              <Droplet className={`${tinyIconSize} text-blue-600 relative top-0.5`} />
              <div className="text-blue-600 text-xs">❄</div>
            </div>
          </div>
        );
      
      case 'fog':
        return (
          <div className="relative">
            <Cloud className={`${iconSize} text-gray-400`} />
            <div className="absolute -bottom-1 left-0 right-0 flex flex-col items-center">
              <div className="w-3/4 h-px bg-gray-400 mb-0.5"></div>
              <div className="w-2/3 h-px bg-gray-400 mb-0.5"></div>
              <div className="w-1/2 h-px bg-gray-400"></div>
            </div>
          </div>
        );
      
      case 'partly-cloudy':
        return (
          <div className="relative">
            <Cloud className={`${iconSize} text-gray-400`} />
            <Sun className={`${smallIconSize} text-yellow-500 absolute -top-1 -right-1`} />
          </div>
        );
      
      case 'cloudy':
        return <Cloud className={`${iconSize} text-gray-500`} />;
      
      case 'clear':
        return <Sun className={`${iconSize} text-yellow-500`} />;
      
      default:
        return <Cloud className={`${iconSize} text-gray-500`} />;
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