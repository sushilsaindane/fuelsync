import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Plus, Trash2, BellOff } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';

export default function SettingsTab({ config, saveConfig, user, fuelLogs, extraTrips, showToast, requestNotificationPermission }) {
  const [localCfg, setLocalCfg] = useState(config);
  const [showConfirm, setShowConfirm] = useState(false);

  // States for Notification Multi-Select
  const [newThresholdMode, setNewThresholdMode] = useState('2');
  const [customThreshold, setCustomThreshold] = useState('');

  // Fallback values
  const activeThresholds = localCfg.notificationThresholds || [];
  const notificationsEnabled = localCfg.notificationsEnabled !== false; // Default true if undefined

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalCfg(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSave = () => saveConfig(localCfg);

  // --- NOTIFICATION HANDLERS ---
  const toggleMasterSwitch = () => {
    const newVal = !notificationsEnabled;
    const newConfig = { ...localCfg, notificationsEnabled: newVal };
    setLocalCfg(newConfig);
    saveConfig(newConfig); // Auto-save when toggled
    if (newVal) requestNotificationPermission();
  };

  const handleAddThreshold = () => {
    if (!notificationsEnabled) {
      showToast('Turn on Push Notifications first', 'error');
      return;
    }

    let val = newThresholdMode === 'custom' ? Number(customThreshold) : Number(newThresholdMode);
    
    if (!val || val <= 0) {
      showToast('Please enter a valid number of days', 'error');
      return;
    }
    
    if (!activeThresholds.includes(val)) {
      const updated = [...activeThresholds, val].sort((a, b) => b - a);
      const newConfig = { ...localCfg, notificationThresholds: updated };
      
      setLocalCfg(newConfig);
      saveConfig(newConfig);
      requestNotificationPermission(); 
    } else {
      showToast('Alert already exists!', 'error');
    }
    
    setNewThresholdMode('2');
    setCustomThreshold('');
  };

  const handleRemoveThreshold = (val) => {
    const updated = activeThresholds.filter(t => t !== val);
    const newConfig = { ...localCfg, notificationThresholds: updated };
    setLocalCfg(newConfig);
    saveConfig(newConfig);
  };

  const handleReset = async () => {
    try {
      for (const log of fuelLogs) await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'fuelLogs', log.id));
      for (const trip of extraTrips) await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'extraTrips', trip.id));
      await saveConfig({ ...localCfg, baseDate: new Date().toISOString().split('T')[0] });
      setShowConfirm(false);
      showToast('All data reset to zero', 'success');
    } catch(err) { showToast('Error resetting data', 'error'); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <h3 className="text-white font-bold mb-4 flex items-center"><Settings className="w-5 h-5 mr-2 text-slate-400"/> Bike Configuration</h3>
        <div className="space-y-4">
          <div className="flex space-x-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Make</label>
              <input type="text" name="bikeMake" value={localCfg.bikeMake} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white transition-colors focus:border-emerald-500 outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Model</label>
              <input type="text" name="bikeModel" value={localCfg.bikeModel} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white transition-colors focus:border-emerald-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block flex justify-between">
              <span>Avg Mileage (kmpl)</span>
              <span className="text-emerald-400">{localCfg.mileage} kmpl</span>
            </label>
            <input type="range" name="mileage" min="10" max="80" step="0.5" value={localCfg.mileage} onChange={handleChange} className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2" />
          </div>
          
          <button onClick={handleSave} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 mt-2 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* --- NOTIFICATION SECTION WITH MASTER TOGGLE --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold flex items-center"><Bell className="w-5 h-5 mr-2 text-slate-400"/> Refill Alerts</h3>
          <button onClick={requestNotificationPermission} className="text-[10px] uppercase font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-1 rounded transition-colors border border-slate-700">
            Fix Perms
          </button>
        </div>

        {/* 1. THE MASTER TOGGLE */}
        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 mb-5">
           <div>
             <p className="text-white font-medium text-sm">Push Notifications</p>
             <p className="text-slate-400 text-xs">Master switch for all alerts</p>
           </div>
           <button onClick={toggleMasterSwitch} className={`w-12 h-6 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
             <motion.div animate={{ x: notificationsEnabled ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm"></motion.div>
           </button>
        </div>

        {/* Wrapped the alert settings in a div that fades out if the master switch is off */}
        <div className={`transition-opacity duration-300 ${notificationsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="flex flex-wrap gap-2 mb-5">
            {activeThresholds.length === 0 ? (
               <span className="text-slate-500 text-sm">No alerts set.</span>
            ) : (
               activeThresholds.map(days => (
                 <motion.div initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}} key={days} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-sm font-bold flex items-center shadow-sm">
                   {days} {days === 1 ? 'Day' : 'Days'} Left
                   <button onClick={() => handleRemoveThreshold(days)} className="ml-2 text-emerald-400 hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-rose-500/10"><Trash2 size={14}/></button>
                 </motion.div>
               ))
            )}
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <select 
              value={newThresholdMode} 
              onChange={e => setNewThresholdMode(e.target.value)} 
              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-sm outline-none flex-1 transition-colors focus:border-emerald-500"
            >
              <option value="1">1 Day Left</option>
              <option value="2">2 Days Left</option>
              <option value="3">3 Days Left</option>
              <option value="4">4 Days Left</option>
              <option value="5">5 Days Left</option>
              <option value="custom">Custom...</option>
            </select>

            {newThresholdMode === 'custom' && (
              <input 
                type="number" 
                min="0.1" 
                step="0.1" 
                value={customThreshold} 
                onChange={e => setCustomThreshold(e.target.value)} 
                placeholder="Days" 
                className="w-20 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-sm outline-none transition-colors focus:border-emerald-500 text-center" 
              />
            )}

            <button onClick={handleAddThreshold} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/20">
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-rose-950/20 border border-rose-900/30 rounded-3xl p-5">
        <h3 className="text-rose-500 font-bold mb-2">Danger Zone</h3>
        <p className="text-slate-400 text-xs mb-4">Resetting your data will permanently delete all fuel logs and extra trips. Commute settings remain.</p>
        <button onClick={() => setShowConfirm(true)} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold py-3 rounded-xl transition-colors">
          Reset All Data
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-xs shadow-2xl">
            <h3 className="text-xl font-black text-white mb-2">Are you sure?</h3>
            <p className="text-slate-400 text-sm mb-6">This will permanently delete all your logs. Your tracking will restart from 0 today.</p>
            <div className="flex space-x-3">
               <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold border border-slate-700 hover:bg-slate-700 transition-colors">Cancel</button>
               <button onClick={handleReset} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-colors">Yes, Reset</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}