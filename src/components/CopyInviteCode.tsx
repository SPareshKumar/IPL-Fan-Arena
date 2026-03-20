'use client'

import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CopyInviteCode({ code }: { code: string }) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // 1. Copies ONLY the 6-digit code
  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault() 
    e.stopPropagation() 

    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    toast.success('Code copied!')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // 2. Copies a fully formatted message for WhatsApp/Discord
  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault() 
    e.stopPropagation() 

    // Automatically gets your localhost or Vercel domain!
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    
    // The pre-formatted message
    const shareText = `🏏 Join my IPL Fan Arena!\n\nCode: ${code}\nPlay here: ${baseUrl}`

    navigator.clipboard.writeText(shareText)
    setCopiedLink(true)
    toast.success('Share message copied!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
      Invite: 
      <div className="flex items-center rounded-md bg-gray-900 border border-gray-700 shadow-inner overflow-hidden transition-colors hover:border-gray-500">
        
        {/* The Code Display */}
        <span className="px-2.5 py-1 font-mono tracking-widest text-ipl-gold border-r border-gray-800">
          {code}
        </span>

        {/* Copy Code Button */}
        <button
          onClick={handleCopyCode}
          className="group flex items-center justify-center p-1.5 md:p-2 transition-all hover:bg-black hover:text-ipl-gold"
          title="Copy Code Only"
        >
          {copiedCode ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Copy size={14} className="text-gray-500 transition-colors group-hover:text-ipl-gold" />
          )}
        </button>

        {/* Copy WhatsApp Link Button */}
        <button
          onClick={handleCopyLink}
          className="group flex items-center justify-center p-1.5 md:p-2 border-l border-gray-800 transition-all hover:bg-black hover:text-ipl-gold"
          title="Copy WhatsApp Message"
        >
          {copiedLink ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Share2 size={14} className="text-gray-500 transition-colors group-hover:text-ipl-gold" />
          )}
        </button>
        
      </div>
    </div>
  )
}