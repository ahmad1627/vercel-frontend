import React from 'react';
import { Calendar, MapPin, Lock, CheckCircle2, PlayCircle, Clock } from 'lucide-react';

const FixtureCarousel = ({ matches = [], selectedMatch, onSelectMatch }) => {
  const teamInfo = { IND: { flag: '🇮🇳', name: 'India' }, NZ: { flag: '🇳🇿', name: 'New Zealand' } };
  const ordinal = (n) => { const mod100 = n % 100; if (mod100 >= 11 && mod100 <= 13) return `${n}th`; return `${n}${({1:'st',2:'nd',3:'rd'}[n % 10] || 'th')}`; };
  const dateLabel = (value) => new Date(value).toLocaleString('en-NZ', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Pacific/Auckland'
  });
  return (
    <section className="w-full bg-[#022018]/90 border border-emerald-900/60 rounded-2xl p-4 sm:p-5 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-400"/><h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">India vs New Zealand — ODI Fixtures</h2></div>
        <span className="text-xs text-emerald-300">Five separate daily fantasy entries • 3:00 PM New Zealand time</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {matches.map((match) => {
          const selected = selectedMatch?.id === match.id;
          const completed = match.status === 'COMPLETED';
          const locked = match.is_locked || match.status === 'LIVE';
          const a = teamInfo[match.team_a] || { flag: '🏏', name: match.team_a };
          const b = teamInfo[match.team_b] || { flag: '🏏', name: match.team_b };
          return <button type="button" key={match.id} onClick={() => onSelectMatch(match)} className={`text-left rounded-xl p-3.5 border transition-all ${selected ? 'bg-emerald-800/90 border-amber-400 ring-1 ring-amber-400' : completed ? 'bg-slate-900/70 border-slate-700' : locked ? 'bg-amber-950/40 border-amber-600/70' : 'bg-emerald-950/50 border-emerald-800 hover:border-emerald-500'}`}>
            <div className="flex justify-between items-center gap-2 mb-2"><span className="text-[11px] font-black text-amber-300">{ordinal(match.match_number)} ODI</span><span className="text-[10px] font-bold">{completed ? <span className="text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>Final</span> : locked ? <span className="text-amber-300 flex items-center gap-1"><Lock className="w-3 h-3"/>Locked</span> : <span className="text-emerald-300 flex items-center gap-1"><PlayCircle className="w-3 h-3"/>Selection open</span>}</span></div>
            <div className="flex items-center justify-between py-2"><div className="text-center flex-1"><div className="text-xl">{a.flag}</div><div className="text-xs font-bold">{match.team_a}</div></div><span className="text-[10px] text-amber-300 font-black px-2">VS</span><div className="text-center flex-1"><div className="text-xl">{b.flag}</div><div className="text-xs font-bold">{match.team_b}</div></div></div>
            <div className="border-t border-emerald-900 pt-2 mt-1 space-y-1"><div className="flex items-center gap-1.5 text-[10px] text-amber-100"><Clock className="w-3 h-3"/>{dateLabel(match.match_date)}</div><div className="flex items-center gap-1.5 text-[10px] text-slate-400"><MapPin className="w-3 h-3"/>{match.venue}</div></div>
            {match.winner_team && <div className="mt-2 text-[10px] text-emerald-300 font-bold">Winner: {match.winner_team}</div>}
          </button>;
        })}
      </div>
    </section>
  );
};
export default FixtureCarousel;
