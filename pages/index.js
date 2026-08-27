export default function Home() {
  return (
    <div className="min-h-screen bg-off-white">
      <nav className="bg-white border-b border-light-gray">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy">Access to Capital</h1>
          <a href="/login" className="text-navy hover:text-gold">Sign In</a>
        </div>
      </nav>
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-navy mb-6">
          Access to Capital | Your Personal Business and Consumer Credit Builder
        </h2>
        <p className="text-lg text-neutral mb-12">
          Build your credit profile through transparent financial reporting.
        </p>
        <button className="bg-gold text-navy px-8 py-3 rounded font-bold">
          Get Started
        </button>
      </main>
    </div>
  )
}
