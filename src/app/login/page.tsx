import GoogleSignInButton from '@/src/components/GoogleSignInButton'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Welcome to IPL Fan Arena
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to join a lobby and draft your team.
          </p>
        </div>
        <div className="mt-8">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  )
}