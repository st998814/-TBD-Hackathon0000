<template>
  <div class="citywalk-app">
    <header class="header card" :class="{ 'header--compact': isHeaderCompact }">
      <h1>🏃‍♂️ CityWalk</h1>
      <div class="status-container">
        <div class="status-indicator" :class="{ active: isTracking }">
          {{ isTracking ? 'Tracking Active' : 'Tracking Stopped' }}
        </div>
        <div class="network-indicator" :class="{ online: isOnline, offline: !isOnline }">
          {{ isOnline ? '🟢 Online' : '🔴 Offline' }}
        </div>
      </div>
    </header>

    <!-- Place Type Selection -->
    <section class="place-type-selection card" v-if="!isTracking">
      <h3>What are you looking for?</h3>
      <div class="type-grid">
        <button
          v-for="type in AVAILABLE_PLACE_TYPES"
          :key="type.value"
          @click="togglePlaceType(type.value)"
          class="type-btn"
          :class="{ active: selectedPlaceTypes.includes(type.value) }"
        >
          <span class="type-icon">{{ type.icon }}</span>
          <span class="type-label">{{ type.label }}</span>
        </button>
      </div>
      <div class="radius-control">
        <label for="radius-slider">Search Radius: {{ searchRadius }}m</label>
        <input
          id="radius-slider"
          type="range"
          min="100"
          max="300"
          step="25"
          v-model="searchRadius"
          class="radius-slider"
        />
      </div>
    </section>

    <!-- Current Location Info -->
    <section class="location-info card" v-if="currentLocation">
      <div class="location-coords">
        📍 {{ currentLocation.lat.toFixed(6) }}, {{ currentLocation.lng.toFixed(6) }}
      </div>
      <div class="location-time">
        ⏰ {{ new Date(currentLocation.timestamp).toLocaleTimeString() }}
      </div>
    </section>

    <!-- Map Container -->
    <section class="map-container card card--map" v-if="isTracking">
      <div id="main-map" class="map"></div>
    </section>

    <section class="current-stats card" v-if="isTracking">
      <div class="stat-card">
        <div class="stat-value">{{ formatDuration(currentDuration) }}</div>
        <div class="stat-label">Duration</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatDistance(currentDistance) }}</div>
        <div class="stat-label">Distance</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ sessionDiscovered.length }}</div>
        <div class="stat-label">New Places</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ nearbyPlaces.length }}</div>
        <div class="stat-label">Nearby Places</div>
      </div>
    </section>

    <section class="controls card">
      <button 
        v-if="!isTracking" 
        @click="startTrip" 
        class="btn btn-primary"
        :disabled="selectedPlaceTypes.length === 0"
      >
        Start Trip
      </button>
      <button 
        v-else 
        @click="endTrip" 
        class="btn btn-danger"
      >
        End Trip
      </button>
      
      <button 
        @click="clearData" 
        class="btn btn-secondary"
        :disabled="isTracking"
      >
        Clear Data
      </button>
      
      <button 
        v-if="!isTracking && !geolocationSupported" 
        @click="startTestMode" 
        class="btn btn-test"
      >
        Demo Mode
      </button>
    </section>

    <!-- Nearby Places List -->
    <section class="nearby-places card" v-if="isTracking && nearbyPlaces.length > 0">
      <h3>Nearby Places</h3>
      <div class="places-list">
        <div 
          v-for="place in nearbyPlaces.slice(0, 10)" 
          :key="place.place_id"
          class="place-item"
          :class="{ discovered: sessionDiscovered.includes(place.place_id) }"
        >
          <div class="place-info">
            <h4>{{ place.name }}</h4>
            <p class="place-type">{{ getPlaceType(place.types) }}</p>
            <p class="place-rating" v-if="place.rating">
              ⭐ {{ place.rating }}/5
            </p>
            <p class="place-distance">
              📍 {{ formatDistance(place.distance) }} away
            </p>
            <p class="place-vicinity" v-if="place.vicinity">
              {{ place.vicinity }}
            </p>
          </div>
          <div class="place-status" v-if="sessionDiscovered.includes(place.place_id)">
            ✅ Discovered
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Discoveries -->
    <section class="recent-discoveries card" v-if="recentDiscoveries.length > 0">
      <h3>Recent Discoveries</h3>
      <div class="discoveries-list">
        <div 
          v-for="discovery in recentDiscoveries.slice(0, 5)" 
          :key="discovery.place_id"
          class="discovery-item"
        >
          <div class="discovery-info">
            <h4>{{ discovery.name }}</h4>
            <p class="discovery-type">{{ getPlaceType(discovery.types) }}</p>
            <p class="discovery-time">{{ formatTimeAgo(discovery.timestamp) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Toast Notifications -->
    <ToastNotification
      :is-visible="showToast"
      :title="toastTitle"
      :description="toastDescription"
      :type="toastType"
      @close="showToast = false"
    />

    <!-- Trip Report Modal -->
    <TripReport
      :is-visible="showTripReport"
      :route-points="routePoints"
      :session-discovered="sessionDiscovered"
      :start-time="tripStartTime"
      :end-time="tripEndTime"
      :discovered-places="discoveredPlaces"
      @close="closeTripReport"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TripReport from './TripReport.vue'
import ToastNotification from './ToastNotification.vue'
import { 
  calculateDistance, 
  formatDuration, 
  formatDistance, 
  getPlaceType,
  isGeolocationSupported,
  watchPosition,
  placesService,
  AVAILABLE_PLACE_TYPES,
  initializeGoogleMaps,
  waitForGoogleMaps
} from '../utils/mapUtils.js'

// Reactive state
const isTracking = ref(false)
const geolocationSupported = ref(false)
const currentLocation = ref(null)
const routePoints = ref([])
const sessionDiscovered = ref([])
const tripStartTime = ref(0)
const tripEndTime = ref(0)
const showTripReport = ref(false)
const watchId = ref(null)
const now = ref(Date.now())
const durationTimer = ref(null)
const isHeaderCompact = ref(false)

// Network state management
const isOnline = ref(navigator.onLine)
const lastKnownLocation = ref(null)
const lastKnownTimestamp = ref(null)
const networkErrorCount = ref(0)
const maxNetworkRetries = ref(3)

// Place discovery state
const selectedPlaceTypes = ref(['restaurant', 'cafe'])
const searchRadius = ref(150)
const nearbyPlaces = ref([])
const allDiscoveredPlaces = ref([])
const discoveredPlaceIds = ref(new Set())

// Test mode for development/demo
const isTestMode = ref(false)
const testLocation = ref({ lat: 39.9042, lng: 116.4074 }) // Beijing coordinates

// Toast notification state
const showToast = ref(false)
const toastTitle = ref('')
const toastDescription = ref('')
const toastType = ref('success')

// Map state
const map = ref(null)
const userMarker = ref(null)
const radiusCircle = ref(null)
const placeMarkers = ref([])

// Computed properties
const currentDuration = computed(() => {
  if (!isTracking.value || tripStartTime.value === 0) return 0
  return now.value - tripStartTime.value
})

const currentDistance = computed(() => {
  if (routePoints.value.length < 2) return 0
  
  let distance = 0
  for (let i = 1; i < routePoints.value.length; i++) {
    const prev = routePoints.value[i - 1]
    const curr = routePoints.value[i]
    distance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng)
  }
  return distance
})

const discoveredPlaces = computed(() => {
  return allDiscoveredPlaces.value.filter(place => 
    sessionDiscovered.value.includes(place.place_id)
  )
})

const recentDiscoveries = computed(() => {
  return discoveredPlaces.value
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)
})

