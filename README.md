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
- **Strava API**: For importing routes from Strava (requires configuration)

### Strava API Configuration

To enable Strava integration, you need to:

1. **Create a Strava API Application**:
   - Go to [Strava API Settings](https://www.strava.com/settings/api)
   - Create a new application
   - Set the "Authorization Callback Domain" to your app's domain (e.g., `helaar.github.io` or `localhost` for local testing)

2. **Set Up Environment Variables**:
   - Create a `.env.local` file in the project root (this file is git-ignored)
   - Add your Strava API credentials:
     ```
     VITE_STRAVA_CLIENT_ID=your_client_id
     VITE_STRAVA_CLIENT_SECRET=your_client_secret
     ```
   - For production deployment, set these environment variables in your hosting platform

3. **For GitHub Pages Deployment**:
   - **IMPORTANT**: You must add these secrets to your GitHub repository:
     - Go to your repository → Settings → Secrets and variables → Actions
     - Click "New repository secret"
     - Add `VITE_STRAVA_CLIENT_ID` with your Strava Client ID as the value
     - Add `VITE_STRAVA_CLIENT_SECRET` with your Strava Client Secret as the value
   - The GitHub Actions workflow is already configured to use these secrets:
     ```yaml
     # In .github/workflows/deploy.yml
     env:
       VITE_STRAVA_CLIENT_ID: ${{ secrets.VITE_STRAVA_CLIENT_ID }}
       VITE_STRAVA_CLIENT_SECRET: ${{ secrets.VITE_STRAVA_CLIENT_SECRET }}
       GITHUB_ACTIONS: 'true'
     ```
   - If you see the error "Strava API credentials not found in environment variables" after deployment:
     - This means the secrets are not properly set in your GitHub repository
     - Double-check that you've added both secrets with the correct names and values
     - Verify that the secrets are available to the workflow (they should be visible as masked values in the workflow logs)
     - Trigger a new deployment after adding the secrets

### Troubleshooting GitHub Pages Deployment

If you encounter issues with the Strava integration on GitHub Pages:

1. **Check Repository Secrets**:
   - Ensure both `VITE_STRAVA_CLIENT_ID` and `VITE_STRAVA_CLIENT_SECRET` are set as repository secrets
   - Repository secrets are case-sensitive and should match exactly as shown

2. **Verify Workflow Permissions**:
   - Make sure the GitHub Actions workflow has permission to access the secrets
   - This is usually configured automatically, but can be checked in repository settings

3. **Check Build Logs**:
   - Review the GitHub Actions build logs for any errors
   - Look for messages about missing environment variables

4. **Test Locally First**:
   - Test the Strava integration locally with a `.env.local` file before deploying
   - This helps isolate whether the issue is with the code or the deployment configuration

4. **Using Strava Integration**:
   - Users can connect their Strava account via the "Strava-ruter" tab in the route form
   - After authentication, they can browse and select their saved Strava routes
   - Selected routes are automatically converted to GPX format for weather forecasting

### Technical Implementation

The Strava integration uses the following approach:

1. **Authentication**: Standard OAuth 2.0 flow for secure authentication with Strava
2. **Route Listing**: Fetches user's routes from the Strava API
3. **Route Data**: Uses multiple fallback methods to obtain route coordinates:
   - Full polyline from route details (most accurate)
   - Summary polyline from route details
   - Summary polyline from routes list
   - Start/end points for simple route generation (least accurate, but always available)
4. **GPX Generation**: Converts polyline coordinates to GPX format for compatibility with the weather forecast system

### Known Limitations

Due to Strava API restrictions, there are some limitations to the integration:

1. **Route Accuracy**: The polyline data from Strava is a simplified representation of the route. While sufficient for weather forecasting along a route, it may not contain the exact elevation data or all waypoints of the original route.

2. **Authentication**: Strava's OAuth tokens expire after 6 hours. The application will attempt to refresh tokens automatically, but users may need to re-authenticate periodically.

3. **Rate Limits**: Strava API has rate limits (100 requests per 15 minutes and 1000 per day). Heavy usage may result in temporary API access restrictions.

4. **Mobile Limitations**: The Strava mobile app has limited GPX export capabilities. This integration works around that by using the route's polyline data directly, allowing users to access their routes without needing to export GPX files manually.

5. **API Resilience**: The integration implements multiple fallback mechanisms to handle various API limitations and edge cases, ensuring that users can access their routes even when certain API endpoints are unavailable or return incomplete data.

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
