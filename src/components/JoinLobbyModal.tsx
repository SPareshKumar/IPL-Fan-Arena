'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { joinLobby } from '@/src/app/actions/lobby'
import { KeyRound, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function JoinLobbyModal() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // THE FIX: Standard React Form Event
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault() 
    
    if (isSubmitting || isPending) return
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    const result = await joinLobby(formData)
    
    if (result.error) {
      toast.error(result.error)
      setIsSubmitting(false)
    } else {
      toast.success(`Successfully joined ${result.lobbyName}!`)
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
        className="flex items-center gap-2 rounded-lg border border-ipl-gold bg-transparent px-5 py-3 text-sm font-bold text-ipl-gold transition-all hover:bg-ipl-gold/10 hover:scale-105"
      >
        <KeyRound size={20} />
        Join Lobby
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-ipl-bg p-6 shadow-2xl">
            
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Join a Lobby</h2>
              <button onClick={() => setIsOpen(false)} disabled={isLoading} className="text-gray-400 transition-colors hover:text-white disabled:opacity-50">
                <X size={24} />
              </button>
            </div>

            {/* THE FIX: Changed 'action' to 'onSubmit' */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Invite Code</label>
                <input 
                  name="code" 
                  type="text" 
                  required 
                  disabled={isLoading}
                  placeholder="e.g., X7B9WQ"
                  className="w-full rounded-lg border border-gray-700 bg-ipl-card p-3 font-mono text-lg tracking-widest text-white uppercase transition-all focus:border-ipl-gold focus:outline-none focus:ring-1 focus:ring-ipl-gold disabled:opacity-50"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-lg p-3 font-bold transition-all mt-4 ${
                  isLoading 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-ipl-gold text-black hover:bg-ipl-gold-hover'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Enter Arena'
                )}
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  )
}