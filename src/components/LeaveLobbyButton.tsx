'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, X, AlertTriangle, Loader2 } from 'lucide-react'
import { leaveLobbyBackground } from '@/src/app/actions/lobby'

export default function LeaveLobbyButton({ lobbyId }: { lobbyId: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isPending, startTransition] = useTransition() // NEW: Next.js transition hook
  const router = useRouter()

  const handleConfirmLeave = () => {
    setIsLeaving(true)
    
    // Drop a silent flag so the LobbyListener knows not to show an error
    sessionStorage.setItem(`leaving_lobby_${lobbyId}`, 'true')
    
    // THE FIX: Wrap the background task and the routing in a Transition
    startTransition(() => {
      // 1. Fire the database deletion in the background 
      leaveLobbyBackground(lobbyId)

      // 2. Instantly route the user back to the dashboard without waiting
      router.push('/dashboard')
    })
  }

  const isLoading = isLeaving || isPending;

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 rounded-xl border border-red-900/50 bg-red-900/20 px-6 py-3 font-bold text-red-500 transition-all hover:bg-red-900/40 hover:text-red-400"
      >
        <LogOut size={18} />
        LEAVE LOBBY
      </button>

      {/* CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-900/50 bg-ipl-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle size={24} />
                <h2 className="text-xl font-black text-white">Leave Lobby?</h2>
              </div>
              <button 
                onClick={() => setShowConfirm(false)} 
                disabled={isLoading}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to leave this lobby? Your drafted team will be permanently deleted and you will lose all accumulated points.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="flex-1 rounded-xl bg-gray-800 py-3 font-bold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmLeave}
                disabled={isLoading}
                className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Exiting...</>
                ) : (
                  'Yes, Leave'
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}