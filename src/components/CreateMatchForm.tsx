'use client'

import { useState } from 'react'
import { createMatch } from '@/src/app/actions/admin'
import { toast } from 'sonner'

const IPL_TEAMS = ['CSK', 'DC', 'GT', 'KKR', 'LSG', 'MI', 'PBKS', 'RR', 'RCB', 'SRH']

export default function CreateMatchForm() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleAction(formData: FormData) {
    setIsLoading(true)
    const result = await createMatch(formData)
    
    if (result?.error) {
      toast.error(result.error) // Now we will actually see if you get blocked!
    } else {
      toast.success('Fixture scheduled successfully!')
    }
    setIsLoading(false)
  }

  return (
    <form action={handleAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Team 1 (Home)</label>
          <select name="team1" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-ipl-gold focus:ring-1 focus:ring-ipl-gold outline-none">
            {IPL_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Team 2 (Away)</label>
          <select name="team2" defaultValue="RCB" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-ipl-gold focus:ring-1 focus:ring-ipl-gold outline-none">
            {IPL_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Match Date & Time</label>
        <input 
          type="datetime-local" 
          name="matchTime" 
          required
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-ipl-gold focus:ring-1 focus:ring-ipl-gold outline-none [color-scheme:dark]"
        />
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-ipl-gold hover:bg-ipl-gold-hover text-black font-bold py-3 rounded-lg transition-colors mt-2 disabled:opacity-50"
      >
        {isLoading ? 'Scheduling...' : 'Create Fixture'}
      </button>
    </form>
  )
}