// @vitest-environment jsdom
import React from 'react';
import {render,screen,waitFor,fireEvent,cleanup} from '@testing-library/react';
import {vi,it,expect,beforeEach,afterEach} from 'vitest';
import App from './App';
import api from './api';
const auth=vi.hoisted(()=>({user:{id:100,full_name:'Owner',fantasy_team_name:'My XI'}}));
vi.mock('./context/AuthContext',()=>({useAuth:()=>auth}));
vi.mock('./api',()=>({default:{get:vi.fn(),post:vi.fn()}}));
vi.mock('./components/PitchPreview',()=>({default:p=><div><output data-testid="picks">{p.selectedPlayers.map(x=>x.id).join(',')}</output><button disabled={p.isSubmitting} onClick={p.onSaveTeam}>Test save</button></div>}));
const match={id:4,match_number:4,venue:'Gaddafi Stadium, Lahore',title:'Match 4',team_a:'PAK',team_b:'ENG',status:'ACTIVE',is_active:true,match_date:'2099-01-01T00:00:00Z'};
const players=Array.from({length:11},(_,i)=>({id:i+1,name:`Player ${i+1}`,team:i<6?'PAK':'ENG',role:i===0?'WK':i<5?'BAT':i<7?'AR':'BOWL'}));
const draft={match_id:4,player_ids:players.map(p=>p.id),captain_id:1,vice_captain_id:2};
let saved,offline;
const setupApi=()=>api.get.mockImplementation(async url=>{
 if(url==='/matches')return {data:[match]};if(url==='/matches/active')return {data:match};
 if(url.includes('/players'))return {data:{all_players:players,categorized_players:Object.fromEntries(['WK','BAT','AR','BOWL'].map(role=>[role,players.filter(p=>p.role===role)]))}};
 if(url.includes('/teams/my-team')){if(offline)throw Error('offline');return {data:{has_team:!!saved,team:saved}};}
 throw Error(url);
});
beforeEach(()=>{vi.resetAllMocks();localStorage.clear();auth.user={id:100,full_name:'Owner',fantasy_team_name:'My XI'};saved=null;offline=false;setupApi();});
afterEach(cleanup);
it('keeps an account draft unsaved and never automatically posts it',async()=>{
 localStorage.setItem('fantasy_draft_v3_m4_u100',JSON.stringify(draft));render(<App/>);
 await waitFor(()=>expect(screen.getByTestId('picks').textContent).toBe(draft.player_ids.join(',')));
 expect(api.post).not.toHaveBeenCalled();expect(screen.queryByText(/is saved\. Points update/)).toBeNull();
});
it('does not carry another account draft across sign-in changes',async()=>{
 localStorage.setItem('fantasy_draft_v3_m4_u100',JSON.stringify(draft));const view=render(<App/>);
 await waitFor(()=>expect(screen.getByTestId('picks').textContent).not.toBe(''));
 auth.user={id:101,full_name:'Other'};view.rerender(<App/>);
 await waitFor(()=>expect(screen.getByTestId('picks').textContent).toBe(''));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Test save'}).disabled).toBe(false));
 expect(localStorage.getItem('fantasy_draft_v3_m4_u101') || '').not.toContain('1,2,3');
});
it('shows success only after reading the saved team back',async()=>{
 localStorage.setItem('fantasy_draft_v3_m4_u100',JSON.stringify(draft));
 api.post.mockImplementation(async()=>{saved={players,captain_id:1,vice_captain_id:2};return {data:{team_id:7}};});
 render(<App/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Test save'}).disabled).toBe(false));
 fireEvent.click(screen.getByRole('button',{name:'Test save'}));
 await screen.findByText(/saved successfully to the server/);expect(api.post).toHaveBeenCalledTimes(1);
});
it('does not label a failed save as saved',async()=>{
 localStorage.setItem('fantasy_draft_v3_m4_u100',JSON.stringify(draft));api.post.mockRejectedValue({response:{data:{detail:'Database unavailable'}}});
 render(<App/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Test save'}).disabled).toBe(false));fireEvent.click(screen.getByRole('button',{name:'Test save'}));
 await screen.findByText('Database unavailable');expect(screen.queryByText(/is saved\. Points update/)).toBeNull();
});
it('rejects success when the read-back has no saved team',async()=>{
 localStorage.setItem('fantasy_draft_v3_m4_u100',JSON.stringify(draft));api.post.mockResolvedValue({data:{team_id:7}});
 render(<App/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Test save'}).disabled).toBe(false));fireEvent.click(screen.getByRole('button',{name:'Test save'}));
 await screen.findByText('The saved team could not be verified. Reload before retrying.');
});
it('pauses saving on a saved-team load failure and retries successfully',async()=>{
 offline=true;render(<App/>);await screen.findByRole('alert');expect(screen.getByRole('button',{name:'Test save'}).disabled).toBe(true);
 offline=false;fireEvent.click(screen.getByRole('button',{name:'Retry'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Test save'}).disabled).toBe(false));
});
