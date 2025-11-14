export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-6xl font-bold mb-6 tracking-wider uppercase italic">
          Add Route
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          Visualize your cycling routes and workout data from Strava
        </p>
        
        <div className="flex gap-4 justify-center">
          <a
            href="/app"
            className="px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors uppercase tracking-wider font-semibold"
          >
            Launch App
          </a>
          <a
            href="/admin"
            className="px-8 py-3 border border-white hover:bg-white hover:text-black transition-colors uppercase tracking-wider font-semibold"
          >
            Admin
          </a>
        </div>
        
        <p className="mt-12 text-sm text-gray-500">
          Next.js Migration in Progress
        </p>
      </div>
    </main>
  )
}

