'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createLobby } from '@/src/app/actions/lobby'
import { PlusCircle, X, Loader2, Trophy, Calendar } from 'lucide-react'
import { toast } from 'sonner'

type Match = { id: number; team1: string; team2: string; match_time: string }

export default function CreateLobbyModal({ matches }: { matches: Match[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const [isPending, startTransition] = useTransition() 
  const [isSubmitting, setIsSubmitting] = useState(false) 
  
  // NEW: State to track which mode they are creating
  const [lobbyType, setLobbyType] = useState<'single' | 'tournament'>('single')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault() 
    
    if (isSubmitting || isPending) return 
    
    setIsSubmitting(true) 
    
    const formData = new FormData(e.currentTarget)
    const result = await createLobby(formData)
    
    if (result?.error) {
      toast.error(result.error)
      setIsSubmitting(false)
    } else {
      toast.success(`${lobbyType === 'tournament' ? 'Tournament' : 'Lobby'} created! Invite code: ${result.inviteCode}`)
      setIsOpen(false) 
      
      startTransition(() => {
        router.refresh()
      })
      setIsSubmitting(false)
    }
  }

  const isLoading = isSubmitting || isPending

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
              <button onClick={() => setIsOpen(false)} disabled={isLoading} className="text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Dynamic hidden input to pass to Server Action */}
              <input type="hidden" name="type" value={lobbyType} />

              {/* MODE TOGGLE */}
              <div className="flex gap-2 rounded-xl bg-gray-900 p-1 border border-gray-800">
                <button 
                  type="button" 
                  onClick={() => setLobbyType('single')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${lobbyType === 'single' ? 'bg-ipl-gold text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  <Calendar size={16} /> Single Match
                </button>
                <button 
                  type="button" 
                  onClick={() => setLobbyType('tournament')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${lobbyType === 'tournament' ? 'bg-ipl-gold text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  <Trophy size={16} /> Tournament
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {lobbyType === 'tournament' ? 'Tournament Name' : 'Lobby Name'}
                </label>
                <input 
                  name="name" 
                  type="text" 
                  required 
                  disabled={isLoading}
                  placeholder={lobbyType === 'tournament' ? "e.g., The Office League" : "e.g., NSUT Hostellers"}
                  className="w-full rounded-lg border border-gray-700 bg-ipl-card p-3 text-white focus:border-ipl-gold focus:outline-none focus:ring-1 focus:ring-ipl-gold transition-all disabled:opacity-50"
                />
              </div>

              {/* ONLY SHOW FIXTURE SELECT IF SINGLE MATCH MODE */}
              {lobbyType === 'single' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Select Fixture</label>
                  <select 
                    name="targetId" 
                    required={lobbyType === 'single'}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-gray-700 bg-ipl-card p-3 text-white focus:border-ipl-gold focus:outline-none focus:ring-1 focus:ring-ipl-gold transition-all disabled:opacity-50"
                  >
                    <option value="">-- Choose a Match --</option>
                    {matches.map((match) => (
                      <option key={match.id} value={match.id}>
                        {match.team1} vs {match.team2} 
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {lobbyType === 'tournament' && (
                <div className="rounded-lg bg-gray-900/50 border border-gray-800 p-4 text-xs text-gray-400 text-center">
                  You can schedule matches for this tournament from the Group Dashboard after creating it.
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-lg p-3 font-bold transition-all mt-4 ${
                  isLoading 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-ipl-gold text-black hover:bg-yellow-400'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create & Generate Code'
                )}
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  )
}