// Methods
const startDurationTimer = () => {
  stopDurationTimer()
  durationTimer.value = setInterval(() => {
    now.value = Date.now()
  }, 1000)
}

const stopDurationTimer = () => {
  if (durationTimer.value) {
    clearInterval(durationTimer.value)
    durationTimer.value = null
  }
}

const handleScroll = () => {
  isHeaderCompact.value = window.scrollY > 96
}

const togglePlaceType = (type) => {
  const index = selectedPlaceTypes.value.indexOf(type)
  if (index > -1) {
    selectedPlaceTypes.value.splice(index, 1)
  } else {
    selectedPlaceTypes.value.push(type)
  }
}

const initializeMap = async () => {
  try {
    await waitForGoogleMaps()
    
    const mapContainer = document.getElementById('main-map')
    if (!mapContainer) return

    map.value = new google.maps.Map(mapContainer, {
      zoom: 16,
      center: currentLocation.value ? 
        { lat: currentLocation.value.lat, lng: currentLocation.value.lng } : 
        { lat: 39.9042, lng: 116.4074 },
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    })

    // Add user location marker
    if (currentLocation.value) {
      updateUserLocation(currentLocation.value.lat, currentLocation.value.lng)
    }

  } catch (error) {
    console.error('Failed to initialize map:', error)
  }
}

