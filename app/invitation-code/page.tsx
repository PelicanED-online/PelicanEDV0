"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { validateInvitationCode } from "@/app/actions/invitation-code-actions"
import { useToast } from "@/hooks/use-toast"

export default function InvitationCodePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [invitationCode, setInvitationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null)
  const [validationComplete, setValidationComplete] = useState(false)

  // Validate the code as the user types
  useEffect(() => {
    // Clear any existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout)
    }

    // Reset validation state
    setIsValid(null)
    setError(null)
    setValidationComplete(false)

    // Don't validate empty codes
    if (!invitationCode || invitationCode.length < 3) {
      return
    }

    // Set a timeout to validate after the user stops typing
    const timeout = setTimeout(async () => {
      setValidating(true)
      try {
        const result = await validateInvitationCode(invitationCode)
        setIsValid(result.valid)
        if (!result.valid) {
          setError(result.message)
        }
        setValidationComplete(true)
      } catch (error) {
        setIsValid(false)
        setError("Failed to validate invitation code")
        setValidationComplete(true)
      } finally {
        setValidating(false)
      }
    }, 500) // 500ms debounce

    setValidationTimeout(timeout)

    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [invitationCode])

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

      // If valid, redirect to registration page with the code and other data
      const queryParams = new URLSearchParams({
        code: invitationCode,
        ...result.data,
      }).toString()

      router.push(`/register?${queryParams}`)
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-black dark:to-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo className="w-24 h-24" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Enter your invitation code
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-black py-8 px-4 shadow-lg dark:shadow-gray-900/30 sm:rounded-lg sm:px-10 dark:border dark:border-white">
          {error && isValid === false && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Invitation Code
              </Label>
              <div className="relative mt-1">
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="Enter your code"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  required
                  className="block w-full rounded-lg border border-gray-300 dark:border-white px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 pr-10 dark:bg-black dark:text-white dark:placeholder-gray-400"
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
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-black text-gray-500 dark:text-gray-400">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <a
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-white rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
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
