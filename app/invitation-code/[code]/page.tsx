"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { validateInvitationCode } from "@/app/actions/invitation-code-actions"
import { useToast } from "@/hooks/use-toast"

export default function InvitationCodeWithParamPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const codeFromUrl = params?.code as string

  const [invitationCode, setInvitationCode] = useState(codeFromUrl || "")
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationComplete, setValidationComplete] = useState(false)

  // Validate the code from URL when the component mounts
  useEffect(() => {
    if (codeFromUrl) {
      setInvitationCode(codeFromUrl)
      validateCode(codeFromUrl)
    }
  }, [codeFromUrl])

  const validateCode = async (code: string) => {
    if (!code) return

    setValidating(true)
    setError(null)
    setValidationComplete(false)

    try {
      const result = await validateInvitationCode(code)
      setIsValid(result.valid)
      if (!result.valid) {
        setError(result.message)
      }
      setValidationComplete(true)
    } catch (error: any) {
      setIsValid(false)
      setError(error.message || "Failed to validate invitation code")
      setValidationComplete(true)
    } finally {
      setValidating(false)
    }
  }

  // Validate when the user changes the code manually
  useEffect(() => {
    if (invitationCode !== codeFromUrl) {
      validateCode(invitationCode)
    }
  }, [invitationCode, codeFromUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      toast({
        title: "Invalid Code",
        description: error || "Please enter a valid invitation code",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Final validation before proceeding
      const result = await validateInvitationCode(invitationCode)

      if (!result.valid) {
        setError(result.message)
        toast({
          title: "Invalid Code",
          description: result.message,
          variant: "destructive",
        })
        return
      }

      // Use a clean redirect with no parameters
      // The JWT is stored in a cookie by the validateInvitationCode function
      window.location.href = "/register"
      // Using window.location.href instead of router.push to ensure a clean navigation
    } catch (error: any) {
      setError(error.message || "An error occurred")
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo className="w-24 h-24" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verify your invitation code</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {error && isValid === false && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700">
                Invitation Code
              </Label>
              <div className="relative mt-1">
                <Input
                  id="invitationCode"
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 pr-10"
                />
                {validating && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  </div>
                )}
                {!validating && isValid === true && validationComplete && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
                {!validating && isValid === false && validationComplete && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#ff3300] hover:bg-[#e62e00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff3300] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading || validating || isValid !== true || !validationComplete || !invitationCode}
              autoFocus
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                href="/login"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

