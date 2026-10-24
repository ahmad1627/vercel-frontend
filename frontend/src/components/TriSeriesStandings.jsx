import React, { useState, useEffect } from 'react';
import { Shield, Trophy, ArrowRight, Award, CheckCircle2, Calendar, MapPin } from 'lucide-react';
import api from '../api';

const TriSeriesStandings = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const res = await api.get('/standings');
        setStandings(res.data);
      } catch (err) {
        console.error('Failed to load standings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
    const timer = setInterval(fetchStandings, 15000);
    return () => clearInterval(timer);
  }, []);

  const getTeamInfo = (code) => {
    switch (code) {
      case 'PAK':
        return { name: 'Pakistan', flag: '🇵🇰', color: 'text-emerald-400' };
      case 'ENG':
        return { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: 'text-blue-400' };
      case 'SL':
        return { name: 'Sri Lanka', flag: '🇱🇰', color: 'text-amber-400' };
      default:
        return { name: code, flag: '🏏', color: 'text-white' };
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-[#031a14] border border-emerald-900/80 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              2026 Pakistan ODI Tri-Series Official Standings Table
            </h2>
          </div>
          <p className="text-xs text-emerald-300/80 mt-1">
            Live points table after Rawalpindi Leg (as of Oct 22, 2026). Top 2 teams qualify for The Final at Gaddafi Stadium, Lahore!
          </p>
        </div>
        <span className="text-xs font-bold bg-amber-400 text-emerald-950 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Official ODI
        </span>
      </div>

      {/* Standings Table Card */}
      <div className="bg-[#031a14] border border-emerald-900/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-950/60 border-b border-emerald-900/80 text-[11px] font-black uppercase tracking-wider text-slate-300">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4 text-center">Played</th>
                <th className="py-3 px-4 text-center">Won</th>
                <th className="py-3 px-4 text-center">Lost</th>
                <th className="py-3 px-4 text-center">Tie / NR</th>
                <th className="py-3 px-4 text-center">Points</th>
                <th className="py-3 px-4 text-center">NRR</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/40 text-sm">
              {standings.map((s, idx) => {
                const info = getTeamInfo(s.team);
                const isFinalist = idx < 2;

                return (
                  <tr
                    key={s.team}
                    className={`transition-colors hover:bg-emerald-900/30 ${
                      isFinalist ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-black text-slate-300">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info.flag}</span>
                        <div>
                          <span className={`font-black ${info.color}`}>
                            {info.name}
                          </span>
                          <span className="text-xs text-slate-400 ml-1.5 font-bold">
                            ({s.team})
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-white">
                      {s.played}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                      {s.won}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-red-400">
                      {s.lost}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">{s.tied || 0} / {s.no_result || 0}</td>
                    <td className="py-3.5 px-4 text-center font-black text-base text-amber-400">
                      {s.points}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                      {s.nrr > 0 ? `+${s.nrr.toFixed(3)}` : s.nrr.toFixed(3)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isFinalist ? (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                          Top 2 (Final Spot)
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500">
                          Contender
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RAWALPINDI LEG MATCH RESULTS SUMMARY */}
      <div className="bg-[#031c15] border border-emerald-800/80 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Rawalpindi Leg Results (Completed Oct 18 - 22, 2026)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#02241b] border border-emerald-800 rounded-xl p-3">
            <div className="flex justify-between font-bold text-amber-300 mb-1">
              <span>Match 1 • Sun 18 Oct</span>
              <span className="text-emerald-400">PAK WON</span>
            </div>
            <p className="text-white font-medium">Pakistan 305 all out (49.5 ov)</p>
            <p className="text-slate-300">Sri Lanka 268 all out (48.1 ov)</p>
            <p className="text-[11px] text-emerald-300/80 mt-1">Pakistan won by 37 runs</p>
          </div>

          <div className="bg-[#02241b] border border-emerald-800 rounded-xl p-3">
            <div className="flex justify-between font-bold text-amber-300 mb-1">
              <span>Match 2 • Tue 20 Oct</span>
              <span className="text-emerald-400">PAK WON</span>
            </div>
            <p className="text-white font-medium">Pakistan 302/9 (50.0 ov)</p>
            <p className="text-slate-300">England 215 all out (38.4 ov)</p>
            <p className="text-[11px] text-emerald-300/80 mt-1">Pakistan won by 87 runs</p>
          </div>

          <div className="bg-[#02241b] border border-emerald-800 rounded-xl p-3">
            <div className="flex justify-between font-bold text-amber-300 mb-1">
              <span>Match 3 • Thu 22 Oct</span>
              <span className="text-amber-400">SL WON</span>
            </div>
            <p className="text-white font-medium">England 429/4 (50.0 ov)</p>
            <p className="text-slate-300">Sri Lanka 430/8 (49.5 ov)</p>
            <p className="text-[11px] text-emerald-300/80 mt-1">SL won by 2 wickets (Record Chase)</p>
          </div>
        </div>
      </div>

      {/* UPCOMING LAHORE LEG & THE GRAND FINAL */}
      <div className="bg-linear-to-r from-emerald-950 via-[#02241b] to-emerald-950 border-2 border-amber-400/60 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> LAHORE LEG • GADDAFI STADIUM
          </span>
          <h3 className="text-base font-extrabold text-white mt-1">
            Matches 4 to 7: Pakistan • England • Sri Lanka
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Fantasy League officially begins with <strong>Match 4: Pakistan vs England on Sunday, October 25, 2026</strong>. Top 2 teams will clash in <strong>The Final on Saturday, October 31, 2026</strong>!
          </p>
        </div>
      </div>

    </div>
  );
};

export default TriSeriesStandings;
