import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Droplet, Map as MapIcon, Settings, AlertTriangle, Fuel, Activity, CheckCircle } from 'lucide-react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { LocalNotifications } from '@capacitor/local-notifications';

// Firebase & Config Imports
import { auth, db, appId, BANGALORE_PRICE } from './firebase'; 

// Component Imports
import DashboardTab from './components/DashboardTab';
import AddFuelTab from './components/AddFuelTab';
import RoutesTab from './components/RoutesTab';
import SettingsTab from './components/SettingsTab';

const NavButton = ({ icon: Icon, label, isActive, onClick, highlight }) => {
  if (highlight) {
    return (
      <button onClick={onClick} className="relative -mt-6 group outline-none">
        <div className={`absolute inset-0 bg-emerald-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full ${isActive ? 'opacity-80' : ''}`}></div>
        <div className={`relative bg-gradient-to-tr from-emerald-500 to-cyan-400 p-4 rounded-full text-slate-950 shadow-xl border-4 border-slate-900 transform transition-transform ${isActive ? 'scale-110' : 'scale-100 hover:scale-105'}`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </button>
    );
  }

  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 h-12 transition-colors outline-none ${isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
      <span className="text-[10px] font-bold tracking-wide">{label}</span>
      {isActive && <motion.div layoutId="nav-indicator" className="absolute bottom-0 w-8 h-1 bg-emerald-400 rounded-t-full" />}
    </button>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  
  const [config, setConfig] = useState(null);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [extraTrips, setExtraTrips] = useState([]);

  const notifiedThresholds = useRef(new Set());

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- AUTH ---
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } 
      catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (usr) => setUser(usr));
    return () => unsubscribe();
  }, []);

  // --- DATA SYNC ---
  useEffect(() => {
    if (!user) return;

    const unsubConfig = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'config', 'main'), (docSnap) => {
        if (docSnap.exists()) {
          setConfig(docSnap.data());
        } else {
          const defaultCfg = { bikeMake: 'Yamaha', bikeModel: 'R15 2012', mileage: 42.5, commuteOrigin: 'Home', commuteDestination: 'Office', commuteDistance: 13.6, isRoundTrip: true, commuteDaysPerWeek: 6, baseDate: new Date().toISOString().split('T')[0], notificationThresholds: [2], notificationsEnabled: true };
          setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'config', 'main'), defaultCfg);
          setConfig(defaultCfg);
        }
        setLoading(false);
      }, (error) => { console.error(error); setLoading(false); }
    );

    const unsubFuel = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'fuelLogs'), (snapshot) => {
        const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        setFuelLogs(logs);
      }, (error) => console.error(error)
    );

    const unsubTrips = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'extraTrips'), (snapshot) => {
        const trips = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        trips.sort((a, b) => new Date(b.date) - new Date(a.date));
        setExtraTrips(trips);
      }, (error) => console.error(error)
    );

    return () => { unsubConfig(); unsubFuel(); unsubTrips(); };
  }, [user]);

  // --- SAFER CORE CALCULATIONS ---
  const stats = useMemo(() => {
    if (!config || !fuelLogs) return { currentRange: 0, daysLeft: 0, totalLoggedRange: 0, totalCommuteRange: 0, totalExtraRange: 0, dailyCommute: 0 };

    const { mileage, commuteDistance, isRoundTrip, commuteDaysPerWeek, baseDate } = config;
    let totalFuelLiters = 0;
    let earliestDate = new Date(baseDate || new Date()).getTime();

    fuelLogs.forEach(log => {
      const amount = Number(log.amount) || 0;
      const price = Number(log.price) || BANGALORE_PRICE;
      if (amount > 0) totalFuelLiters += amount / price;
      const logDate = new Date(log.date).getTime();
      if (logDate && logDate < earliestDate) earliestDate = logDate;
    });

    const totalLoggedRange = totalFuelLiters * (Number(mileage) || 0);
    let totalExtraRange = 0;
    extraTrips.forEach(trip => {
      totalExtraRange += (Number(trip.distance) || 0);
      const tripDate = new Date(trip.date).getTime();
      if (tripDate && tripDate < earliestDate) earliestDate = tripDate;
    });

    const start = new Date(earliestDate);
    start.setHours(0,0,0,0);
    const end = new Date();
    end.setHours(0,0,0,0);

    let commuteDays = 0;
    if (start <= end) {
      let current = new Date(start);
      while (current <= end) {
        const day = current.getDay();
        if (commuteDaysPerWeek === 6 && day !== 0) commuteDays++;
        else if (commuteDaysPerWeek === 5 && day !== 0 && day !== 6) commuteDays++;
        else if (commuteDaysPerWeek === 7) commuteDays++;
        else if (commuteDaysPerWeek < 5) commuteDays++; 
        current.setDate(current.getDate() + 1);
      }
    }

    const dailyCommute = isRoundTrip ? (Number(commuteDistance) * 2) : Number(commuteDistance);
    const totalCommuteRange = commuteDays * (dailyCommute || 0);
    const currentRange = totalLoggedRange - totalExtraRange - totalCommuteRange;
    const avgDailyUsage = (dailyCommute || 0) * ((Number(commuteDaysPerWeek) || 7) / 7);
    const daysLeft = (avgDailyUsage > 0 && currentRange > 0) ? (currentRange / avgDailyUsage) : 0;

    return { 
      currentRange: isNaN(currentRange) ? 0 : currentRange, 
      daysLeft: isNaN(daysLeft) ? 0 : daysLeft, 
      totalLoggedRange: isNaN(totalLoggedRange) ? 0 : totalLoggedRange, 
      totalCommuteRange: isNaN(totalCommuteRange) ? 0 : totalCommuteRange, 
      totalExtraRange: isNaN(totalExtraRange) ? 0 : totalExtraRange, 
      dailyCommute: isNaN(dailyCommute) ? 0 : dailyCommute 
    };
  }, [config, fuelLogs, extraTrips]);

  // --- NATIVE NOTIFICATION LOGIC ---
  useEffect(() => {
    if (!config?.notificationThresholds || !config?.notificationsEnabled) return;

    const maxThreshold = config.notificationThresholds.length > 0 ? Math.max(...config.notificationThresholds) : 0;
    if (stats.daysLeft > maxThreshold) notifiedThresholds.current.clear();

    if (stats.daysLeft <= 0) return;

    config.notificationThresholds.forEach(threshold => {
      if (stats.daysLeft <= threshold && !notifiedThresholds.current.has(threshold)) {
        LocalNotifications.schedule({
          notifications: [{
            title: "FuelSync Alert",
            body: `Only ${stats.daysLeft.toFixed(1)} days of fuel left!`,
            id: Math.floor(Math.random() * 10000),
            schedule: { at: new Date(Date.now() + 500) }
          }]
        });
        notifiedThresholds.current.add(threshold);
      }
    });
  }, [stats.daysLeft, config]);

  // --- HANDLERS ---
  const requestNotificationPermission = async () => {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display === 'granted') showToast("Notifications enabled!");
  };

  const saveConfig = async (newConfig) => {
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'config', 'main'), newConfig);
    showToast('Settings saved');
  };

  const updateFuelLog = async (logId, updatedData) => {
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'fuelLogs', logId), updatedData, { merge: true });
    showToast('Log updated');
  };

  const deleteFuelLog = async (logId) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'fuelLogs', logId));
    showToast('Log deleted');
  };

  if (loading || !user || !config) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-400">
        <Activity className="w-12 h-12 animate-pulse mb-4" />
        <p className="font-semibold tracking-wider">Syncing Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-slate-950 min-h-screen text-slate-200 relative shadow-2xl shadow-black/50 overflow-hidden font-sans">
      
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent flex items-center">
            <Fuel className="w-5 h-5 mr-2 text-emerald-400" /> FuelSync
          </h1>
          <p className="text-xs text-slate-400 font-medium">{config.bikeMake} {config.bikeModel}</p>
        </div>
        {stats.daysLeft <= 5 && stats.daysLeft > 0 && (
          <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="bg-rose-500/20 px-3 py-1.5 rounded-full flex items-center">
            <AlertTriangle className="w-4 h-4 text-rose-500 mr-1.5" />
            <span className="text-xs font-bold text-rose-500">LOW FUEL</span>
          </motion.div>
        )}
      </div>

      <div className="p-4 pb-28 h-[calc(100vh-70px)] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {activeTab === 'dashboard' && <DashboardTab stats={stats} fuelLogs={fuelLogs} />}
            {activeTab === 'fuel' && <AddFuelTab user={user} fuelLogs={fuelLogs} updateFuelLog={updateFuelLog} deleteFuelLog={deleteFuelLog} showToast={showToast} />}
            {activeTab === 'routes' && <RoutesTab config={config} saveConfig={saveConfig} extraTrips={extraTrips} user={user} showToast={showToast} />}
            {activeTab === 'settings' && <SettingsTab config={config} saveConfig={saveConfig} user={user} fuelLogs={fuelLogs} extraTrips={extraTrips} showToast={showToast} requestNotificationPermission={requestNotificationPermission} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 p-3 pb-safe z-50">
        <div className="flex justify-around items-center">
          <NavButton icon={Home} label="Home" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={Droplet} label="Fuel" isActive={activeTab === 'fuel'} onClick={() => setActiveTab('fuel')} highlight />
          <NavButton icon={MapIcon} label="Trips" isActive={activeTab === 'routes'} onClick={() => setActiveTab('routes')} />
          <NavButton icon={Settings} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: -100, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-lg shadow-black/50 text-sm font-bold flex items-center ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}