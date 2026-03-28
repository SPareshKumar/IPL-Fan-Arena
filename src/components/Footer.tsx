import { Github, Linkedin, Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-12 w-full border-t border-gray-800/50 bg-transparent py-8 text-center">
      <div className="flex flex-col items-center justify-center gap-3">
        
        {/* The Credit Line */}
        <p className="text-sm text-gray-400">
          © {currentYear} <span className="font-bold text-gray-200">S. Paresh Kumar</span>. All rights reserved.
        </p>

        {/* The Tagline */}
        <p className="flex items-center justify-center gap-1 text-xs text-gray-500">
          Built with <Heart size={12} className="text-red-500 animate-pulse" /> for IPL fans
        </p>

        {/* Social Links */}
        <div className="mt-2 flex items-center gap-4 text-gray-500">
          <a 
            href="https://github.com/SPareshKumar/IPL-Fan-Arena" 
            target="_blank" 
            rel="noopener noreferrer"
            className="transition-colors hover:text-ipl-gold"
            title="GitHub"
          >
            <Github size={18} />
          </a>
          <a 
            href="https://linkedin.com/in/s-paresh-kumar" // Just swap this with your actual LinkedIn URL!
            target="_blank" 
            rel="noopener noreferrer"
            className="transition-colors hover:text-ipl-gold"
            title="LinkedIn"
          >
            <Linkedin size={18} />
          </a>
        </div>
        
      </div>
    </footer>
  )
}