const updateUserLocation = (lat, lng) => {
  if (!map.value) return

  // Update map center
  map.value.setCenter({ lat, lng })

  // Update or create user marker
  if (userMarker.value) {
    userMarker.value.setPosition({ lat, lng })
  } else {
    userMarker.value = new google.maps.Marker({
      position: { lat, lng },
      map: map.value,
      title: 'Your Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 3
      }
    })
  }

  // Update radius circle
  if (radiusCircle.value) {
    radiusCircle.value.setCenter({ lat, lng })
  } else {
    radiusCircle.value = new google.maps.Circle({
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      map: map.value,
      center: { lat, lng },
      radius: searchRadius.value
    })
  }
}

const updatePlaceMarkers = () => {
  // Clear existing place markers
  placeMarkers.value.forEach(marker => marker.setMap(null))
  placeMarkers.value = []

  // Add markers for nearby places
  nearbyPlaces.value.forEach(place => {
    if (place.lat && place.lng) {
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: map.value,
        title: place.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: sessionDiscovered.value.includes(place.place_id) ? '#10b981' : '#f59e0b',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2
        }
      })

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <strong>${place.name}</strong><br>
            <small>${getPlaceType(place.types)}</small><br>
            ${place.rating ? `<small>⭐ ${place.rating}/5</small><br>` : ''}
            <small>📍 ${formatDistance(place.distance)} away</small>
            ${sessionDiscovered.value.includes(place.place_id) ? '<br><small>✅ Discovered</small>' : ''}
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map.value, marker)
      })

      placeMarkers.value.push(marker)
    }
  })
}

const showDiscoveryToast = (newPlaces) => {
  if (newPlaces.length === 0) return

  toastTitle.value = `Discovered ${newPlaces.length} new place${newPlaces.length > 1 ? 's' : ''}!`
  toastDescription.value = newPlaces.map(place => place.name).join(', ')
  showToast.value = true
}

const showGeolocationError = (message) => {
  toastTitle.value = 'Location Access Required'
  toastDescription.value = message
  toastType.value = 'error'
  showToast.value = true

  stopDurationTimer()
}

