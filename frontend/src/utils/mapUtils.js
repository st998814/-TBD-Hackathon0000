// Map utilities for CityWalk app
// This can be extended to integrate with Google Maps API or other mapping services

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate total distance for a route with multiple points
 * @param {Array} routePoints - Array of {lat, lng} objects
 * @returns {number} Total distance in meters
 */
export const calculateRouteDistance = (routePoints) => {
  if (routePoints.length < 2) return 0
  
  let totalDistance = 0
  for (let i = 1; i < routePoints.length; i++) {
    const prev = routePoints[i - 1]
    const curr = routePoints[i]
    totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng)
  }
  return totalDistance
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  } else {
    return `${(meters / 1000).toFixed(1)}km`
  }
}

/**
 * Format duration for display
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Map our interest types to Google Places API types
 * @param {Array} interestTypes - Array of our interest types
 * @returns {Array} Array of Google Places API types
 */
export const mapInterestTypesToGoogleTypes = (interestTypes) => {
  const typeMapping = {
    // Basic amenities
    'toilet': ['restroom'],
    'shopping': ['store', 'shopping_mall', 'clothing_store'],
    'food': ['restaurant', 'food'],
    'coffee': ['cafe'],
    'dessert': ['bakery', 'dessert'],
    'markets': ['supermarket', 'convenience_store'],
    'bookstores': ['book_store', 'library'],
    
    // Services (these are harder to map directly)
    'free_wifi': ['cafe', 'library', 'restaurant'], // Places with WiFi
    'charging_spots': ['cafe', 'library', 'restaurant'], // Places with charging
    'parking': ['parking'], // Direct mapping
    'accessible': [], // This would need to be filtered from results
    
    // Price levels (these need filtering from results)
    'budget_friendly': [], // Filter by price_level
    'luxury': [], // Filter by price_level
    
    // Activities
    'photo_spots': ['tourist_attraction', 'park', 'museum'],
    'music': ['night_club', 'bar'],
    'film': ['movie_theater'],
    'anime': [], // No direct mapping
    'gaming': ['amusement_park', 'bowling_alley'],
    'comedy': ['night_club', 'bar'],
    'arts': ['art_gallery', 'museum'],
    'fashion': ['clothing_store', 'shopping_mall'],
    'health': ['hospital', 'pharmacy', 'gym'],
    'sports_fitness': ['gym', 'stadium', 'sports_complex'],
    'hiking': ['park', 'tourist_attraction'],
    'parks': ['park'],
    'museums': ['museum'],
    'live_music': ['night_club', 'bar'],
    'nightlife': ['night_club', 'bar'],
    
    // Demographics (these need filtering)
    'family_friendly': [], // Filter from results
    'pet_friendly': [], // Filter from results
    
    // Categories
    'travel_outdoor': ['park', 'tourist_attraction', 'campground'],
    'community': ['church', 'library', 'community_center'],
    'charities_causes': ['church', 'community_center'],
    'government': ['city_hall', 'courthouse', 'embassy'],
    'home_lifestyle': ['furniture_store', 'home_goods_store'],
    'seasonal': [], // No direct mapping
    'science_tech': ['university', 'library'],
    'film_media': ['movie_theater', 'library']
  }
  
  const googleTypes = []
  interestTypes.forEach(interest => {
    const mappedTypes = typeMapping[interest] || []
    googleTypes.push(...mappedTypes)
  })
  
  // Remove duplicates
  return [...new Set(googleTypes)]
}

/**
 * Get readable place type from Google Places API types
 * @param {Array} types - Array of place types from Google Places API
 * @returns {string} Readable place type
 */
