import SetupInstructions from "@/components/setup-instructions"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">EcoSync Setup</h1>
          <p className="text-gray-600">Configure your Supabase integration to get started</p>
        </div>
        <SetupInstructions />
      </div>
    </div>
  )
}