const handleGeolocationError = (error) => {
  let errorMessage = 'Unknown location error'
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage = 'Location access denied. Please enable location permissions in your browser settings and refresh the page.'
      break
    case error.POSITION_UNAVAILABLE:
      errorMessage = 'Location information is unavailable. Please check your device settings.'
      break
    case error.TIMEOUT:
      errorMessage = 'Location request timed out. Please try again.'
      break
    default:
      errorMessage = error.message || 'Failed to get location'
  }
  
  // Only stop tracking if we have too many network errors
  if (networkErrorCount.value >= maxNetworkRetries.value) {
    // Stop tracking on persistent error
    if (watchId.value) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }
    
    isTracking.value = false
    
    toastTitle.value = 'Location Error'
    toastDescription.value = errorMessage
    toastType.value = 'error'
    showToast.value = true

    stopDurationTimer()
  } else {
    // Increment error count and show network warning
    networkErrorCount.value++
    
    toastTitle.value = 'Network Issue'
    toastDescription.value = 'Having trouble connecting. Keeping last known location...'
    toastType.value = 'warning'
    showToast.value = true
    
    // Keep tracking but use last known location
    if (lastKnownLocation.value) {
      currentLocation.value = lastKnownLocation.value
      updateUserLocation(lastKnownLocation.value.lat, lastKnownLocation.value.lng)
    }
  }
}

const startTestMode = async () => {
  if (selectedPlaceTypes.value.length === 0) {
    showGeolocationError('Please select at least one place type to discover')
    return
  }

  isTestMode.value = true
  
  // Reset session data
  sessionDiscovered.value = []
  routePoints.value = []
  nearbyPlaces.value = []
  tripStartTime.value = Date.now()
  now.value = tripStartTime.value
  isTracking.value = true
  startDurationTimer()

  // Initialize map
  await initializeMap()

  // Use test location
  currentLocation.value = {
    lat: testLocation.value.lat,
    lng: testLocation.value.lng,
    timestamp: Date.now()
  }

  // Add to route points
  routePoints.value.push({
    lat: testLocation.value.lat,
    lng: testLocation.value.lng,
    timestamp: Date.now()
  })

  // Update map
  updateUserLocation(testLocation.value.lat, testLocation.value.lng)

  // Check for nearby places
  await checkForNearbyPlaces(testLocation.value.lat, testLocation.value.lng, Date.now())

  // Show demo mode notification
  toastTitle.value = 'Demo Mode Active'
  toastDescription.value = 'Using simulated location in Beijing. Real location access requires HTTPS.'
  toastType.value = 'info'
  showToast.value = true

  // Simulate movement for demo
  simulateMovement()
}

const simulateMovement = () => {
  if (!isTracking.value || !isTestMode.value) return

  // Simulate walking around Beijing
  const movements = [
    { lat: 39.9042, lng: 116.4074 }, // Tiananmen Square
    { lat: 39.9062, lng: 116.4074 }, // North
    { lat: 39.9062, lng: 116.4094 }, // Northeast
    { lat: 39.9042, lng: 116.4094 }, // East
    { lat: 39.9022, lng: 116.4094 }, // Southeast
    { lat: 39.9022, lng: 116.4074 }, // South
    { lat: 39.9042, lng: 116.4074 }  // Back to start
  ]

  let currentIndex = 0
  const moveInterval = setInterval(() => {
    if (!isTracking.value || !isTestMode.value) {
      clearInterval(moveInterval)
      return
    }

    const nextLocation = movements[currentIndex % movements.length]
    currentIndex++

    currentLocation.value = {
      lat: nextLocation.lat,
      lng: nextLocation.lng,
      timestamp: Date.now()
    }

    routePoints.value.push({
      lat: nextLocation.lat,
      lng: nextLocation.lng,
      timestamp: Date.now()
    })

    updateUserLocation(nextLocation.lat, nextLocation.lng)
    checkForNearbyPlaces(nextLocation.lat, nextLocation.lng, Date.now())
  }, 5000) // Move every 5 seconds
}

