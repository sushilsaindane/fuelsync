import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as MapIcon, Plus, Trash2 } from 'lucide-react';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';
import TripCalculator from './TripCalculator';

export default function RoutesTab({ config, saveConfig, extraTrips, user, showToast }) {
  const [localCfg, setLocalCfg] = useState(config);
  
  // Extra Trip State
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [tripDesc, setTripDesc] = useState('');
  const [tripDist, setTripDist] = useState('');
  const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
  const [tripIsRoundTrip, setTripIsRoundTrip] = useState(false); // New Round Trip State

  const handleSaveRoute = () => saveConfig(localCfg);

  const handleAddTrip = async (e) => {
    e.preventDefault();
    if (!tripDist || !tripDesc) return;

    // Calculate final distance and update description before saving
    const finalDistance = tripIsRoundTrip ? Number(tripDist) * 2 : Number(tripDist);
    const finalDescription = tripIsRoundTrip ? `${tripDesc} (Round Trip)` : tripDesc;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'extraTrips'), {
        date: tripDate,
        distance: finalDistance,
        description: finalDescription,
        timestamp: new Date().getTime()
      });
      showToast('Trip saved!');
      
      // Reset form
      setIsAddingTrip(false); 
      setTripDesc(''); 
      setTripDist('');
      setTripIsRoundTrip(false);
    } catch(err) { 
      showToast('Error saving trip', 'error'); 
    }
  };

  const deleteTrip = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'extraTrips', id));
    showToast('Trip deleted');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Mapbox Distance Calculator */}
      <TripCalculator />

      {/* 2. Primary Commute Planner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-1 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 opacity-30 pointer-events-none"></div>
        
        <div className="bg-slate-950/80 backdrop-blur-xl rounded-[1.3rem] p-5 relative z-10 border border-slate-800/50">
          <h3 className="text-lg font-bold text-white flex items-center mb-5">
            <MapIcon className="w-5 h-5 mr-2 text-blue-400"/> Primary Commute Map
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
               <div className="flex flex-col items-center mr-3 mt-3">
                 <div className="w-3 h-3 rounded-full border-2 border-emerald-400 bg-slate-950 z-10"></div>
                 <div className="w-0.5 h-10 bg-slate-800"></div>
                 <div className="w-3 h-3 rounded-full border-2 border-rose-500 bg-slate-950 z-10"></div>
               </div>
               <div className="flex-1 space-y-3">
                 <input type="text" value={localCfg.commuteOrigin} onChange={e=>setLocalCfg({...localCfg, commuteOrigin: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 outline-none transition-colors" placeholder="Origin" />
                 <input type="text" value={localCfg.commuteDestination} onChange={e=>setLocalCfg({...localCfg, commuteDestination: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 outline-none transition-colors" placeholder="Destination" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">One Way Dist (km)</label>
                <input type="number" step="0.1" value={localCfg.commuteDistance} onChange={e=>setLocalCfg({...localCfg, commuteDistance: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-bold outline-none mt-1 transition-colors" />
              </div>
              <div>
                 <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Days / Week</label>
                 <select value={localCfg.commuteDaysPerWeek} onChange={e=>setLocalCfg({...localCfg, commuteDaysPerWeek: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-bold outline-none mt-1 appearance-none transition-colors">
                    {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} Days</option>)}
                 </select>
              </div>
            </div>

            <div className="flex items-center bg-slate-900 p-3 rounded-xl border border-slate-800 mt-2">
              <input type="checkbox" id="roundtrip" checked={localCfg.isRoundTrip} onChange={e=>setLocalCfg({...localCfg, isRoundTrip: e.target.checked})} className="w-5 h-5 accent-blue-500 rounded bg-slate-800 border-slate-700 cursor-pointer" />
              <label htmlFor="roundtrip" className="ml-3 text-sm font-medium text-slate-200 cursor-pointer flex-1">This is a Round Trip</label>
              <span className="text-xs font-bold text-blue-400">{localCfg.isRoundTrip ? (localCfg.commuteDistance * 2).toFixed(1) : localCfg.commuteDistance} km/day</span>
            </div>

            <button onClick={handleSaveRoute} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors border border-slate-700">
              Update Commute Settings
            </button>
          </div>
        </div>
      </div>

      {/* 3. Extra Trips Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Extra Trips</h3>
          <button onClick={() => setIsAddingTrip(!isAddingTrip)} className="bg-emerald-500/10 text-emerald-400 p-2 rounded-full hover:bg-emerald-500/20 transition-colors">
            <Plus size={18} />
          </button>
        </div>

        <AnimatePresence>
          {isAddingTrip && (
            <motion.form initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} onSubmit={handleAddTrip} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-4 overflow-hidden space-y-3">
              
              <input type="text" required placeholder="Where to? (e.g. Grocery Run)" value={tripDesc} onChange={e=>setTripDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors" />
              
              <div className="flex space-x-3">
                <input type="number" step="0.1" required placeholder="One-way Dist (km)" value={tripDist} onChange={e=>setTripDist(e.target.value)} className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors" />
                <input type="date" required value={tripDate} onChange={e=>setTripDate(e.target.value)} className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors" />
              </div>

              {/* The new Round Trip Toggle */}
              <div className="flex items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                <input 
                  type="checkbox" 
                  id="extraRoundTrip"
                  checked={tripIsRoundTrip}
                  onChange={(e) => setTripIsRoundTrip(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded bg-slate-800 border-slate-700 cursor-pointer"
                />
                <label htmlFor="extraRoundTrip" className="ml-3 text-sm font-medium text-slate-300 cursor-pointer flex-1">Make this a Round Trip</label>
                
                {/* Shows exactly what will be saved to Firebase */}
                {tripDist && (
                  <span className="text-xs font-bold text-emerald-400">
                    {tripIsRoundTrip ? (Number(tripDist) * 2).toFixed(1) : Number(tripDist).toFixed(1)} km total
                  </span>
                )}
              </div>

              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-lg transition-colors">Save Trip</button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* List of saved Extra Trips */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
          {extraTrips.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">No extra trips recorded yet.</p>
          ) : (
            extraTrips.map(trip => (
              <div key={trip.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center group">
                <div>
                  <p className="text-white font-medium text-sm">{trip.description}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{new Date(trip.date).toLocaleDateString()} • <span className="text-blue-400">{trip.distance} km</span></p>
                </div>
                <button onClick={() => deleteTrip(trip.id)} className="text-slate-600 hover:text-rose-500 transition-colors p-2"><Trash2 size={16} /></button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}