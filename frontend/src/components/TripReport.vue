<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Trip Report</h2>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Trip Overview -->
        <div class="section">
          <h3>Overview</h3>
          <div class="overview-stats">
            <div class="stat-item">
              <span class="stat-label">Duration:</span>
              <span class="stat-value">{{ formatDuration(tripDuration) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Distance:</span>
              <span class="stat-value">{{ formatDistance(totalDistance) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Time:</span>
              <span class="stat-value">{{ formatTimeRange(startTime, endTime) }}</span>
            </div>
          </div>
        </div>

        <!-- Route Map -->
        <div class="section" v-if="routePoints.length > 0">
          <h3>Route</h3>
          <div class="map-container">
            <div id="route-map" class="map"></div>
          </div>
        </div>

        <!-- Discovered Places -->
        <div class="section" v-if="discoveredPlaces.length > 0">
          <h3>New Discoveries</h3>
          <div class="places-list">
            <div 
              v-for="place in discoveredPlaces" 
              :key="place.place_id" 
              class="place-item"
            >
              <div class="place-info">
                <h4>{{ place.name }}</h4>
                <p class="place-type">{{ getPlaceType(place.types) }}</p>
                <p class="place-rating" v-if="place.rating">
                  ⭐ {{ place.rating }}/5
                </p>
                <p class="place-distance" v-if="place.distance">
                  📍 {{ formatDistance(place.distance) }} away
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="section">
          <h3>Summary</h3>
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-number">{{ discoveredPlaces.length }}</div>
              <div class="card-label">New Places Found</div>
            </div>
            <div class="summary-card">
              <div class="card-number">{{ placeTypeStats.length }}</div>
              <div class="card-label">Different Types</div>
            </div>
            <div class="summary-card" v-if="discoveredPlaces.length > 1">
              <div class="card-number">{{ formatDistance(maxDistance) }}</div>
              <div class="card-label">Farthest Discovery</div>
            </div>
            <div class="summary-card" v-if="discoveredPlaces.length > 1">
              <div class="card-number">{{ formatDistance(minDistance) }}</div>
              <div class="card-label">Nearest Discovery</div>
            </div>
          </div>
        </div>

        <!-- Place Type Distribution -->
        <div class="section" v-if="placeTypeStats.length > 0">
          <h3>Place Types</h3>
          <div class="type-distribution">
            <div 
              v-for="type in placeTypeStats" 
              :key="type.name"
              class="type-item"
            >
              <span class="type-name">{{ type.name }}</span>
              <span class="type-count">{{ type.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { 
  calculateDistance, 
  formatDuration, 
  formatDistance, 
  getPlaceType,
  initializeGoogleMaps,
  waitForGoogleMaps
} from '../utils/mapUtils.js'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  routePoints: {
    type: Array,
    default: () => []
  },
  sessionDiscovered: {
    type: Array,
    default: () => []
  },
  startTime: {
    type: Number,
    default: 0
  },
  endTime: {
    type: Number,
    default: 0
  },
  discoveredPlaces: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

// Computed properties
const tripDuration = computed(() => {
  return props.endTime - props.startTime
})

const totalDistance = computed(() => {
  if (props.routePoints.length < 2) return 0
  
  let distance = 0
  for (let i = 1; i < props.routePoints.length; i++) {
    const prev = props.routePoints[i - 1]
    const curr = props.routePoints[i]
    distance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng)
  }
  return distance
})

const placeTypeStats = computed(() => {
  const typeCount = {}
  props.discoveredPlaces.forEach(place => {
    const type = getPlaceType(place.types)
    typeCount[type] = (typeCount[type] || 0) + 1
  })
  
  return Object.entries(typeCount).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count)
})

const maxDistance = computed(() => {
  if (props.discoveredPlaces.length === 0) return 0
  return Math.max(...props.discoveredPlaces.map(place => place.distance || 0))
})

const minDistance = computed(() => {
  if (props.discoveredPlaces.length === 0) return 0
  return Math.min(...props.discoveredPlaces.filter(place => place.distance > 0).map(place => place.distance))
})

// Methods
const closeModal = () => {
  emit('close')
}


const formatTimeRange = (start, end) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }
  
  return `${formatTime(startDate)} → ${formatTime(endDate)}`
}


// Initialize map when component mounts and route points are available
let map = null
let polyline = null

const initializeMap = async () => {
  if (props.routePoints.length === 0) return
  
  const mapContainer = document.getElementById('route-map')
  if (!mapContainer) return
  
  try {
    // Wait for Google Maps API to load
    await waitForGoogleMaps()
    
    // Initialize Google Maps
    await initializeGoogleMaps(mapContainer, props.routePoints, props.discoveredPlaces)
  } catch (error) {
    console.error('Failed to initialize Google Maps:', error)
    // Fallback to simple visualization
    mapContainer.innerHTML = `
      <div class="map-placeholder">
        <p>📍 Route Visualization</p>
        <p>${props.routePoints.length} GPS points recorded</p>
        <p>Total distance: ${formatDistance(totalDistance.value)}</p>
        <small>Google Maps failed to load. Using fallback visualization.</small>
      </div>
    `
  }
}

// Watch for changes in route points to update map
watch(() => props.routePoints, () => {
  if (props.isVisible) {
    setTimeout(initializeMap, 100)
  }
}, { deep: true })

// Initialize map when modal becomes visible
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    setTimeout(initializeMap, 100)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1.25rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1.125rem;
  color: #1f2937;
  font-weight: 600;
}

.map-container {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  height: 300px;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: #f9fafb;
  color: #6b7280;
  text-align: center;
  padding: 20px;
}

.places-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.place-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.place-info h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.place-type {
  margin: 0 0 4px 0;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.place-rating, .place-distance {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.summary-card {
  text-align: center;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.card-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.card-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.type-distribution {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
}

.type-name {
  font-weight: 500;
  color: #374151;
}

.type-count {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* iPhone and mobile responsiveness */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-width: none;
    max-height: 95vh;
    margin: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
    border-radius: 8px;
  }
  
  .modal-header {
    padding: 16px;
  }
  
  .modal-header h2 {
    font-size: 1.25rem;
  }
  
  .close-btn {
    width: 28px;
    height: 28px;
    font-size: 20px;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .section {
    margin-bottom: 20px;
  }
  
  .section h3 {
    font-size: 1.1rem;
  }
  
  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat-value {
    font-size: 1rem;
  }
  
  .map-container {
    height: 200px;
  }
  
  .places-list {
    gap: 10px;
  }
  
  .place-item {
    padding: 12px;
  }
  
  .place-info h4 {
    font-size: 1rem;
  }
  
  .place-type {
    font-size: 0.8rem;
  }
  
  .place-rating, .place-distance {
    font-size: 0.75rem;
  }
  
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .summary-card {
    padding: 12px;
  }
  
  .card-number {
    font-size: 1.25rem;
  }
  
  .card-label {
    font-size: 0.8rem;
  }
  
  .type-item {
    padding: 6px 10px;
  }
  
  .type-name {
    font-size: 0.85rem;
  }
  
  .type-count {
    font-size: 0.7rem;
    padding: 1px 6px;
  }
}

/* iPhone specific optimizations */
@media (max-width: 480px) {
  .modal-content {
    width: 98%;
    margin: max(5px, env(safe-area-inset-top)) max(5px, env(safe-area-inset-right)) max(5px, env(safe-area-inset-bottom)) max(5px, env(safe-area-inset-left));
    border-radius: 6px;
  }
  
  .modal-header {
    padding: 12px;
  }
  
  .modal-header h2 {
    font-size: 1.1rem;
  }
  
  .close-btn {
    width: 24px;
    height: 24px;
    font-size: 18px;
  }
  
  .modal-body {
    padding: 12px;
  }
  
  .section {
    margin-bottom: 16px;
  }
  
  .section h3 {
    font-size: 1rem;
  }
  
  .overview-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .map-container {
    height: 150px;
  }
  
  .place-item {
    padding: 10px;
  }
  
  .place-info h4 {
    font-size: 0.9rem;
  }
  
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .summary-card {
    padding: 10px;
  }
  
  .card-number {
    font-size: 1.1rem;
  }
  
  .card-label {
    font-size: 0.75rem;
  }
}

/* Landscape orientation for iPhone */
@media (max-width: 768px) and (orientation: landscape) {
  .modal-content {
    width: 90%;
    max-height: 90vh;
  }
  
  .map-container {
    height: 120px;
  }
  
  .overview-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .summary-cards {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
