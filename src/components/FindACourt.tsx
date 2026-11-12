'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Star, Clock, Phone, Globe, Filter, ChevronDown } from 'lucide-react';

interface Court {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  vicinity: string;
  formatted_address?: string;
  international_phone_number?: string;
  types?: string[];
  opening_hours?: {
    open_now: boolean;
    periods?: any[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function FindACourt() {
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(7000); // 7km default
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [openNow, setOpenNow] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Load Google Maps only on this tab (not globally — avoids blocking chat on mobile/LAN)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const markLoaded = () => {
      if ((window as any).google?.maps) {
        setGoogleMapsLoaded(true);
      }
    };

    if ((window as any).google?.maps) {
      markLoaded();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-tennis-google-maps]');
    if (existing) {
      existing.addEventListener('load', markLoaded);
      const interval = setInterval(() => {
        if ((window as any).google?.maps) {
          markLoaded();
          clearInterval(interval);
        }
      }, 300);
      return () => {
        existing.removeEventListener('load', markLoaded);
        clearInterval(interval);
      };
    }

    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key is not configured');
      return;
    }

    (window as any).initGoogleMaps = () => {
      (window as any).googleMapsLoaded = true;
      setGoogleMapsLoaded(true);
      window.dispatchEvent(new Event('google-maps-loaded'));
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.dataset.tennisGoogleMaps = 'true';
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      // Keep script cached for revisit; just avoid stale state updates
    };
  }, []);

