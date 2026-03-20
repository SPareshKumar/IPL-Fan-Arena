'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldAlert, Trash2, UserX } from 'lucide-react'
import { deleteLobby, kickPlayer } from '@/src/app/actions/moderation'

export default function LobbyModeration({ 
  lobbyId, 
  teams 
}: { 
  lobbyId: string;
  teams: { user_id: string; user_name: string }[] // <-- FIXED: Now expects user_id
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [kickingId, setKickingId] = useState<string | null>(null) // <-- FIXED: String for UUID

  async function handleDeleteLobby() {
    const confirmDelete = window.confirm("Are you sure? This will permanently delete the lobby and all drafted teams.")
    if (!confirmDelete) return

    setIsDeleting(true)
    const result = await deleteLobby(lobbyId)
    
    if (result?.error) {
      toast.error(result.error)
      setIsDeleting(false)
    } else {
      // THE NUCLEAR CACHE BUSTER
      window.location.replace('/dashboard')
    }
  }

  // <-- FIXED: Accepts userId (string) instead of teamId (number)
  async function handleKickPlayer(userId: string, userName: string) {
    const confirmKick = window.confirm(`Are you sure you want to kick ${userName}?`)
    if (!confirmKick) return

    setKickingId(userId)
    // Note: Make sure your server action expects a string (userId) here now!
    const result = await kickPlayer(lobbyId, userId) 
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`${userName} has been kicked.`)
      // Optional: Refresh the page so the kicked user immediately disappears from the list
      window.location.reload() 
    }
    
    setKickingId(null)
  }

  return (
    <div className="mt-8 border border-red-900/50 bg-red-950/20 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-4">
        <ShieldAlert size={20} /> Danger Zone
      </h2>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Delete Lobby Section */}
        <div className="flex-1 bg-black/40 p-4 rounded-xl border border-red-900/30">
          <h3 className="font-bold text-white mb-2">Delete Match Lobby</h3>
          <p className="text-xs text-gray-400 mb-4">This action is irreversible.</p>
          <button 
            onClick={handleDeleteLobby}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-red-900/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} /> {isDeleting ? 'DELETING...' : 'DELETE LOBBY'}
          </button>
        </div>

        {/* Kick Players Section */}
        <div className="flex-1 bg-black/40 p-4 rounded-xl border border-red-900/30">
          <h3 className="font-bold text-white mb-2">Manage Participants</h3>
          {teams.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No players have joined yet.</p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
              {teams.map(team => (
                // <-- FIXED: key uses team.user_id
                <div key={team.user_id} className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-800">
                  <span className="text-sm font-medium text-gray-300">{team.user_name}</span>
                  <button 
                    // <-- FIXED: Passes team.user_id
                    onClick={() => handleKickPlayer(team.user_id, team.user_name)}
                    disabled={kickingId === team.user_id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    <UserX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}