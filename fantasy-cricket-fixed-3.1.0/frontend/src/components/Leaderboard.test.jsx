// @vitest-environment jsdom
import React from 'react';
import {render,screen,waitFor,fireEvent,cleanup} from '@testing-library/react';
import {vi,it,expect,beforeEach,afterEach} from 'vitest';
import Leaderboard from './Leaderboard';
import api from '../api';
vi.mock('../api',()=>({default:{get:vi.fn(),delete:vi.fn()}}));
vi.mock('../context/AuthContext',()=>({useAuth:()=>({user:{id:100,full_name:'Owner'}})}));
const row={team_id:7,user_id:100,fantasy_team_name:'Saved XI',full_name:'Owner',total_points:0,rank:1,matches_played:1,match_scores:{4:0}};
const response=rows=>({data:{leaderboard:rows,completed_matches:3,is_series_concluded:false}});
beforeEach(()=>{vi.resetAllMocks();localStorage.clear();});
afterEach(cleanup);
it('does not show browser-only drafts or obsolete cached rankings',async()=>{
 localStorage.setItem('cached_leaderboard_overall',JSON.stringify([row]));
 localStorage.setItem('fantasy_squad_m4_u100',JSON.stringify({player_ids:Array.from({length:11},(_,i)=>i+1)}));
 api.get.mockResolvedValue(response([]));render(<Leaderboard matches={[]} activeMatchId={4}/>);
 await screen.findByText('No fantasy squads enrolled yet.');expect(screen.queryByText('Saved XI')).toBeNull();
});
it('removes stale entries when the authoritative server snapshot is empty',async()=>{
 api.get.mockResolvedValueOnce(response([row])).mockResolvedValue(response([]));
 render(<Leaderboard matches={[]} activeMatchId={4}/>);await screen.findByText('Saved XI');
 fireEvent(window,new Event('fantasy-team-saved'));
 await waitFor(()=>expect(screen.queryByText('Saved XI')).toBeNull());
});
it('shows a refresh failure rather than claiming the leaderboard is current',async()=>{
 api.get.mockRejectedValue(Error('offline'));render(<Leaderboard matches={[]} activeMatchId={4}/>);
 expect((await screen.findByRole('alert')).textContent).toContain('could not refresh');
});
it('ignores a late response after switching between views',async()=>{
 let resolve;api.get.mockImplementation(url=>url==='/leaderboard/overall'?new Promise(r=>{resolve=r;}):Promise.resolve({data:{leaderboard:[],match:{id:4}}}));
 render(<Leaderboard matches={[]} activeMatchId={4}/>);
 fireEvent.click(screen.getByRole('button',{name:'Match-by-Match'}));
 await screen.findByText('No fantasy squads submitted for this fixture yet.');
 resolve(response([row]));await Promise.resolve();expect(screen.queryByText('Saved XI')).toBeNull();
});