const startTrip = async () => {
  if (!geolocationSupported.value) {
    showGeolocationError('Geolocation is not supported by this browser. Please use a modern browser.')
    return
  }

  if (selectedPlaceTypes.value.length === 0) {
    showGeolocationError('Please select at least one place type to discover')
    return
  }

  // Check if we're on HTTPS or localhost
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  if (!isSecure) {
    showGeolocationError('This app requires HTTPS to access your location. Please use HTTPS or try on localhost.')
    return
  }

  // Reset session data
  sessionDiscovered.value = []
  routePoints.value = []
  nearbyPlaces.value = []
  tripStartTime.value = Date.now()
  now.value = tripStartTime.value
  isTracking.value = true
  startDurationTimer()

  // Initialize map
  await initializeMap()

  // Start watching position
  watchId.value = watchPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      const timestamp = Date.now()
      
      currentLocation.value = {
        lat: latitude,
        lng: longitude,
        timestamp
      }

      // Save last known location for offline scenarios
      lastKnownLocation.value = {
        lat: latitude,
        lng: longitude,
        timestamp
      }
      lastKnownTimestamp.value = timestamp

      // Add to route points
      routePoints.value.push({
        lat: latitude,
        lng: longitude,
        timestamp
      })

      // Update map
      updateUserLocation(latitude, longitude)

      // Check for nearby places
      await checkForNearbyPlaces(latitude, longitude, timestamp)
    },
    (error) => {
      console.error('Geolocation error:', error)
      handleGeolocationError(error)
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 1000
    }
  )

  // Save to localStorage
  saveToLocalStorage()
}

const endTrip = () => {
  if (watchId.value) {
    navigator.geolocation.clearWatch(watchId.value)
    watchId.value = null
  }

  // Reset test mode
  isTestMode.value = false

  tripEndTime.value = Date.now()
  isTracking.value = false
  showTripReport.value = true
  stopDurationTimer()

  // Save final data
  saveToLocalStorage()
}

const closeTripReport = () => {
  showTripReport.value = false
}

const clearData = () => {
  if (confirm('Are you sure you want to clear all data?')) {
    routePoints.value = []
    sessionDiscovered.value = []
    allDiscoveredPlaces.value = []
    nearbyPlaces.value = []
    discoveredPlaceIds.value.clear()
    currentLocation.value = null
    tripStartTime.value = 0
    tripEndTime.value = 0
    
    // Clear map markers
    if (map.value) {
      placeMarkers.value.forEach(marker => marker.setMap(null))
      placeMarkers.value = []
      if (userMarker.value) {
        userMarker.value.setMap(null)
        userMarker.value = null
      }
      if (radiusCircle.value) {
        radiusCircle.value.setMap(null)
        radiusCircle.value = null
      }
    }
    
    // Clear localStorage
    localStorage.removeItem('citywalk-data')
  }
}

const checkForNearbyPlaces = async (lat, lng, timestamp) => {
  try {
    // Search for nearby places using Google Places API
    const places = await placesService.searchNearbyPlaces(
      lat, 
      lng, 
      searchRadius.value, 
      selectedPlaceTypes.value
    )

    // Reset network error count on successful API call
    networkErrorCount.value = 0

    // Update nearby places list
    nearbyPlaces.value = places

    // Update map markers
    updatePlaceMarkers()

    // Check for new discoveries
    const newDiscoveries = []
    places.forEach(place => {
      if (!discoveredPlaceIds.value.has(place.place_id)) {
        discoveredPlaceIds.value.add(place.place_id)
        sessionDiscovered.value.push(place.place_id)
        allDiscoveredPlaces.value.push({
          ...place,
          timestamp: timestamp
        })
        newDiscoveries.push(place)
      }
    })

    // Show discovery toast if new places found
    if (newDiscoveries.length > 0) {
      showDiscoveryToast(newDiscoveries)
    }

  } catch (error) {
    console.error('Error checking for nearby places:', error)
    // Don't increment error count for Places API errors, only for location errors
  }
}

