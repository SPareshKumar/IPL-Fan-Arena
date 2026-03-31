'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Users, Loader2 } from 'lucide-react'

export default function ProfileNavButton({ 
  avatarUrl, 
  fullName, 
  variant = 'desktop' 
}: { 
  avatarUrl?: string; 
  fullName?: string;
  variant?: 'mobile' | 'desktop';
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleNavigation = (e: React.MouseEvent) => {
    e.preventDefault()
    startTransition(() => {
      router.push('/profile')
    })
  }

  // --- MOBILE VARIANT ---
  if (variant === 'mobile') {
    return (
      <a 
        href="/profile" 
        onClick={handleNavigation}
        className={`relative block h-9 w-9 overflow-hidden rounded-full border-2 border-gray-700 transition-all hover:border-ipl-gold ${isPending ? 'opacity-70 pointer-events-none border-ipl-gold' : ''}`}
      >
        {isPending ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-800">
            <Loader2 size={16} className="animate-spin text-ipl-gold" />
          </div>
        ) : avatarUrl ? (
          <Image src={avatarUrl} alt="Profile" width={36} height={36} className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-400">
            <Users size={16} />
          </div>
        )}
      </a>
    )
  }

  // --- DESKTOP VARIANT ---
  return (
    <a 
      href="/profile" 
      onClick={handleNavigation}
      className={`flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-800/50 group cursor-pointer ${isPending ? 'pointer-events-none' : ''}`}
    >
      <div className={`h-10 w-10 overflow-hidden rounded-full border-2 transition-all shadow-md shrink-0 ${isPending ? 'border-ipl-gold' : 'border-gray-700 group-hover:border-ipl-gold'}`}>
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Profile" width={40} height={40} className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-400">
            <Users size={20} />
          </div>
        )}
      </div>
      <div className="overflow-hidden">
        <p className={`truncate text-sm font-bold transition-colors ${isPending ? 'text-ipl-gold' : 'text-white group-hover:text-ipl-gold'}`}>
          {fullName || 'My Profile'}
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
          {isPending ? (
             <><Loader2 size={12} className="animate-spin text-ipl-gold" /> Loading...</>
          ) : (
             'View Profile'
          )}
        </p>
      </div>
    </a>
  )
}