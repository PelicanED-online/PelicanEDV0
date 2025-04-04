"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { registerUser } from "@/app/actions/register-actions"
import { getInvitationData, clearInvitationData, getDistrictDomains } from "@/app/actions/invitation-code-actions"
import { getSchoolsByDistrict, type School } from "@/app/actions/school-actions"
import { extractEmailDomain, isDomainAllowed } from "@/lib/email-validation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    schoolId: "",
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [allowedDomains, setAllowedDomains] = useState<string[]>([])
  const [emailError, setEmailError] = useState<string | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [showSchoolSelector, setShowSchoolSelector] = useState(false)

  // Fetch invitation data on component mount
  useEffect(() => {
    async function fetchInvitationData() {
      try {
        const result = await getInvitationData()

        if (!result.valid) {
          setError(result.message)
          setLoading(false)
          return
        }

        setInvitationData(result.data)

        // If there's a district_id, fetch the allowed domains
        if (result.data.district_id) {
          const domainsResult = await getDistrictDomains(result.data.district_id)
          if (domainsResult.success) {
            setAllowedDomains([domainsResult.domain, domainsResult.studentDomain].filter(Boolean))
          }

          // If role is school or teacher, fetch schools for the district
          if (result.data.role === "school" || result.data.role === "teacher") {
            setShowSchoolSelector(true)
            const schoolsResult = await getSchoolsByDistrict(result.data.district_id)
            if (schoolsResult.success) {
              setSchools(schoolsResult.schools)

              // If there's only one school, select it by default
              if (schoolsResult.schools.length === 1) {
                setFormData((prev) => ({
                  ...prev,
                  schoolId: schoolsResult.schools[0].school_id,
                }))
              }
            }
          }
        }

        setLoading(false)
      } catch (error: any) {
        setError(error.message || "Failed to retrieve invitation data")
        setLoading(false)
      }
    }

    fetchInvitationData()
  }, [])

  const validateEmailDomain = (email: string) => {
    if (!email || !email.includes("@") || allowedDomains.length === 0) {
      setEmailError(null)
      return true
    }

    const domain = extractEmailDomain(email)
    const isAllowed = isDomainAllowed(domain, allowedDomains)

    if (!isAllowed) {
      setEmailError(`Please use an email from one of these domains: ${allowedDomains.join(", ")}`)
      return false
    } else {
      setEmailError(null)
      return true
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Validate email domain when email changes
    if (name === "email") {
      validateEmailDomain(value)
    }
  }

  const handleSchoolChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      schoolId: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email domain before submission
    const isEmailValid = validateEmailDomain(formData.email)
    if (!isEmailValid) {
      // Show toast for better visibility
      toast({
        title: "Invalid Email Domain",
        description: emailError,
        variant: "destructive",
      })
      return
    }

    // Validate school selection for school/teacher roles
    if (showSchoolSelector && !formData.schoolId) {
      toast({
        title: "School Selection Required",
        description: "Please select your school from the dropdown.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await registerUser({
        ...formData,
        invitationCode: invitationData?.code,
      })

      if (result.error) {
        setSubmitting(false)
        toast({
          title: "Registration failed",
          description: result.error,
          variant: "destructive",
        })
        return
      } else {
        // Clear the invitation data cookie
        await clearInvitationData()

        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully.",
        })

        // Redirect to login page or dashboard
        router.push("/login?registered=true")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during registration")
      toast({
        title: "Registration Failed",
        description: err.message || "An error occurred during registration",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-black dark:to-black flex flex-col justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-gray-700">Loading registration data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-black dark:to-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Logo className="w-24 h-24" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Registration Error</h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-black py-8 px-4 shadow-lg dark:shadow-gray-900/30 sm:rounded-lg sm:px-10 dark:border dark:border-white">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="mt-6">
              <Button onClick={() => router.push("/invitation-code")} className="w-full">
                Enter Invitation Code
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-black dark:to-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo className="w-24 h-24" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Create your account
        </h2>
        {invitationData?.code && (
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Using invitation code: <span className="font-medium">{invitationData.code}</span>
          </p>
        )}
        {invitationData?.role && (
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Registering as:{" "}
            <span className="font-medium capitalize">
              {invitationData.role}
              {(invitationData.role === "district" || invitationData.role === "school") && " Admin"}
            </span>
          </p>
        )}
        {allowedDomains.length > 0 && (
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Please use your institutional email address
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-black py-8 px-4 shadow-lg dark:shadow-gray-900/30 sm:rounded-lg sm:px-10 dark:border dark:border-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </Label>
              <div className="mt-1">
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 dark:border-white px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 dark:bg-black dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </Label>
              <div className="mt-1">
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 dark:border-white px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 dark:bg-black dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border ${
                    emailError ? "border-red-500" : "border-gray-300 dark:border-white"
                  } px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 dark:bg-black dark:text-white dark:placeholder-gray-400`}
                />
              </div>

              {emailError && (
                <div className="mt-2 flex items-start space-x-2 text-red-600">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{emailError}</p>
                </div>
              )}

              {allowedDomains.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">Allowed domains: {allowedDomains.join(", ")}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 dark:border-white px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 dark:bg-black dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            {showSchoolSelector && (
              <div>
                <Label htmlFor="school" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Your School
                </Label>
                <div className="mt-1">
                  <Select value={formData.schoolId} onValueChange={handleSchoolChange}>
                    <SelectTrigger className="w-full dark:bg-black dark:border-white dark:text-white">
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.school_id} value={school.school_id}>
                          {school.school_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {schools.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    No schools found for your district. Please contact your administrator.
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#ff3300] hover:bg-[#e62e00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff3300] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={submitting || !!emailError || (showSchoolSelector && !formData.schoolId)}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
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