const formatTimeAgo = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const saveToLocalStorage = () => {
  const data = {
    routePoints: routePoints.value,
    sessionDiscovered: sessionDiscovered.value,
    allDiscoveredPlaces: allDiscoveredPlaces.value,
    discoveredPlaceIds: Array.from(discoveredPlaceIds.value),
    selectedPlaceTypes: selectedPlaceTypes.value,
    searchRadius: searchRadius.value,
    tripStartTime: tripStartTime.value,
    tripEndTime: tripEndTime.value,
    isTracking: isTracking.value,
    lastKnownLocation: lastKnownLocation.value,
    lastKnownTimestamp: lastKnownTimestamp.value,
    networkErrorCount: networkErrorCount.value
  }
  
  localStorage.setItem('citywalk-data', JSON.stringify(data))
}

const loadFromLocalStorage = () => {
  try {
    const data = localStorage.getItem('citywalk-data')
    if (data) {
      const parsed = JSON.parse(data)
      routePoints.value = parsed.routePoints || []
      sessionDiscovered.value = parsed.sessionDiscovered || []
      allDiscoveredPlaces.value = parsed.allDiscoveredPlaces || []
      discoveredPlaceIds.value = new Set(parsed.discoveredPlaceIds || [])
      selectedPlaceTypes.value = parsed.selectedPlaceTypes || ['restaurant', 'cafe']
      searchRadius.value = parsed.searchRadius || 150
      tripStartTime.value = parsed.tripStartTime || 0
      tripEndTime.value = parsed.tripEndTime || 0
      lastKnownLocation.value = parsed.lastKnownLocation || null
      lastKnownTimestamp.value = parsed.lastKnownTimestamp || null
      networkErrorCount.value = parsed.networkErrorCount || 0
      
      // Don't restore tracking state for security reasons
      isTracking.value = false
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error)
  }
}

// Network event handlers
const handleOnline = () => {
  isOnline.value = true
  networkErrorCount.value = 0
  
  // Show reconnection toast
  toastTitle.value = 'Connection Restored'
  toastDescription.value = 'Network connection is back online!'
  toastType.value = 'success'
  showToast.value = true
  
  // If we were tracking and have a last known location, try to resume
  if (isTracking.value && lastKnownLocation.value) {
    currentLocation.value = lastKnownLocation.value
    updateUserLocation(lastKnownLocation.value.lat, lastKnownLocation.value.lng)
    
    // Try to check for nearby places again
    checkForNearbyPlaces(lastKnownLocation.value.lat, lastKnownLocation.value.lng, lastKnownTimestamp.value)
  }
}

const handleOffline = () => {
  isOnline.value = false
  
  // Show offline warning
  toastTitle.value = 'Connection Lost'
  toastDescription.value = 'Working offline. Trip continues with last known location.'
  toastType.value = 'warning'
  showToast.value = true
}

