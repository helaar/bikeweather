# BikeWeather (Sykkelvær)

A weather forecast application specifically designed for long-distance cyclists, providing detailed weather predictions along cycling routes.

![BikeWeather App](public/placeholder.svg)

## 🚲 Features

- **Strava Route Integration**: Upload GPX files from Strava to get weather data along your entire route
- **Weather Forecasts**: Precise weather forecasts from the Norwegian Meteorological Institute (Yr)
- **Route Planning**: Select date, duration, and get weather data tailored to your cycling speed
- **Interactive Map**: Visualize your route with weather conditions at key points
- **Wind Analysis**: Smart wind direction analysis showing headwind, tailwind, or crosswind relative to your cycling direction
- **Detailed Weather Data**: Temperature, precipitation, humidity, wind speed, cloud cover, and more
- **Mobile Responsive**: Works on all devices, perfect for planning on the go

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Maps**: Leaflet
- **API Integration**: Yr weather API, OpenStreetMap for geocoding
- **Deployment**: GitHub Pages via GitHub Actions

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/helaar/bikeweather.git

# Navigate to the project directory
cd bikeweather

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080/bikeweather/`

## 📱 Usage

1. **Upload Route**: Upload a GPX file containing your cycling route
2. **Set Details**: Select your start date, time, and expected duration
3. **Get Forecast**: The app will fetch weather data for points along your route
4. **Analyze Weather**: View detailed weather information for each point, including:
   - Temperature and feels-like temperature
   - Precipitation amount and probability
   - Wind speed, direction, and effect on cycling (headwind/tailwind)
   - Cloud cover and humidity
5. **View Map**: See your route on the map with weather indicators at key points

## 🌐 API Usage

This application uses the following external APIs:

- **Yr Weather API**: For detailed weather forecasts
- **OpenStreetMap Nominatim API**: For reverse geocoding (converting coordinates to location names)

## 🧪 Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run deploy` - Deploy the application to GitHub Pages

### Project Structure

```
bikeweather/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   │   ├── RouteForm.tsx       # Form for route input
│   │   ├── RouteMap.tsx        # Map display component
│   │   └── WeatherDisplay.tsx  # Weather information display
│   ├── pages/          # Page components
│   │   ├── Index.tsx           # Landing page
│   │   └── WeatherRoute.tsx    # Main application page
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
└── .github/workflows/  # GitHub Actions workflows
```

## 🌍 Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the main branch. You can access the live version at:

[https://helaar.github.io/bikeweather/](https://helaar.github.io/bikeweather/)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Yr Weather API](https://api.met.no/) for providing reliable weather data
- [OpenStreetMap](https://www.openstreetmap.org/) for mapping and geocoding services
- [Leaflet](https://leafletjs.com/) for the interactive map implementation
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
