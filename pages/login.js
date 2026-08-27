import Link from 'next/link'

export default function Login() {
  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center">
      <div className="bg-white border border-light-gray rounded-md p-12 max-w-md w-full">
        <h1 className="text-3xl font-bold text-navy mb-8 text-center">Welcome Back</h1>
        
        <form className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-light-gray rounded"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border border-light-gray rounded"
          />
          <button
            type="submit"
            className="w-full bg-gold text-navy py-2 rounded font-bold"
          >
            Sign In
          </button>
        </form>
        
        <p className="text-center mt-8 text-neutral">
          Don't have an account? <Link href="/register" className="text-gold">Create one</Link>
        </p>
      </div>
    </div>
  )
}