// Lifecycle hooks
onMounted(() => {
  // Check geolocation support
  geolocationSupported.value = isGeolocationSupported()
  
  // Load saved data
  loadFromLocalStorage()

  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  // Add network event listeners
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  // Clean up geolocation watch
  if (watchId.value) {
    navigator.geolocation.clearWatch(watchId.value)
  }
  
  // Clean up map markers
  if (map.value) {
    placeMarkers.value.forEach(marker => marker.setMap(null))
    if (userMarker.value) {
      userMarker.value.setMap(null)
    }
    if (radiusCircle.value) {
      radiusCircle.value.setMap(null)
    }
  }

  stopDurationTimer()
  window.removeEventListener('scroll', handleScroll)
  
  // Remove network event listeners
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
.citywalk-app {
  width: 100%;
  margin: 0;
  padding: clamp(16px, 4vw, 28px);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 3vw, 24px);
  min-height: 100svh;
  background: #f8fafc;
  border-radius: 0;
}

.card {
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 18px;
  padding: clamp(16px, 3vw, 24px);
  box-shadow: 0 24px 40px -32px rgba(15, 23, 42, 0.45);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}


.card:focus-within,
.card:hover {
  border-color: rgba(59, 130, 246, 0.35);
  box-shadow: 0 28px 50px -30px rgba(59, 130, 246, 0.35);
}

.card--map {
  padding: 0;
  overflow: hidden;
}

@media (min-width: 1024px) {
  .citywalk-app {
    max-width: 960px;
    margin: 0 auto;
    border-radius: 32px;
  }
}

.header {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: clamp(12px, 4vw, 24px);
  padding: clamp(14px, 3vw, 22px);
  background: rgba(248, 250, 252, 0.95);
  backdrop-filter: blur(12px);
  transition: padding 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
}

.status-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.header--compact {
  padding: clamp(8px, 2vw, 14px);
  gap: clamp(8px, 3vw, 16px);
  opacity: 0.82;
  transform: translateY(-8px);
}

.header h1 {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
  font-size: clamp(1.5rem, 6vw, 2.4rem);
}

.header--compact h1 {
  font-size: clamp(1.1rem, 5vw, 1.6rem);
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: clamp(0.75rem, 2.6vw, 0.9rem);
  font-weight: 600;
  background: rgba(226, 232, 240, 0.8);
  color: #475569;
  letter-spacing: 0.01em;
}

.status-indicator.active {
  background: rgba(74, 222, 128, 0.18);
  color: #047857;
}

.header--compact .status-indicator {
  padding: 6px 12px;
  font-size: clamp(0.7rem, 2.2vw, 0.8rem);
}

.network-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: clamp(0.65rem, 2vw, 0.75rem);
  font-weight: 500;
  background: rgba(226, 232, 240, 0.6);
  color: #64748b;
  letter-spacing: 0.01em;
}

.network-indicator.online {
  background: rgba(74, 222, 128, 0.15);
  color: #047857;
}

.network-indicator.offline {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.header--compact .network-indicator {
  padding: 3px 6px;
  font-size: clamp(0.6rem, 1.8vw, 0.7rem);
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  align-items: center;
}

.controls.card {
  padding: clamp(8px, 2vw, 14px);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.88);
  box-shadow: 0 14px 24px -28px rgba(15, 23, 42, 0.4);
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.controls .btn {
  width: 100%;
  padding: 9px 14px;
  font-size: 0.9rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-test {
  background: #f59e0b;
  color: white;
}

.btn-test:hover:not(:disabled) {
  background: #d97706;
}

.current-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}


.recent-discoveries {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recent-discoveries h3 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1.125rem;
}

.discoveries-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.discovery-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.discovery-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1rem;
}

.discovery-type {
  margin: 0 0 4px 0;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.discovery-time {
  margin: 0;
  color: #9ca3af;
  font-size: 0.75rem;
}

/* Place Type Selection */
.place-type-selection h3 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1.125rem;
}

.place-type-selection {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 3vw, 20px);
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: clamp(12px, 3vw, 20px);
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  width: 100%;
}

.type-btn:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.type-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1e40af;
}

.type-icon {
  font-size: 1.5rem;
}

.type-label {
  font-weight: 500;
}

.radius-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radius-control label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.radius-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.radius-slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.radius-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

/* Map Container */
.map-container {
  position: relative;
  height: clamp(480px, 90vw, 780px);
  border-radius: inherit;
}

.map {
  width: 100%;
  height: 100%;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.location-coords, .location-time {
  font-size: 0.85rem;
  color: #475569;
  font-family: monospace;
}

/* Nearby Places */
.nearby-places {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nearby-places h3 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1.125rem;
}

.places-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.place-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.place-item.discovered {
  border-color: #10b981;
  background: #f0fdf4;
}

.place-info h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1rem;
}

