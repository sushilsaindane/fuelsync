import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Droplet, Navigation, Calendar } from 'lucide-react'; // <-- Added Calendar icon

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-start shadow-lg">
    <Icon className={`w-6 h-6 mb-3 ${color}`} />
    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</span>
    <span className="text-white font-black text-lg">{value}</span>
  </div>
);

export default function DashboardTab({ stats }) {
  let gaugeValue = stats.daysLeft;
  const maxGauge = 14; 
  let gaugeColor = 'text-emerald-400';
  if (stats.daysLeft <= 5) gaugeColor = 'text-rose-500';
  else if (stats.daysLeft <= 8) gaugeColor = 'text-yellow-400';

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(gaugeValue, maxGauge) / maxGauge) * circumference;

  // --- NEW LOGIC: Calculate exact dd/mm/yyyy refill date ---
  const getRefillDate = (daysLeft) => {
    if (daysLeft <= 0) return "Refill Now";
    
    // Get exact future timestamp: Today + (Days Left converted to milliseconds)
    const exactRefillTime = new Date().getTime() + (daysLeft * 24 * 60 * 60 * 1000);
    const refillDate = new Date(exactRefillTime);
    
    // Format to dd/mm/yyyy
    const dd = String(refillDate.getDate()).padStart(2, '0');
    const mm = String(refillDate.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = refillDate.getFullYear();
    
    return `${dd}/${mm}/${yyyy}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <h2 className="text-slate-400 font-medium mb-4">Estimated Fuel Left</h2>
        
        <div className="relative flex items-center justify-center w-56 h-56">
          <svg className="transform -rotate-90 w-full h-full drop-shadow-2xl" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
            <motion.circle
              cx="70" cy="70" r={radius}
              stroke="currentColor" strokeWidth="8" fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={gaugeColor}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            {stats.totalLoggedRange === 0 ? (
              <span className="text-3xl font-black text-white">Empty</span>
            ) : (
              <>
                <span className={`text-5xl font-black ${stats.daysLeft <= 5 ? 'text-rose-500' : 'text-white'}`}>
                  {stats.daysLeft < 0 ? '0' : stats.daysLeft.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Days</span>
              </>
            )}
          </div>
        </div>

        {/* --- NEW UI: Date Pill under the remaining km --- */}
        <div className="mt-6 flex flex-col items-center">
          <p className="text-2xl font-bold text-white mb-2">
            {Math.max(0, stats.currentRange).toFixed(0)} <span className="text-sm text-slate-400 font-normal">km range remaining</span>
          </p>
          
          {stats.totalLoggedRange > 0 && stats.daysLeft > 0 && (
            <div className="flex items-center bg-slate-950/50 border border-slate-800 px-4 py-2 rounded-full mt-1">
              <Calendar className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">
                Expected Refill: <span className="text-white ml-1 tracking-normal">{getRefillDate(stats.daysLeft)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {stats.daysLeft <= 5 && stats.totalLoggedRange > 0 && (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-start">
          <AlertTriangle className="text-rose-500 w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-rose-500 font-bold mb-1">Fill Up Recommended</h4>
            <p className="text-rose-200/80 text-sm leading-relaxed">Based on your commute of {stats.dailyCommute}km/day, you'll run out of fuel soon.</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Added" value={`${stats.totalLoggedRange.toFixed(0)} km`} icon={Droplet} color="text-blue-400" />
        <StatCard title="Commuted" value={`${stats.totalCommuteRange.toFixed(0)} km`} icon={Navigation} color="text-purple-400" />
      </div>
    </div>
  );
}