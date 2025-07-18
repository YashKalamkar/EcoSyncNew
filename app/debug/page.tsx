import DebugPanel from "@/components/debug-panel"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Debug Panel</h1>
          <p className="text-gray-600">System diagnostics and data overview</p>
        </div>
        <DebugPanel />
      </div>
    </div>
  )
}
