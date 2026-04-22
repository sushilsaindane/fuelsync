import React, { useState } from 'react';
import { Fuel, MapPin, Trash2, Edit2, Check, X, History } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, appId, BANGALORE_PRICE } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddFuelTab({ user, fuelLogs, updateFuelLog, deleteFuelLog, showToast }) {
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(BANGALORE_PRICE);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for editing
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !price || !date) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'fuelLogs'), {
        amount: Number(amount),
        price: Number(price),
        date: date,
        timestamp: new Date().getTime()
      });
      showToast('Fuel log added successfully!');
      setAmount('');
    } catch (err) {
      showToast('Error saving log', 'error');
    }
    setIsSubmitting(false);
  };

  const startEditing = (log) => {
    setEditingId(log.id);
    setEditAmount(log.amount);
    setEditPrice(log.price);
  };

  const handleUpdate = async (id) => {
    await updateFuelLog(id, {
      amount: Number(editAmount),
      price: Number(editPrice)
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* ADD FUEL FORM */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 text-slate-800 opacity-20"><Fuel size={120} /></div>
        <h2 className="text-xl font-bold text-white mb-6 relative z-10">Log New Fill</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Amount Paid (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-8 pr-4 text-white font-bold focus:border-emerald-500 outline-none transition-all" />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Price (₹/L)</label>
              <input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold focus:border-emerald-500 outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Date</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold focus:border-emerald-500 outline-none" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]">
            {isSubmitting ? 'Saving...' : 'Save Fuel Log'}
          </button>
        </form>
      </div>

      {/* FUEL LOGS HISTORY */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-bold text-white flex items-center">
            <History className="w-5 h-5 mr-2 text-emerald-400" /> Fuel History
          </h3>
          <span className="text-xs text-slate-500 font-bold uppercase">{fuelLogs.length} Logs</span>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
          {fuelLogs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-3xl text-slate-500 text-sm">
              No fuel logs yet. Fill 'er up!
            </div>
          ) : (
            fuelLogs.map((log) => (
              <motion.div layout key={log.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
                {editingId === log.id ? (
                  /* EDITING MODE */
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm" placeholder="Amt" />
                      <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm" placeholder="Price" />
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleUpdate(log.id)} className="flex-1 bg-emerald-500 text-slate-950 py-2 rounded-lg font-bold text-xs flex items-center justify-center"><Check size={14} className="mr-1"/> Save</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center"><X size={14} className="mr-1"/> Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-black text-lg">₹{log.amount}</p>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold">
                          {(log.amount / (log.price || BANGALORE_PRICE)).toFixed(2)} L
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">
                        {new Date(log.date).toLocaleDateString('en-GB')} • ₹{log.price}/L
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => startEditing(log)} className="p-2 text-slate-500 hover:text-emerald-400 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => deleteFuelLog(log.id)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}