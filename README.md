# CityMouse - Location-Based Discovery App

A Vue 3 + Vite web application that allows users to discover nearby places while walking, similar to Pokémon GO's discovery experience. Built with Google Maps and Places API integration.

##  Features

### Core Functionality
- **Real-time Location Tracking**: Uses browser geolocation API with `watchPosition` for continuous tracking
- **Google Places Integration**: Discovers real places using Google Places API
- **Interactive Map**: Shows user location, search radius, and discovered places
- **Smart Discovery System**: Detects new places within radius and shows toast notifications
- **Trip Reports**: Generates comprehensive reports with route visualization and statistics

### Place Discovery
- **Place Type Selection**: Choose from 6 predefined types (restaurant, cafe, shopping_mall, supermarket, convenience_store, bakery)
- **Configurable Search Radius**: Adjustable from 100m to 300m (default 150m)
- **Real-time Discovery**: Shows nearby places as you walk
- **Discovery Notifications**: Toast notifications when new places are found
- **Place Deduplication**: Prevents duplicate discoveries using place_id

### Performance & Cost Optimization
- **Query Throttling**: Only queries when user moves ≥30m or ≥20s have passed
- **Local Caching**: 25-second TTL cache to reduce API calls
- **Smart API Usage**: Minimizes Google Places API requests while maintaining accuracy

### Trip Management
- **Session Tracking**: Tracks trip duration, distance, and discoveries
- **Route Visualization**: Shows GPS track on map with polyline
- **Comprehensive Reports**: Includes statistics, place type distribution, and route map
- **Data Persistence**: Saves data to localStorage for session recovery

## 🛠️ Technical Implementation

### Architecture
- **Frontend**: Vue 3 with Composition API
- **Build Tool**: Vite for fast development and building
- **Maps**: Google Maps JavaScript API with Places library
- **Styling**: Scoped CSS with modern design system
- **State Management**: Vue reactive refs and computed properties

### Key Components

#### CityWalk.vue
Main application component with:
- Place type selection UI
- Real-time map integration
- Location tracking and discovery logic
- Trip management controls

#### TripReport.vue
Modal component for trip summaries with:
- Route visualization on Google Maps
- Statistics and place type distribution
- Discovered places list with details

#### ToastNotification.vue
Reusable notification component for:
- Discovery announcements
- Success/error messages
- Auto-dismiss functionality

#### mapUtils.js
Utility library containing:
- Google Places API service class
- Distance calculations (Haversine formula)
- Map initialization and marker management
- Geolocation helpers

### Google Places API Integration

```javascript
// PlacesService class handles:
- Nearby search with throttling
- Result caching (25s TTL)
- Distance-based query optimization
- Error handling and fallbacks
```

### Discovery Algorithm

1. **Location Update**: User position changes trigger discovery check
2. **Throttling Check**: Verify if query should be made (distance/time thresholds)
3. **API Query**: Search Google Places API for nearby locations
4. **New Place Detection**: Compare with previously discovered places
5. **Notification**: Show toast for new discoveries
6. **Map Update**: Add markers and update UI

## Usage

### Starting a Trip
1. Select place types you want to discover
2. Adjust search radius if needed
3. Click "Start Trip" to begin tracking
4. Grant location permissions when prompted

### During Trip
- Walk around to discover new places
- View real-time map with your location and nearby places
- Receive notifications when new places are discovered
- Monitor trip statistics (duration, distance, discoveries)

### Ending Trip
1. Click "End Trip" to stop tracking
2. View comprehensive trip report
3. See route visualization and statistics
4. Review all discovered places

## Configuration

### Environment Variables
The app uses a Google Maps API key (currently hardcoded for demo). In production:
1. Set up Google Cloud Console project
2. Enable Maps JavaScript API and Places API
3. Create API key with appropriate restrictions
4. Replace key in `index.html`

### Place Types
Available place types are defined in `mapUtils.js`:
```javascript
export const AVAILABLE_PLACE_TYPES = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'cafe', label: 'Cafe', icon: '☕' },
  // ... more types
]
```

### Throttling Settings
Adjustable in `PlacesService` class:
- `minQueryInterval`: 20 seconds
- `minDistanceThreshold`: 30 meters
- `cacheTimeout`: 25 seconds

## 📱 Mobile Support

The app is fully responsive and works on mobile devices:
- Touch-friendly interface
- Mobile-optimized map controls
- Responsive grid layouts
- PWA-ready with manifest

## Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Google Maps API key

### Setup
```bash
cd frontend
npm install
npm run dev
```

### Building
```bash
npm run build
npm run preview
```

## Privacy & Security

- **Location Data**: Only stored locally, never transmitted to external servers
- **API Keys**: Should be restricted to specific domains in production
- **Permissions**: Requires user consent for location access
- **Data Storage**: All data stored in browser localStorage

## Design Features

- **Modern UI**: Clean, card-based design with subtle shadows
- **Color System**: Consistent blue/green color scheme
- **Typography**: System fonts for optimal performance
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: Proper contrast ratios and semantic HTML

## Future Enhancements

- **Offline Support**: Cache map tiles and place data
- **Social Features**: Share discoveries with friends
- **Advanced Filtering**: More place type options
- **Route Planning**: Suggest optimal discovery routes
- **Analytics**: Trip history and statistics
- **Export Features**: Download trip data as GPX/KML

## License

This project is created for hackathon purposes. Please ensure compliance with Google Maps API terms of service when deploying.
