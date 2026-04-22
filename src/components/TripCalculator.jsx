import React, { useState } from 'react';

// Paste your Mapbox Default Public Token here
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYXhieWN6IiwiYSI6ImNtbzllejBqcDA4Z2UycXB3c3RnaTlmYnAifQ.xtI-kIhJ6DEl35eZ3nRdMQ';

export default function TripCalculator() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [oneWayDistance, setOneWayDistance] = useState(0);
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateRoute = async () => {
    if (!origin || !destination) {
      setError("Please enter both starting point and destination.");
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // 1. Get Coordinates for the Starting Point (Mapbox Geocoding API)
      // We use 'fuzzyMatch=true' to make it act smart like Google Maps
      const originRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(origin)}.json?access_token=${MAPBOX_TOKEN}&fuzzyMatch=true&autocomplete=true`);
      const originData = await originRes.json();
      
      if (!originData.features || originData.features.length === 0) {
        throw new Error("Could not find the starting point. Try adjusting the spelling.");
      }
      // Mapbox returns coordinates as [longitude, latitude]
      const originCoords = originData.features[0].center; 

      // 2. Get Coordinates for the Destination (Mapbox Geocoding API)
      const destRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${MAPBOX_TOKEN}&fuzzyMatch=true&autocomplete=true`);
      const destData = await destRes.json();
      
      if (!destData.features || destData.features.length === 0) {
        throw new Error("Could not find the destination. Try adjusting the spelling.");
      }
      const destCoords = destData.features[0].center;

      // 3. Calculate Driving Distance (Mapbox Directions API)
      const osrmUrl = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
      const routeRes = await fetch(osrmUrl);
      const routeData = await routeRes.json();

      if (routeData.code !== 'Ok') {
        throw new Error("Could not calculate driving route between these locations.");
      }

      // Mapbox returns distance in meters. Convert to kilometers.
      const distanceInMeters = routeData.routes[0].distance;
      const distanceInKm = distanceInMeters / 1000;

      setOneWayDistance(distanceInKm);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while calculating the route.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalDistance = isReturnTrip ? (oneWayDistance * 2).toFixed(1) : oneWayDistance.toFixed(1);

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl relative overflow-hidden group mb-6">
      <h3 className="text-lg font-bold text-white mb-4">Trip Distance Calculator</h3>
      
      {/* ERROR MESSAGE */}
      {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">{error}</div>}

      <div className="space-y-4 relative z-10">
        {/* ORIGIN INPUT */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Starting Point</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g., DLF Westend heights"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
          />
        </div>

        {/* DESTINATION INPUT */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g., Dezerv Bangalore"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
          />
        </div>

        {/* ACTION BUTTON */}
        <button 
          onClick={calculateRoute}
          disabled={isLoading}
          className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:opacity-50 text-emerald-400 border border-slate-700 p-3 rounded-xl font-bold transition-colors mt-2"
        >
          {isLoading ? 'Calculating...' : 'Calculate Distance'}
        </button>

        {/* RETURN TRIP TOGGLE */}
        <div className="flex items-center bg-slate-950 p-3 rounded-xl border border-slate-800 mt-2">
          <input 
            type="checkbox" 
            id="calcReturnTrip"
            checked={isReturnTrip}
            onChange={(e) => setIsReturnTrip(e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded bg-slate-800 border-slate-700"
          />
          <label htmlFor="calcReturnTrip" className="ml-3 text-sm font-medium text-slate-200 cursor-pointer">Include Return Trip</label>
        </div>

        {/* RESULTS DISPLAY */}
        {oneWayDistance > 0 && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
            <p className="text-sm text-slate-400">One-way: <span className="text-slate-200">{oneWayDistance.toFixed(1)} km</span></p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{totalDistance} <span className="text-sm font-bold">km total</span></p>
          </div>
        )}
      </div>
    </div>
  );
}