'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteMatch } from '@/src/app/actions/admin'

export default function DeleteMatchButton({ 
  matchId, 
  team1, 
  team2 
}: { 
  matchId: number
  team1: string
  team2: string 
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete the ${team1} vs ${team2} match? This cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    const result = await deleteMatch(matchId)

    if (result?.error) {
      toast.error(result.error)
      setIsDeleting(false)
    } else {
      toast.success('Match deleted successfully!')
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      title="Delete Match"
      className="p-2 ml-4 rounded-lg bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
    >
      <Trash2 size={18} />
    </button>
  )
}