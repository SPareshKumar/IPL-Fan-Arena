import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Plus, ArrowLeft, Calendar } from 'lucide-react'
import { createMatch } from '@/src/app/actions/admin'
import CreateMatchForm from '@/src/components/CreateMatchForm'
import AdminStatsManager from '@/src/components/AdminStatsManager'

// Define the 10 IPL Teams for the dropdowns
const IPL_TEAMS = ['CSK', 'DC', 'GT', 'KKR', 'LSG', 'MI', 'PBKS', 'RR', 'RCB', 'SRH']

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. AUTHENTICATION: Are they logged in?
  if (!user) redirect('/login')

  // --- THE DEBUGGER ---
  // Look at your VS Code terminal when you load the page!
  console.log("Supabase sees this email:", user.email)

  // 2. AUTHORIZATION: Change this to your exact Google email
  const ADMIN_EMAIL = 's.paresh2005@gmail.com' 
  
  // We use .toLowerCase() to prevent errors if Google returns "Paresh@gmail.com" instead of "paresh@gmail.com"
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    console.log("ACCESS DENIED: Emails do not match.")
    redirect('/dashboard') 
  }
  
  console.log("ACCESS GRANTED: Welcome Admin.")

  // Fetch existing matches
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_time', { ascending: true })

  return (
    <div className="min-h-screen bg-ipl-bg text-white p-10">
      
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-10 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3">
                <ShieldCheck className="text-ipl-gold" size={32} />
                Admin Command Center
              </h1>
              <p className="text-gray-400 mt-1">Manage matches, update statuses, and trigger lockouts.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT SIDE: CREATE MATCH FORM */}
          <div className="lg:col-span-1 bg-ipl-card border border-gray-800 rounded-2xl p-6 h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="text-ipl-accent" /> Schedule Match
            </h2>
            
            <CreateMatchForm />
          </div>

          {/* RIGHT SIDE: MATCH LIST */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="text-ipl-accent" /> Upcoming Fixtures
            </h2>
            
            <div className="space-y-4">
              {matches?.length === 0 ? (
                <div className="p-10 border border-dashed border-gray-700 rounded-xl text-center text-gray-500">
                  No matches scheduled yet.
                </div>
              ) : (
                matches?.map((match) => (
                  <div key={match.id} className="flex items-center justify-between bg-ipl-card border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="text-center w-16">
                        <span className="text-2xl font-black">{match.team1}</span>
                      </div>
                      <div className="text-gray-500 font-bold italic">VS</div>
                      <div className="text-center w-16">
                        <span className="text-2xl font-black">{match.team2}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-white mb-1">
                        {new Date(match.match_time).toLocaleString('en-IN', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                        match.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' : 
                        match.status === 'live' ? 'bg-red-500/20 text-red-400' : 
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {match.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
        <AdminStatsManager matches={matches || []} />
      </div>
    </div>
  )
}