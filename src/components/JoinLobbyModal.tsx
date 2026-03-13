'use client'

import { useState } from 'react'
import { joinLobby } from '@/src/app/actions/lobby'
import { KeyRound, X } from 'lucide-react'
import { toast } from 'sonner'

export default function JoinLobbyModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    
    const result = await joinLobby(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Successfully joined ${result.lobbyName}!`)
      setIsOpen(false)
    }
    
    setIsLoading(false)
  }

  return (
    <>
      {/* The Trigger Button - Styled slightly differently to contrast with Create */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-ipl-gold bg-transparent px-5 py-3 text-sm font-bold text-ipl-gold transition-all hover:bg-ipl-gold/10 hover:scale-105"
      >
        <KeyRound size={20} />
        Join Lobby
      </button>

      {/* The Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-ipl-bg p-6 shadow-2xl">
            
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Join a Lobby</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 transition-colors hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Invite Code</label>
                <input 
                  name="code" 
                  type="text" 
                  required 
                  placeholder="e.g., X7B9WQ"
                  className="w-full rounded-lg border border-gray-700 bg-ipl-card p-3 font-mono text-lg tracking-widest text-white uppercase transition-all focus:border-ipl-gold focus:outline-none focus:ring-1 focus:ring-ipl-gold"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="mt-4 w-full rounded-lg bg-ipl-gold p-3 font-bold text-black transition-colors hover:bg-ipl-gold-hover disabled:opacity-50"
              >
                {isLoading ? 'Joining...' : 'Enter Arena'}
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  )
}