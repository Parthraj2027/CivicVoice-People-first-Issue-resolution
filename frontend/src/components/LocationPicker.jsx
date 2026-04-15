import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import { Loader2, Search, X as CloseIcon } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import '@/components/LocationPicker.css';

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;
const FOCUSED_ZOOM = 15;
const SEARCH_MIN_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 500;

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const LocationEvents = ({ onSelect }) => {
  useMapEvents({
    click(event) {
      if (!onSelect) return;
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
        source: 'map_click',
      });
    },
  });
  return null;
};

const formatCoordinate = (value) => {
  if (typeof value !== 'number') return null;
  return value.toFixed(6);
};

const LocationPicker = ({
  value,
  onChange,
  readOnly = false,
  height = 260,
  showLocateButton = true,
  label = 'Drop a pin on the map',
  helperText = 'Search for a place, drop a pin, or use your current location to pin the issue.',
  className = '',
  nearbyIssues = [],
  onOpenIssue,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState(null);

  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleSelect = useCallback(
    (coords) => {
      setError(null);
      if (!onChange) return;
      const latitude = Number(coords.latitude);
      const longitude = Number(coords.longitude);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return;
      }

      const normalized = {
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        source: coords.source || 'map_click',
      };

      if (coords.accuracy !== undefined) {
        const accuracy = Number(coords.accuracy);
        if (!Number.isNaN(accuracy)) {
          normalized.accuracy = accuracy;
        }
      }

      mapRef.current?.flyTo([latitude, longitude], FOCUSED_ZOOM, { animate: true });
      setSearchResults([]);
      setSearchFeedback(null);
      onChange(normalized);
    },
    [onChange]
  );

  const handleLocate = useCallback(() => {
    if (!onChange) return;
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        handleSelect({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'device_location',
        });
      },
      (geoError) => {
        setIsLocating(false);
        setError(geoError.message || 'Unable to fetch current location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [handleSelect, onChange]);

  const performSearch = useCallback(async (term) => {
    const query = term.trim();
    if (query.length < SEARCH_MIN_LENGTH) {
      setSearchResults([]);
      setSearchFeedback(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsSearching(true);

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data);
        setSearchFeedback(null);
      } else {
        setSearchResults([]);
        setSearchFeedback({
          message: 'No matches found. Try refining your search.',
          tone: 'info',
        });
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setSearchResults([]);
      setSearchFeedback({
        message: 'Unable to search locations right now.',
        tone: 'error',
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (event) => {
      const nextTerm = event.target.value;
      setSearchTerm(nextTerm);
      setSearchFeedback(null);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (nextTerm.trim().length < SEARCH_MIN_LENGTH) {
        setSearchResults([]);
        return;
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(nextTerm);
      }, SEARCH_DEBOUNCE_MS);
    },
    [performSearch]
  );

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchFeedback(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleSearchResult = useCallback(
    (result) => {
      const latitude = Number(result.lat);
      const longitude = Number(result.lon);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return;
      }

      setSearchTerm(result.display_name || '');
      setSearchResults([]);
      setSearchFeedback(null);
      handleSelect({ latitude, longitude, source: 'search' });
    },
    [handleSelect]
  );

  const handleMapReady = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (typeof value?.latitude === 'number' && typeof value?.longitude === 'number') {
      mapRef.current.setView([value.latitude, value.longitude], FOCUSED_ZOOM);
    } else {
      mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [value?.latitude, value?.longitude]);

  useEffect(() => {
    if (typeof value?.latitude !== 'number' || typeof value?.longitude !== 'number') {
      setSearchTerm('');
      setSearchResults([]);
      setSearchFeedback(null);
    }
  }, [value?.latitude, value?.longitude]);

  const center = useMemo(() => {
    if (typeof value?.latitude === 'number' && typeof value?.longitude === 'number') {
      return [value.latitude, value.longitude];
    }
    return DEFAULT_CENTER;
  }, [value?.latitude, value?.longitude]);

  const hasLocation = typeof value?.latitude === 'number' && typeof value?.longitude === 'number';
  const normalizedNearbyIssues = useMemo(
    () =>
      (Array.isArray(nearbyIssues) ? nearbyIssues : []).filter(
        (item) => typeof item?.coordinates?.latitude === 'number' && typeof item?.coordinates?.longitude === 'number'
      ),
    [nearbyIssues]
  );

  return (
    <div className={`location-picker ${className}`.trim()}>
      {label && (
        <div className="location-picker-header">
          <div>
            <p className="location-picker-label">{label}</p>
            {!readOnly && helperText && (
              <p className="location-picker-helper">{helperText}</p>
            )}
          </div>
          {!readOnly && showLocateButton && (
            <button
              type="button"
              className="location-picker-button"
              onClick={handleLocate}
              disabled={isLocating}
            >
              {isLocating ? 'Locating…' : 'Use my location'}
            </button>
          )}
        </div>
      )}

      {!readOnly && (
        <div className="location-search">
          <div className="location-search-input">
            <Search size={16} className="location-search-icon" aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search for a place or address"
              aria-label="Search for a location"
            />
            {searchTerm && !isSearching && (
              <button
                type="button"
                className="location-search-clear"
                onClick={handleSearchClear}
                aria-label="Clear search"
              >
                <CloseIcon size={14} />
              </button>
            )}
            {isSearching && <Loader2 size={16} className="location-search-spinner" aria-hidden="true" />}
          </div>

          {searchFeedback && (
            <p
              className={`location-search-feedback ${
                searchFeedback.tone === 'error' ? 'error' : 'info'
              }`}
            >
              {searchFeedback.message}
            </p>
          )}

          {searchResults.length > 0 && (
            <ul className="location-search-results">
              {searchResults.map((result) => {
                const [primary, ...rest] = (result.display_name || '').split(',');
                const secondary = rest.join(', ').trim();
                return (
                  <li key={result.place_id}>
                    <button type="button" onClick={() => handleSearchResult(result)}>
                      <span className="location-result-primary">
                        {primary || 'Unnamed location'}
                      </span>
                      {secondary && (
                        <span className="location-result-secondary">{secondary}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {hasLocation && (
        <div className="location-picker-coords">
          Lat {formatCoordinate(value.latitude)}, Lng {formatCoordinate(value.longitude)}
          {value.accuracy ? ` • ±${Math.round(value.accuracy)} m` : ''}
        </div>
      )}
      {error && <p className="location-picker-error">{error}</p>}

      <div className="location-map-wrapper" style={{ height }}>
        <MapContainer
          center={center}
          zoom={hasLocation ? FOCUSED_ZOOM : DEFAULT_ZOOM}
          className="location-map"
          scrollWheelZoom={!readOnly}
          dragging={!readOnly}
          doubleClickZoom={!readOnly}
          boxZoom={!readOnly}
          keyboard={!readOnly}
          whenCreated={handleMapReady}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {hasLocation && (
            <Marker
              position={[value.latitude, value.longitude]}
              icon={defaultMarkerIcon}
            />
          )}
          {normalizedNearbyIssues.map((issue) => (
            <Marker
              key={issue._id || `${issue.coordinates.latitude}-${issue.coordinates.longitude}`}
              position={[issue.coordinates.latitude, issue.coordinates.longitude]}
              icon={defaultMarkerIcon}
            >
              <Popup>
                <div className="location-nearby-popup">
                  <strong>{issue.title || issue.issueType || 'Nearby issue'}</strong>
                  <small>
                    {(issue.issueTrack || 'issue').toUpperCase()} • {(issue.status || 'pending').replace('_', ' ')}
                  </small>
                  {typeof issue.distanceKm === 'number' ? (
                    <small>{issue.distanceKm.toFixed(2)} km away</small>
                  ) : null}
                  {onOpenIssue ? (
                    <button
                      type="button"
                      className="location-nearby-open"
                      onClick={() => onOpenIssue(issue)}
                    >
                      Open issue
                    </button>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
          {!readOnly && onChange && <LocationEvents onSelect={handleSelect} />}
        </MapContainer>
      </div>

      {!readOnly && !hasLocation && (
        <p className="location-picker-hint">Tap the map or search above to place a pin.</p>
      )}
    </div>
  );
};

export default LocationPicker;