export const getPlaceType = (types) => {
  if (!types || types.length === 0) return 'Unknown'
  
  const typeMap = {
    'restaurant': 'Restaurant',
    'food': 'Food',
    'store': 'Store',
    'shopping_mall': 'Shopping Mall',
    'supermarket': 'Supermarket',
    'gas_station': 'Gas Station',
    'bank': 'Bank',
    'hospital': 'Hospital',
    'pharmacy': 'Pharmacy',
    'school': 'School',
    'park': 'Park',
    'tourist_attraction': 'Tourist Attraction',
    'museum': 'Museum',
    'church': 'Church',
    'gym': 'Gym',
    'cafe': 'Cafe',
    'bar': 'Bar',
    'lodging': 'Hotel',
    'atm': 'ATM',
    'post_office': 'Post Office',
    'beauty_salon': 'Beauty Salon',
    'hair_care': 'Hair Care',
    'clothing_store': 'Clothing Store',
    'electronics_store': 'Electronics Store',
    'book_store': 'Book Store',
    'library': 'Library',
    'movie_theater': 'Movie Theater',
    'night_club': 'Night Club',
    'spa': 'Spa',
    'zoo': 'Zoo',
    'aquarium': 'Aquarium',
    'restroom': 'Restroom',
    'parking': 'Parking',
    'art_gallery': 'Art Gallery',
    'stadium': 'Stadium',
    'sports_complex': 'Sports Complex',
    'city_hall': 'City Hall',
    'courthouse': 'Courthouse',
    'embassy': 'Embassy',
    'furniture_store': 'Furniture Store',
    'home_goods_store': 'Home Goods Store',
    'university': 'University',
    'community_center': 'Community Center',
    'campground': 'Campground',
    'amusement_park': 'Amusement Park',
    'bowling_alley': 'Bowling Alley',
    'bakery': 'Bakery'
  }
  
  const firstType = types[0]
  return typeMap[firstType] || firstType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Create a simple map visualization (placeholder for Google Maps integration)
 * @param {HTMLElement} container - Container element for the map
 * @param {Array} routePoints - Array of route points
 * @param {Array} discoveredPlaces - Array of discovered places
 */
export const createSimpleMap = (container, routePoints, discoveredPlaces = []) => {
  if (!container) return
  
  // Create a simple SVG-based map visualization
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '200')
  svg.setAttribute('viewBox', '0 0 400 200')
  svg.style.background = '#f0f8ff'
  
  if (routePoints.length > 0) {
    // Calculate bounds
    const lats = routePoints.map(p => p.lat)
    const lngs = routePoints.map(p => p.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    
    // Add some padding
    const latPadding = (maxLat - minLat) * 0.1
    const lngPadding = (maxLng - minLng) * 0.1
    
    const latRange = (maxLat - minLat + latPadding * 2) || 0.01
    const lngRange = (maxLng - minLng + lngPadding * 2) || 0.01
    
    // Convert coordinates to SVG coordinates
    const toSVG = (lat, lng) => {
      const x = ((lng - (minLng - lngPadding)) / lngRange) * 400
      const y = ((maxLat + latPadding - lat) / latRange) * 200
      return { x, y }
    }
    
    // Draw route line
    if (routePoints.length > 1) {
      const path = routePoints.map(point => toSVG(point.lat, point.lng))
      const pathData = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      pathElement.setAttribute('d', pathData)
      pathElement.setAttribute('stroke', '#3b82f6')
      pathElement.setAttribute('stroke-width', '3')
      pathElement.setAttribute('fill', 'none')
      pathElement.setAttribute('stroke-linecap', 'round')
      pathElement.setAttribute('stroke-linejoin', 'round')
      svg.appendChild(pathElement)
    }
    
    // Draw route points
    routePoints.forEach((point, index) => {
      const { x, y } = toSVG(point.lat, point.lng)
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', x)
      circle.setAttribute('cy', y)
      circle.setAttribute('r', index === 0 ? '6' : '4')
      circle.setAttribute('fill', index === 0 ? '#10b981' : '#3b82f6')
      circle.setAttribute('stroke', 'white')
      circle.setAttribute('stroke-width', '2')
      svg.appendChild(circle)
    })
    
    // Draw discovered places
    discoveredPlaces.forEach(place => {
      if (place.lat && place.lng) {
        const { x, y } = toSVG(place.lat, place.lng)
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        marker.setAttribute('cx', x)
        marker.setAttribute('cy', y)
        marker.setAttribute('r', '5')
        marker.setAttribute('fill', '#f59e0b')
        marker.setAttribute('stroke', 'white')
        marker.setAttribute('stroke-width', '2')
        svg.appendChild(marker)
      }
    })
  } else {
    // Show placeholder when no route data
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', '200')
    text.setAttribute('y', '100')
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('fill', '#6b7280')
    text.setAttribute('font-family', 'Arial, sans-serif')
    text.setAttribute('font-size', '14')
    text.textContent = 'No route data available'
    svg.appendChild(text)
  }
  
  container.innerHTML = ''
  container.appendChild(svg)
}

/**
 * Initialize Google Maps with route and discovered places
 * @param {HTMLElement} container - Container element
 * @param {Array} routePoints - Route points
 * @param {Array} discoveredPlaces - Discovered places
 * @param {string} apiKey - Google Maps API key
 */
export const initializeGoogleMaps = async (container, routePoints, discoveredPlaces = [], apiKey = '') => {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps API not loaded')
    // Fall back to simple map
    createSimpleMap(container, routePoints, discoveredPlaces)
    return
  }

  if (!container) return

  try {
    // Create map
    const map = new google.maps.Map(container, {
      zoom: 15,
      center: routePoints.length > 0 
        ? { lat: routePoints[0].lat, lng: routePoints[0].lng }
        : { lat: 39.9042, lng: 116.4074 }, // Default to Beijing
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    })

    // Create polyline for route
    if (routePoints.length > 1) {
      const path = routePoints.map(point => ({
        lat: point.lat,
        lng: point.lng
      }))

      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 1.0,
        strokeWeight: 4
      })

      polyline.setMap(map)

      // Fit map to show entire route
      const bounds = new google.maps.LatLngBounds()
      path.forEach(point => bounds.extend(point))
      map.fitBounds(bounds)
    }

    // Add markers for route points
    routePoints.forEach((point, index) => {
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        title: `Point ${index + 1}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: index === 0 ? 8 : 6,
          fillColor: index === 0 ? '#10b981' : '#3b82f6',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2
        }
      })

      // Add info window for start/end points
      if (index === 0 || index === routePoints.length - 1) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <strong>${index === 0 ? 'Start' : 'End'} Point</strong><br>
              <small>${new Date(point.timestamp).toLocaleTimeString()}</small>
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(map, marker)
        })
      }
    })

    // Add markers for discovered places
    discoveredPlaces.forEach(place => {
      if (place.lat && place.lng) {
        const marker = new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map: map,
          title: place.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#f59e0b',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2
          }
        })

        // Add info window for discovered places
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <strong>${place.name}</strong><br>
              <small>${getPlaceType(place.types)}</small><br>
              ${place.rating ? `<small>⭐ ${place.rating}/5</small><br>` : ''}
              ${place.distance ? `<small>📍 ${formatDistance(place.distance)} away</small>` : ''}
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(map, marker)
        })
      }
    })

    // Store map instance for potential future use
    container._googleMap = map

  } catch (error) {
    console.error('Error initializing Google Maps:', error)
    // Fall back to simple map
    createSimpleMap(container, routePoints, discoveredPlaces)
  }
}

/**
 * Wait for Google Maps API to load
 * @returns {Promise} Promise that resolves when Google Maps is loaded
 */
export const waitForGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve()
      return
    }

    const checkInterval = setInterval(() => {
      if (window.google && window.google.maps) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 100)

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval)
      reject(new Error('Google Maps API failed to load'))
    }, 10000)
  })
}

/**
 * Google Places API integration
 */
export class PlacesService {
  constructor() {
    this.service = null
    this.cache = new Map()
    this.cacheTimeout = 300000 // 5 minutes TTL for large radius searches
    this.lastQueryTime = 0
    this.lastQueryLocation = null
    this.minQueryInterval = 60000 // 1 minute minimum interval
    this.minDistanceThreshold = 500 // 500 meters - only search again if moved this far
    this.lastLargeRadiusSearch = null // Track last large radius search
    this.largeRadiusSearchRadius = 1000 // 1km initial search radius
    this.currentPlacesCache = new Map() // Cache for current area places
  }

  /**
   * Initialize the Places service
   */
  async initialize() {
    await waitForGoogleMaps()
    
    if (!window.google.maps.places) {
      throw new Error('Google Places API not loaded')
    }
    
    this.service = new google.maps.places.PlacesService(document.createElement('div'))
  }

  /**
   * Check if we should query based on distance-based strategy
   * @param {number} lat - Current latitude
   * @param {number} lng - Current longitude
   * @returns {Object} Query decision with reason
   */
  shouldQuery(lat, lng) {
    const now = Date.now()
    const timeSinceLastQuery = now - this.lastQueryTime
    
    // If no previous search, definitely search
    if (!this.lastQueryLocation) {
      return { shouldQuery: true, reason: 'first_search' }
    }
    
    // Check distance from last search location
    const distanceFromLastSearch = calculateDistance(
      this.lastQueryLocation.lat,
      this.lastQueryLocation.lng,
      lat,
      lng
    )
    
    // If moved more than 500m from last search, search again
    if (distanceFromLastSearch >= this.minDistanceThreshold) {
      return { shouldQuery: true, reason: 'moved_far_enough' }
    }
    
    // If time has passed and we're near the edge of our search area
    if (timeSinceLastQuery > this.minQueryInterval) {
      return { shouldQuery: true, reason: 'time_based_refresh' }
    }
    
    return { shouldQuery: false, reason: 'within_search_area' }
  }

  /**
   * Get cache key for query
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Search radius
   * @param {Array} types - Place types
   * @returns {string} Cache key
   */
  getCacheKey(lat, lng, radius, types) {
    const roundedLat = Math.round(lat * 1000) / 1000
    const roundedLng = Math.round(lng * 1000) / 1000
    const sortedTypes = [...types].sort()
    return `${roundedLat},${roundedLng},${radius},${sortedTypes.join(',')}`
  }

  /**
   * Check if cache entry is valid
   * @param {Object} cacheEntry - Cache entry
   * @returns {boolean} Whether cache is valid
   */
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout
  }

  /**
   * Filter places within user's search radius from cached large radius search
   * @param {number} userLat - User's current latitude
   * @param {number} userLng - User's current longitude
   * @param {number} userRadius - User's search radius in meters
   * @param {Array} types - Place types to filter
   * @returns {Array} Filtered places within user's radius
   */
  filterPlacesWithinRadius(userLat, userLng, userRadius, types) {
    const filteredPlaces = []
    
    // Get all cached places from the large radius search
    for (const [cacheKey, cacheEntry] of this.cache.entries()) {
      if (this.isCacheValid(cacheEntry) && cacheEntry.data) {
        cacheEntry.data.forEach(place => {
          // Calculate distance from user's current location
          const distance = calculateDistance(userLat, userLng, place.lat, place.lng)
          
          // Check if place is within user's radius
          if (distance <= userRadius) {
            // Check if place matches any of the requested types
            const matchesType = types.length === 0 || types.some(type => 
              place.types && place.types.includes(type)
            )
            
            if (matchesType) {
              // Update distance to current user location
              const updatedPlace = {
                ...place,
                distance: distance
              }
              filteredPlaces.push(updatedPlace)
            }
          }
        })
      }
    }
    
    // Remove duplicates based on place_id
    const uniquePlaces = filteredPlaces.filter((place, index, self) => 
      index === self.findIndex(p => p.place_id === place.place_id)
    )
    
    // Sort by distance
    return uniquePlaces.sort((a, b) => a.distance - b.distance)
  }

  /**
   * Search for nearby places with optimized strategy
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} userRadius - User's search radius in meters
   * @param {Array} types - Place types to search for
   * @returns {Promise<Array>} Array of places
   */
  async searchNearbyPlaces(lat, lng, userRadius = 150, types = ['restaurant', 'cafe']) {
    if (!this.service) {
      await this.initialize()
    }

    // Check if we should query based on distance strategy
    const queryDecision = this.shouldQuery(lat, lng)
    console.log('Query decision:', queryDecision)

    // If we have cached data and don't need to query, filter from cache
    if (!queryDecision.shouldQuery) {
      const cachedPlaces = this.filterPlacesWithinRadius(lat, lng, userRadius, types)
      console.log(`Using cached data: ${cachedPlaces.length} places within ${userRadius}m`)
      return cachedPlaces
    }

    // Need to perform a new search - use large radius (1km)
    const searchRadius = this.largeRadiusSearchRadius
    const cacheKey = this.getCacheKey(lat, lng, searchRadius, types)

    try {
      // Update query tracking
      this.lastQueryTime = Date.now()
      this.lastQueryLocation = { lat, lng }
      this.lastLargeRadiusSearch = { lat, lng, timestamp: Date.now() }

      // Create request for large radius search
      const request = {
        location: new google.maps.LatLng(lat, lng),
        radius: searchRadius,
        type: types.length === 1 ? types[0] : undefined,
        types: types.length > 1 ? types : undefined
      }

      console.log(`Performing large radius search: ${searchRadius}m for types:`, types)

      // Execute search
      const results = await new Promise((resolve, reject) => {
        this.service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            resolve(results || [])
          } else {
            console.warn('Places API error:', status)
            resolve([])
          }
        })
      })

      // Process results
      const processedResults = results.map(place => ({
        place_id: place.place_id,
        name: place.name,
        types: place.types || [],
        rating: place.rating || 0,
        lat: place.geometry?.location?.lat() || 0,
        lng: place.geometry?.location?.lng() || 0,
        distance: calculateDistance(lat, lng, place.geometry?.location?.lat() || 0, place.geometry?.location?.lng() || 0),
        vicinity: place.vicinity || '',
        price_level: place.price_level,
        photos: place.photos || []
      }))

      // Cache the large radius results
      this.cache.set(cacheKey, {
        data: processedResults,
        timestamp: Date.now()
      })

      // Filter results to user's radius
      const userPlaces = this.filterPlacesWithinRadius(lat, lng, userRadius, types)

      console.log(`Large radius search found ${processedResults.length} places, ${userPlaces.length} within user radius ${userRadius}m`)
      return userPlaces

    } catch (error) {
      console.error('Error searching nearby places:', error)
      return []
    }
  }

  /**
   * Get place details
   * @param {string} placeId - Place ID
   * @returns {Promise<Object>} Place details
   */
  async getPlaceDetails(placeId) {
    if (!this.service) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'rating', 'types', 'photos', 'price_level', 'opening_hours']
      }

      this.service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(place)
        } else {
          reject(new Error(`Places API error: ${status}`))
        }
      })
    })
  }
}

// Export singleton instance
export const placesService = new PlacesService()

/**
 * Available place types for selection
 */
export const AVAILABLE_PLACE_TYPES = [
  // Basic amenities
  { value: 'toilet', label: 'Toilet', icon: '🚻' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'food', label: 'Food', icon: '👨‍🍳' },
  { value: 'coffee', label: 'Coffee', icon: '☕' },
  { value: 'dessert', label: 'Dessert', icon: '🍰' },
  { value: 'markets', label: 'Markets', icon: '🛒' },
  { value: 'bookstores', label: 'Bookstores', icon: '📚' },
  
  // Services
  { value: 'free_wifi', label: 'Free Wi-Fi', icon: '📶' },
  { value: 'charging_spots', label: 'Charging Spots', icon: '🔌' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'accessible', label: 'Accessible', icon: '♿' },
  
  // Price levels
  { value: 'budget_friendly', label: 'Budget-friendly', icon: '💰' },
  { value: 'luxury', label: 'Luxury', icon: '💎' },
  
  // Activities
  { value: 'photo_spots', label: 'Photo Spots', icon: '📸' },
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'film', label: 'Film', icon: '🎬' },
  { value: 'anime', label: 'Anime', icon: '🌀' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'comedy', label: 'Comedy', icon: '😂' },
  { value: 'arts', label: 'Arts', icon: '🎨' },
  { value: 'fashion', label: 'Fashion', icon: '👗' },
  { value: 'health', label: 'Health', icon: '❤️' },
  { value: 'sports_fitness', label: 'Sports & Fitness', icon: '🏃' },
  { value: 'hiking', label: 'Hiking', icon: '🥾' },
  { value: 'parks', label: 'Parks', icon: '🌳' },
  { value: 'museums', label: 'Museums', icon: '🏛️' },
  { value: 'live_music', label: 'Live Music', icon: '🎸' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌃' },
  
  // Demographics
  { value: 'family_friendly', label: 'Family-friendly', icon: '👨‍👩‍👧‍👦' },
  { value: 'pet_friendly', label: 'Pet-friendly', icon: '🐾' },
  
  // Categories
  { value: 'travel_outdoor', label: 'Travel & Outdoor', icon: '🏖️' },
  { value: 'community', label: 'Community', icon: '🤝' },
  { value: 'charities_causes', label: 'Charities & Causes', icon: '🎗️' },
  { value: 'government', label: 'Government', icon: '🏛️' },
  { value: 'home_lifestyle', label: 'Home & Lifestyle', icon: '🏠' },
  { value: 'seasonal', label: 'Seasonal', icon: '💜' },
  { value: 'science_tech', label: 'Science & Tech', icon: '🧪' },
  { value: 'film_media', label: 'Film & Media', icon: '🎭' }
]

/**
 * Check if geolocation is supported
 * @returns {boolean} True if geolocation is supported
 */
export const isGeolocationSupported = () => {
  return 'geolocation' in navigator
}

/**
 * Get current position with error handling
 * @param {Object} options - Geolocation options
 * @returns {Promise} Promise that resolves with position or rejects with error
 */
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }
    
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      { ...defaultOptions, ...options }
    )
  })
}

/**
 * Watch position with error handling
 * @param {Function} successCallback - Success callback
 * @param {Function} errorCallback - Error callback
 * @param {Object} options - Geolocation options
 * @returns {number} Watch ID
 */
export const watchPosition = (successCallback, errorCallback, options = {}) => {
  if (!isGeolocationSupported()) {
    errorCallback(new Error('Geolocation is not supported by this browser'))
    return null
  }
  
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 1000
  }
  
  return navigator.geolocation.watchPosition(
    successCallback,
    errorCallback,
    { ...defaultOptions, ...options }
  )
}