.place-type {
  margin: 0 0 4px 0;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.place-rating, .place-distance, .place-vicinity {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.place-status {
  margin-top: 8px;
  padding: 4px 8px;
  background: #10b981;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
}

/* Updated stats grid */
.current-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

/* Mobile-first adjustments */
@media (max-width: 768px) {
  .citywalk-app {
    padding: clamp(10px, 5vw, 18px);
    gap: clamp(10px, 4vw, 18px);
    padding-bottom: max(18px, env(safe-area-inset-bottom));
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .status-container {
    width: 100%;
    align-items: stretch;
    gap: 8px;
  }

  .status-indicator {
    width: 100%;
    justify-content: center;
  }

  .network-indicator {
    width: 100%;
    justify-content: center;
  }

  .type-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-height: clamp(220px, 50vh, 280px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: rgba(148, 163, 184, 0.6) transparent;
  }

  .type-grid::-webkit-scrollbar {
    width: 4px;
  }

  .type-btn {
    padding: 14px 10px;
    font-size: 0.85rem;
  }

  .controls {
    grid-template-columns: 1fr;
    gap: 6px;
    position: sticky;
    bottom: max(10px, env(safe-area-inset-bottom));
    z-index: 18;
    background: rgba(248, 250, 252, 0.88);
    backdrop-filter: blur(10px);
  }

  .controls.card {
    padding: clamp(8px, 2.8vw, 12px);
  }

  .btn {
    padding: 12px 16px;
    font-size: 0.92rem;
    min-height: 44px;
  }

  .map-container {
    height: clamp(390px, 82vh, 540px);
  }

  .location-coords,
  .location-time {
    font-size: 0.72rem;
  }

  .current-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .stat-card {
    padding: 12px;
  }

  .nearby-places,
  .recent-discoveries {
    gap: 12px;
  }

  .places-list,
  .discoveries-list {
    gap: 10px;
  }

  .place-item,
  .discovery-item {
    padding: 14px;
  }

  .place-info h4,
  .discovery-info h4 {
    font-size: 0.95rem;
  }

  .place-type,
  .discovery-type,
  .place-rating,
  .place-distance,
  .place-vicinity,
  .discovery-time {
    font-size: 0.8rem;
  }
}

/* Compact phones */
@media (max-width: 480px) {
  .citywalk-app {
    padding: clamp(8px, 5vw, 14px);
  }

  .header {
    gap: 10px;
    top: max(8px, env(safe-area-inset-top));
  }

  .header h1 {
    font-size: clamp(1.3rem, 7vw, 1.6rem);
  }

  .status-indicator {
    font-size: 0.78rem;
    padding: 6px 12px;
  }

  .type-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
    max-height: 240px;
  }

  .type-btn {
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 12px;
    font-size: 0.85rem;
    gap: 12px;
  }

  .type-icon {
    font-size: 1.3rem;
  }

  .controls {
    gap: 8px;
  }

  .btn {
    font-size: 0.9rem;
    padding: 12px 16px;
  }

  .map-container {
    height: clamp(360px, 90vh, 480px);
  }

  .current-stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stat-card {
    padding: 12px;
    text-align: left;
  }
}

/* iPhone X/11/12/13/14/15 series safe area support */
@supports (padding: max(0px)) {
  .citywalk-app {
    padding-left: max(env(safe-area-inset-left), clamp(12px, 4vw, 28px));
    padding-right: max(env(safe-area-inset-right), clamp(12px, 4vw, 28px));
    padding-top: max(env(safe-area-inset-top), clamp(12px, 4vw, 28px));
    padding-bottom: max(env(safe-area-inset-bottom), clamp(18px, 5vw, 28px));
  }
}

/* Landscape orientation optimizations for iPhone */
@media (max-width: 768px) and (orientation: landscape) {
  .citywalk-app {
    padding: clamp(6px, 3vw, 12px);
    gap: 10px;
  }

  .header {
    position: static;
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }

  .header h1 {
    font-size: clamp(1.2rem, 4vw, 1.6rem);
  }

  .status-indicator {
    width: auto;
    padding: 6px 12px;
  }

  .map-container {
    height: clamp(330px, 98vh, 480px);
  }

  .current-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .stat-card {
    padding: 10px;
  }
}
</style>
