import React from 'react';
import { X, Shield, Check, Award } from 'lucide-react';

const CaptainModal = ({ isOpen, onClose, selectedPlayers, captainId, viceCaptainId, boosterId, onSelectCaptain, onSelectViceCaptain, onSelectBooster, onConfirmSave, isSubmitting }) => {
  if (!isOpen) return null;
  const valid = captainId && viceCaptainId && boosterId && new Set([captainId, viceCaptainId, boosterId]).size === 3;
  const options = [
    { key: 'C', label: 'Captain 2X', selected: captainId, action: onSelectCaptain, style: 'amber' },
    { key: 'VC', label: 'Vice 1.5X', selected: viceCaptainId, action: onSelectViceCaptain, style: 'indigo' },
    { key: '3X', label: 'Booster 3X', selected: boosterId, action: onSelectBooster, style: 'fuchsia' }
  ];
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div className="bg-[#031c15] border border-emerald-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
      <header className="p-4 border-b border-emerald-900 flex items-center justify-between"><div><h2 className="text-lg font-black text-white flex items-center gap-2"><Award className="w-5 h-5 text-amber-400"/>Captain, Vice-Captain & 3X Booster</h2><p className="text-xs text-emerald-300 mt-1">Choose three different players from your XI.</p></div><button onClick={onClose} aria-label="Close"><X className="w-5 h-5"/></button></header>
      <div className="p-4 overflow-y-auto flex-1 space-y-2">{selectedPlayers.map(player => <div key={player.id} className="p-3 rounded-xl border border-emerald-900 bg-[#02241b] flex flex-wrap items-center justify-between gap-3"><div><strong className="text-sm text-white">{player.name}</strong><div className="text-[11px] text-slate-400">{player.team} • {player.role}</div></div><div className="flex flex-wrap gap-1.5">{options.map(opt => <button key={opt.key} type="button" onClick={() => opt.action(player.id)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border ${opt.selected === player.id ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-emerald-950 text-slate-200 border-emerald-700 hover:border-amber-400'}`}>{opt.selected === player.id ? '✓ ' : ''}{opt.key}</button>)}</div></div>)}</div>
      <footer className="p-4 border-t border-emerald-900 flex items-center justify-between gap-3"><p className={`text-xs font-bold ${valid ? 'text-emerald-300' : 'text-amber-300'}`}>{valid ? <><Check className="inline w-4 h-4 mr-1"/>Three unique selections ready.</> : 'Select one Captain, one Vice-Captain and one 3X Booster.'}</p><button type="button" onClick={onConfirmSave} disabled={!valid || isSubmitting} className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase bg-amber-400 text-emerald-950 disabled:opacity-40">{isSubmitting ? 'Saving…' : 'Save lineup'}</button></footer>
    </div>
  </div>;
};
export default CaptainModal;
