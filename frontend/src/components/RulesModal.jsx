import React, { useState } from 'react';
import { X, Award, Shield, Zap, Target, BookOpen, Clock, Trophy } from 'lucide-react';

const RulesModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('batting');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#031d16] border border-amber-400/80 rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-emerald-950 font-black shadow-md">
              <Award className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                Custom ODI Fantasy Rules & Scoring System
              </h2>
              <p className="text-xs text-amber-300">
                2026 Pakistan ODI Tri-Nation Series • Custom tournament rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 pt-3 pb-2 overflow-x-auto">
          {[
            { id: 'batting', label: 'Batting (+/-)', icon: Zap },
            { id: 'bowling', label: 'Bowling (+/-)', icon: Target },
            { id: 'fielding', label: 'Fielding & XI', icon: Shield },
            { id: 'lockRules', label: 'Deadline & Series', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                  isActive
                    ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow font-black'
                    : 'bg-[#02241b] text-slate-300 border-emerald-800/80 hover:bg-emerald-900/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2 text-xs">
          
          {/* TAB 1: BATTING */}
          {activeTab === 'batting' && (
            <div className="space-y-3">
              <div className="bg-[#02241b] border border-emerald-800/60 rounded-xl p-3">
                <h4 className="font-extrabold text-amber-300 uppercase tracking-wide text-xs mb-2">
                  Standard Batting Points
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-200">
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Every Run Scored</span>
                    <strong className="text-amber-400">+1 pt</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Boundary Bonus (Four)</span>
                    <strong className="text-amber-400">+1 pt</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Six Bonus</span>
                    <strong className="text-amber-400">+2 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Half-Century (50–99 Runs)</span>
                    <strong className="text-amber-400">+4 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Century Bonus (100+ Runs)</span>
                    <strong className="text-amber-400">+8 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-red-950/40 rounded border border-red-900/60 text-red-200">
                    <span>Dismissal for a Duck (0 Runs)</span>
                    <strong className="text-red-400">-3 pts</strong>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  * Duck penalty applies only to Batters, Wicketkeepers, and All-Rounders.
                </p>
              </div>

              <div className="bg-[#02241b] border border-emerald-800/60 rounded-xl p-3">
                <h4 className="font-extrabold text-amber-300 uppercase tracking-wide text-xs mb-2">
                  ODI Strike Rate Bonus & Penalty (Min 20 Balls Faced)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-200">
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>SR &gt; 140.00</span>
                    <strong className="text-emerald-400">+6 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>SR 120.01 – 140.00</span>
                    <strong className="text-emerald-400">+4 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>SR 100.00 – 120.00</span>
                    <strong className="text-emerald-400">+2 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-amber-950/40 rounded border border-amber-900/60 text-amber-200">
                    <span>SR 40.00 – 50.00</span>
                    <strong className="text-amber-400">-2 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-red-950/40 rounded border border-red-900/60 text-red-200">
                    <span>SR 30.00 – 39.99</span>
                    <strong className="text-red-400">-4 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-red-950/40 rounded border border-red-900/60 text-red-200">
                    <span>SR &lt; 30.00</span>
                    <strong className="text-red-400">-6 pts</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOWLING */}
          {activeTab === 'bowling' && (
            <div className="space-y-3">
              <div className="bg-[#02241b] border border-emerald-800/60 rounded-xl p-3">
                <h4 className="font-extrabold text-amber-300 uppercase tracking-wide text-xs mb-2">
                  Standard Bowling Points
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-200">
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Every Wicket (excl. Run Out)</span>
                    <strong className="text-amber-400">+25 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>LBW / Bowled Bonus</span>
                    <strong className="text-amber-400">+8 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Maiden Over</span>
                    <strong className="text-amber-400">+4 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>4-Wicket Haul Bonus</span>
                    <strong className="text-amber-400">+4 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>5-Wicket Haul Bonus</span>
                    <strong className="text-amber-400">+8 pts</strong>
                  </div>
                </div>
              </div>

              <div className="bg-[#02241b] border border-emerald-800/60 rounded-xl p-3">
                <h4 className="font-extrabold text-amber-300 uppercase tracking-wide text-xs mb-2">
                  ODI Economy Rate Bonus & Penalty (Min 5 Overs Bowled)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-200">
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Econ &lt; 2.50 RPO</span>
                    <strong className="text-emerald-400">+6 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Econ 2.50 – 3.49 RPO</span>
                    <strong className="text-emerald-400">+4 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Econ 3.50 – 4.50 RPO</span>
                    <strong className="text-emerald-400">+2 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-amber-950/40 rounded border border-amber-900/60 text-amber-200">
                    <span>Econ 7.00 – 8.00 RPO</span>
                    <strong className="text-amber-400">-2 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-red-950/40 rounded border border-red-900/60 text-red-200">
                    <span>Econ 8.01 – 9.00 RPO</span>
                    <strong className="text-red-400">-4 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-red-950/40 rounded border border-red-900/60 text-red-200">
                    <span>Econ &gt; 9.00 RPO</span>
                    <strong className="text-red-400">-6 pts</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FIELDING & MULTIPLIERS */}
          {activeTab === 'fielding' && (
            <div className="space-y-3">
              <div className="bg-[#02241b] border border-emerald-800/60 rounded-xl p-3">
                <h4 className="font-extrabold text-amber-300 uppercase tracking-wide text-xs mb-2">
                  Fielding Points
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-200">
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Catch</span>
                    <strong className="text-amber-400">+8 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>3+ Catches Bonus</span>
                    <strong className="text-amber-400">+4 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Stumping / Direct Run Out</span>
                    <strong className="text-amber-400">+12 pts</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-950/60 rounded border border-emerald-900">
                    <span>Indirect Run Out</span>
                    <strong className="text-amber-400">+6 pts</strong>
                  </div>
                </div>
              </div>

              <div className="bg-[#02241b] border border-emerald-800/60 rounded-xl p-3">
                <h4 className="font-extrabold text-amber-300 uppercase tracking-wide text-xs mb-2">
                  Playing XI & Role Multipliers
                </h4>
                <div className="space-y-2 text-slate-200">
                  <div className="flex justify-between p-2 bg-emerald-950/60 rounded border border-emerald-900">
                    <div>
                      <strong className="text-white">Playing XI Appearance</strong>
                      <p className="text-[10px] text-slate-400">Awarded to all starting XI players announced at toss</p>
                    </div>
                    <strong className="text-amber-400">+4 pts</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-amber-950/40 rounded border border-amber-500/50">
                    <div>
                      <strong className="text-amber-300">Captain (C) Multiplier</strong>
                      <p className="text-[10px] text-amber-200/70">Doubles all base batting, bowling, and fielding points</p>
                    </div>
                    <strong className="text-amber-400 text-sm">2.0x POINTS</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-indigo-950/40 rounded border border-indigo-500/50">
                    <div>
                      <strong className="text-indigo-300">Vice-Captain (VC) Multiplier</strong>
                      <p className="text-[10px] text-indigo-200/70">1.5x on all base batting, bowling, and fielding points</p>
                    </div>
                    <strong className="text-indigo-400 text-sm">1.5x POINTS</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 1ST BALL LOCK & SERIES CHAMPION */}
          {activeTab === 'lockRules' && (
            <div className="space-y-3">
              <div className="bg-[#02241b] border border-emerald-800/60 rounded-xl p-3 space-y-2 text-slate-200">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold uppercase">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Lineup Deadline Rule
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Fantasy squads strictly lock at the <strong className="text-amber-300">scheduled start time or an earlier admin lock</strong> .
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Only teams submitted or modified <strong className="text-white">before the deadline</strong> count for match points.</li>
                  <li>After the deadline, lineups cannot be modified or submitted for that match.</li>
                  <li>The administrator enters real scorecard statistics; saved statistics recalculate points.</li>
                  <li>Once the match concludes, the <strong className="text-white">Daily Winner is crowned</strong>, and the next fixture unlocks automatically with a clean squad builder for the next 2 teams!</li>
                </ul>
              </div>

              <div className="bg-[#02241b] border border-amber-500/40 rounded-xl p-3 space-y-2 text-slate-200">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold uppercase">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Tri-Series Championship: Cumulative Total Points
                </div>
                <p className="text-slate-300 leading-relaxed">
                  In addition to Daily Match winners, all points gained across the <strong className="text-white">6 tournament matches</strong> accumulate on the <strong className="text-amber-300">Overall Series Leaderboard</strong>.
                </p>
                <p className="text-slate-300">
                  At the final (Match 6), the manager with the <strong className="text-amber-300">highest total cumulative points</strong> across the entire Tri-Nation Series is crowned the <strong className="text-white">Gold Tri-Series Champion</strong>!
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-emerald-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Source: This tournament’s published custom scoring rules
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs uppercase tracking-wider transition-colors shadow"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};

export default RulesModal;
