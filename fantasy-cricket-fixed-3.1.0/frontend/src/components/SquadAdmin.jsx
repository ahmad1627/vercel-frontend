import React, { useState } from 'react';
import api from '../api';

const MATCHES = [1, 2, 3, 4, 5];
const ROLES = ['WK', 'BAT', 'AR', 'BOWL'];
const STATUSES = ['AVAILABLE', 'MONITORING', 'OUT'];

export default function SquadAdmin() {
  const [players, setPlayers] = useState([]);
  const [editable, setEditable] = useState(false);
  const [availabilityEditable, setAvailabilityEditable] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const response = await api.get('/admin/players');
      setPlayers(response.data.players || []);
      setEditable(Boolean(response.data.editable));
      setAvailabilityEditable(response.data.availability_editable !== false);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Could not load ODI squads.');
    } finally {
      setBusy(false);
    }
  }

  function change(index, key, value) {
    setPlayers(current => current.map((player, i) => i === index ? { ...player, [key]: value } : player));
  }

  function toggleMatch(index, matchNumber, checked) {
    const current = players[index]?.match_eligibility || [];
    const next = checked
      ? [...new Set([...current, matchNumber])].sort((a, b) => a - b)
      : current.filter(number => number !== matchNumber);
    change(index, 'match_eligibility', next);
  }

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      const response = await api.post('/admin/players', { players });
      setMessage(response.data.message || 'ODI squads saved.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Could not save ODI squads.');
      setBusy(false);
    }
  }

  return (
    <details onToggle={event => { if (event.currentTarget.open && !players.length) load(); }} className="border-t border-emerald-700 pt-3">
      <summary className="cursor-pointer font-bold">Manage India / New Zealand ODI squads</summary>
      <p className="my-2 text-sm text-slate-300">
        Set each player’s role, match eligibility, availability and external provider ID. Playing XIs are confirmed separately after official team announcements.
      </p>
      {message && <p role="status" className="my-2 text-sm text-amber-200">{message}</p>}
      {busy && !players.length && <p className="text-xs text-slate-400">Loading squads…</p>}
      <div className="max-h-[34rem] overflow-y-auto space-y-3 pr-1">
        {players.map((player, index) => (
          <div key={player.id} className="rounded-xl border border-emerald-800 bg-slate-950/60 p-3 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-400">ID {player.id}</span>
              <input aria-label={`${player.name} name`} className="min-w-40 flex-1 bg-slate-900 rounded p-2 text-sm" value={player.name} disabled={!editable || busy} onChange={event => change(index, 'name', event.target.value)} />
              <select aria-label={`${player.name} team`} className="bg-slate-900 rounded p-2 text-sm" value={player.team} disabled={!editable || busy} onChange={event => change(index, 'team', event.target.value)}>
                <option value="IND">IND</option><option value="NZ">NZ</option>
              </select>
              <select aria-label={`${player.name} role`} className="bg-slate-900 rounded p-2 text-sm" value={player.role} disabled={!editable || busy} onChange={event => change(index, 'role', event.target.value)}>
                {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              <select aria-label={`${player.name} availability`} className="bg-slate-900 rounded p-2 text-sm" value={player.availability_status || 'AVAILABLE'} disabled={!availabilityEditable || busy} onChange={event => change(index, 'availability_status', event.target.value)}>
                {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <span className="font-semibold">Eligible:</span>
              {MATCHES.map(match => (
                <label key={match} className="flex items-center gap-1">
                  <input type="checkbox" checked={(player.match_eligibility || []).includes(match)} disabled={!editable || busy} onChange={event => toggleMatch(index, match, event.target.checked)} />
                  ODI {match}
                </label>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <input aria-label={`${player.name} external provider ID`} className="bg-slate-900 rounded p-2 text-xs" placeholder="External cricket provider player ID" value={player.external_player_id ?? ''} disabled={busy} onChange={event => change(index, 'external_player_id', event.target.value)} />
              <input aria-label={`${player.name} availability note`} className="bg-slate-900 rounded p-2 text-xs" placeholder="Availability / injury note" value={player.availability_note || ''} disabled={!availabilityEditable || busy} onChange={event => change(index, 'availability_note', event.target.value)} />
            </div>
            {player.verified_source && <a className="text-[11px] text-cyan-300 underline" href={player.verified_source} target="_blank" rel="noreferrer">Squad source</a>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {editable && <button className="border rounded p-2 text-sm" disabled={busy} onClick={() => setPlayers(current => [...current, { id: Math.max(0, ...current.map(player => Number(player.id) || 0)) + 1, name: '', team: 'IND', role: 'BAT', match_eligibility: [1, 2, 3, 4, 5], availability_status: 'AVAILABLE', external_player_id: null }])}>Add player</button>}
        <button className="bg-amber-400 text-emerald-950 rounded p-2 text-sm font-bold" disabled={busy || (!editable && !availabilityEditable)} onClick={save}>Save squad / availability changes</button>
      </div>
      {!editable && <p className="mt-2 text-xs text-slate-400">Roster membership, names, roles and match eligibility are locked after entries or score records exist. Availability updates remain available to administrators.</p>}
    </details>
  );
}
