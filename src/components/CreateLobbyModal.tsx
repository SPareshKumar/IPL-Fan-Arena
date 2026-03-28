'use client'

import { useState } from 'react'
import { createLobby } from '@/src/app/actions/lobby'
import { PlusCircle, X } from 'lucide-react'
import { toast } from 'sonner'

type Match = { id: number; team1: string; team2: string; match_time: string }

export default function CreateLobbyModal({ matches }: { matches: Match[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    // FRONTEND FIX: The immediate lock. If it's already loading, ignore extra clicks completely.
    if (isLoading) return 
    
    setIsLoading(true)
    
    const result = await createLobby(formData)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`Lobby created! Invite code: ${result.inviteCode}`)
      setIsOpen(false)
    }
    
    setIsLoading(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-ipl-gold px-5 py-3 text-sm font-bold text-black transition-all hover:bg-ipl-gold-hover hover:scale-105 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
      >
        <PlusCircle size={20} />
        Create Lobby
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-ipl-bg p-6 shadow-2xl">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Lobby</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-5">
              
              {/* HIDDEN FIELD to safely pass the lobby type to your backend action */}
              <input type="hidden" name="type" value="single" />

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Lobby Name</label>
                <input 
                  name="name" 
                  type="text" 
                  required 
                  placeholder="e.g., NSUT Hostellers"
                  className="w-full rounded-lg border border-gray-700 bg-ipl-card p-3 text-white focus:border-ipl-gold focus:outline-none focus:ring-1 focus:ring-ipl-gold transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Select Fixture</label>
                <select 
                  name="targetId" 
                  required
                  className="w-full rounded-lg border border-gray-700 bg-ipl-card p-3 text-white focus:border-ipl-gold focus:outline-none focus:ring-1 focus:ring-ipl-gold transition-all"
                >
                  <option value="">-- Choose a Match --</option>
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.team1} vs {match.team2} 
                    </option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full rounded-lg p-3 font-bold transition-all mt-4 ${
                  isLoading 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-ipl-gold text-black hover:bg-yellow-400'
                }`}
              >
                {isLoading ? 'Creating...' : 'Create & Generate Code'}
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  )
}