import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Database, Key, Upload, CheckCircle } from "lucide-react"

export default function SetupInstructions() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Setup Required:</strong> To use EcoSync, you need to configure Supabase. Follow the steps below.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Step 1: Create Supabase Project
            </CardTitle>
            <CardDescription>Set up your Supabase database and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Go to{" "}
                <a
                  href="https://supabase.com"
                  className="text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  supabase.com
                </a>{" "}
                and create a new project
              </li>
              <li>Wait for the database to be provisioned (this may take a few minutes)</li>
              <li>Go to Settings → API to get your project URL and anon key</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Step 2: Configure Environment Variables
            </CardTitle>
            <CardDescription>Add your Supabase credentials to the project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-md">
              <pre className="text-sm">
                {`# Create .env.local file in your project root with:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`}
              </pre>
            </div>
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Replace the placeholder values with your actual Supabase project URL and anon key from Step 1.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Step 3: Run Database Scripts
            </CardTitle>
            <CardDescription>Set up the database schema and functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              In your Supabase dashboard, go to <strong>SQL Editor</strong> and run these scripts in order:
            </p>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">1. Create Tables Script</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Run <code>scripts/01-create-tables-fixed.sql</code>
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Important:</strong> Use the "fixed" version which removes the JWT secret line that causes
                    permission errors.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">2. Create Functions Script</h4>
                <p className="text-xs text-gray-600">
                  Run <code>scripts/02-create-functions.sql</code>
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">3. Seed Data Script (Optional)</h4>
                <p className="text-xs text-gray-600">
                  Run <code>scripts/03-seed-data.sql</code>
                </p>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Tip:</strong> Copy and paste each script content into the SQL Editor and click "Run" for each
                one.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Step 4: Configure Storage
            </CardTitle>
            <CardDescription>Set up file storage for waste photos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Go to <strong>Storage</strong> in your Supabase dashboard
              </li>
              <li>
                Click <strong>"New bucket"</strong>
              </li>
              <li>
                Name it <code>waste-photos</code>
              </li>
              <li>
                Make sure <strong>"Public bucket"</strong> is enabled
              </li>
              <li>
                Click <strong>"Create bucket"</strong>
              </li>
            </ol>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                The bucket needs to be public so users can upload and view waste photos.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Step 5: Test the Setup
            </CardTitle>
            <CardDescription>Verify everything is working correctly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Restart your development server</li>
              <li>Go to the signup page and try creating an account</li>
              <li>Check your Supabase dashboard to see if the user was created</li>
              <li>Try logging in with the created account</li>
            </ol>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                If you encounter any issues, check the browser console for error messages and verify your environment
                variables.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>All Done!</strong> Once configured, your EcoSync platform will be fully functional with user
          authentication, pickup requests, vendor management, and billing system.
        </AlertDescription>
      </Alert>
    </div>
  )
}
