'use client'

import { useEffect, useRef, useState } from 'react'

export default function TutorialSection({
  id,
  title,
  description,
  videoSrc
}: {
  id: string;
  title: string;
  description: string;
  videoSrc: string;
}) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // THE FIX: This updates the state every time it enters OR leaves the screen.
        // Now it will reset when you scroll past it, and animate again when you scroll back!
        setIsVisible(entry.isIntersecting)
      },
      { 
        threshold: 0.15, // Triggers when 15% of the video is visible
        rootMargin: "0px" 
      } 
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      id={id} 
      ref={sectionRef} 
      className={`flex flex-col justify-center scroll-mt-24 transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-12 scale-95' // Adding a slight scale makes it look elegant from both directions
      }`}
    >
      <div className="w-full rounded-2xl border border-gray-800 bg-ipl-card p-4 md:p-6 shadow-2xl transition-all hover:border-gray-600">
        
        <div className="relative w-full overflow-hidden rounded-xl bg-black border border-gray-800 mb-6 shadow-inner flex justify-center">
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            controls
            className="w-full h-auto max-h-[70vh] object-contain opacity-95 transition-opacity hover:opacity-100"
          />
        </div>
        
        <div className="px-2">
          <h2 className="mb-3 text-2xl md:text-3xl font-black text-ipl-gold">{title}</h2>
          <p className="text-gray-400 md:text-lg leading-relaxed">{description}</p>
        </div>
      </div>
    </section>
  )
}