  // Initialize Google Map
  useEffect(() => {
    if (!map && googleMapsLoaded && mapRef.current) {
      const google = (window as any).google;
      console.log('=== DEBUG: Initializing map ===');
      console.log('Map ref:', mapRef.current);
      try {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 51.5074, lng: -0.1278 }, // Default: London
          zoom: 12,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });
        setMap(mapInstance);
        console.log('=== DEBUG: Map initialized successfully ===');
      } catch (error) {
        console.error('=== DEBUG: Error initializing map ===', error);
      }
    }
  }, [map, googleMapsLoaded]);

  // Search for courts
  const searchCourts = async () => {
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    if (!googleMapsLoaded) {
      setError('Google Maps is still loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setCourts([]);

    try {
      const google = (window as any).google;

      // First, geocode the location using our API route
      const geocodeResponse = await fetch(
        `/api/places?address=${encodeURIComponent(location)}`
      );
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
        setError('Location not found. Please try a more specific address.');
        setLoading(false);
        return;
      }

      const { lat, lng } = geocodeData.results[0].geometry.location;

      // Update map center
      if (map) {
        map.setCenter({ lat, lng });
        map.setZoom(13);
      }

      // Search for nearby tennis courts using our API route
      const placesResponse = await fetch(
        `/api/places?location=${lat},${lng}&radius=${radius}&type=tennis_court`
      );
      const placesData = await placesResponse.json();

      if (placesData.status === 'OK') {
        let results = placesData.results;

        // Filter out non-tennis court results
        results = results.filter((court: Court) => {
          const name = (court.name || '').toLowerCase();
          const types = court.types || [];
          const hasTennisType = types.some((t: string) => t.includes('tennis') || t === 'establishment');
          const hasTennisKeyword = name.includes('tennis') || name.includes('club') || name.includes('court');
          return hasTennisType || hasTennisKeyword;
        });

        // Apply additional filters
        if (minRating > 0) {
          results = results.filter((court: Court) => court.rating >= minRating);
        }
        if (openNow) {
          results = results.filter((court: Court) => court.opening_hours?.open_now);
        }

        setCourts(results);

        // Add markers to map
        if (map) {
          // Clear existing markers
          markers.forEach((marker) => marker.setMap(null));
          const newMarkers = results.map((court: Court) => {
            const marker = new google.maps.Marker({
              position: court.geometry.location,
              map: map,
              title: court.name,
            });

            marker.addListener('click', () => {
              setSelectedCourt(court);
            });

            return marker;
          });
          setMarkers(newMarkers);
        }

        if (results.length === 0) {
          setError('No tennis courts match your filters near this location.');
        }
      } else {
        setError('No tennis courts found near this location.');
      }
    } catch (err: any) {
      console.error('Error searching for courts:', err);
      setError('Failed to search for courts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get photo URL
  const getPhotoUrl = (photoReference: string, maxWidth: number = 400) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`;
  };

  // Get opening hours text
  const getOpeningHoursText = (court: Court) => {
    if (!court.opening_hours) return 'Hours not available';

    if (court.opening_hours.open_now) {
      return 'Open now';
    } else {
      return 'Closed';
    }
  };

  return (
    <div className="h-full flex flex-col bg-clay-100">
      {/* Header with location search */}
      <div className="bg-white border-b border-clay-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <h2 className="text-2xl font-heading font-bold text-navy-900 mb-1">Find a Tennis Court</h2>
            <p className="text-sm text-navy-50">Discover nearby tennis courts with ratings and reviews</p>
          </div>

          {/* Search and filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city or address..."
                className="w-full px-4 py-2.5 border-2 border-clay-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-transparent bg-clay-50 text-navy-900 placeholder:text-navy-50"
                onKeyPress={(e) => e.key === 'Enter' && searchCourts()}
              />
            </div>

            <div className="relative">
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="px-4 py-2.5 border-2 border-clay-200 rounded-lg bg-clay-50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-clay-400 appearance-none pr-10"
              >
                <option value={1000}>1 km</option>
                <option value={3000}>3 km</option>
                <option value={5000}>5 km</option>
                <option value={7000}>7 km</option>
                <option value={10000}>10 km</option>
                <option value={20000}>20 km</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-50 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border-2 ${
                showFilters
                  ? 'bg-clay-300 text-white border-white'
                  : 'bg-clay-100 text-navy-900 border-clay-200 hover:bg-clay-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <button
              onClick={searchCourts}
              disabled={loading}
              className="px-6 py-2.5 bg-wimbledon-500 hover:bg-wimbledon-600 text-white rounded-lg font-medium border-2 border-white shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-3 p-4 bg-clay-50 rounded-lg border-2 border-clay-200 space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-navy-900">Minimum Rating:</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="px-3 py-1.5 border-2 border-clay-200 rounded bg-white text-navy-900 text-sm"
                >
                  <option value={0}>Any</option>
                  <option value={3}>3+ stars</option>
                  <option value={3.5}>3.5+ stars</option>
                  <option value={4}>4+ stars</option>
                  <option value={4.5}>4.5+ stars</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-navy-900">
                  <input
                    type="checkbox"
                    checked={openNow}
                    onChange={(e) => setOpenNow(e.target.checked)}
                    className="w-4 h-4 rounded border-clay-300 text-wimbledon-500 focus:ring-wimbledon-500"
                  />
                  Open now only
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Content - Map View */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full relative">
          {!googleMapsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-clay-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clay-400 mx-auto mb-4"></div>
                <p className="text-navy-900 font-medium">Loading Google Maps...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
          {selectedCourt && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-md border-2 border-white">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-heading font-bold text-lg text-navy-900">{selectedCourt.name}</h3>
                <button
                  onClick={() => setSelectedCourt(null)}
                  className="text-navy-50 hover:text-navy-900 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-navy-900">{selectedCourt.rating}</span>
                <span className="text-xs text-navy-50">({selectedCourt.user_ratings_total} reviews)</span>
              </div>
              <p className="text-sm text-navy-700 mb-2">{selectedCourt.vicinity}</p>
              <div className="flex items-center gap-2 text-xs text-navy-50 mb-3">
                <Clock className="w-3 h-3" />
                <span>{getOpeningHoursText(selectedCourt)}</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCourt.name + ' ' + selectedCourt.vicinity)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-wimbledon-500 hover:text-wimbledon-600 font-medium"
              >
                <Globe className="w-4 h-4" />
                Open in Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
