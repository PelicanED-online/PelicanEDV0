/**
 * Extracts the domain part from an email address
 * @param email The email address to extract the domain from
 * @returns The domain part of the email address
 */
export function extractEmailDomain(email: string): string {
  if (!email || !email.includes("@")) {
    return ""
  }

  return email.split("@")[1].toLowerCase()
}

/**
 * Checks if a domain is in the list of allowed domains
 * @param domain The domain to check
 * @param allowedDomains Array of allowed domains
 * @returns True if the domain is allowed, false otherwise
 */
export function isDomainAllowed(domain: string, allowedDomains: string[]): boolean {
  if (!domain || allowedDomains.length === 0) {
    return true // If no domain restrictions, allow all
  }

  return allowedDomains.some((allowedDomain) => {
    // Handle wildcards like *.example.edu
    if (allowedDomain.startsWith("*.")) {
      const baseDomain = allowedDomain.substring(2)
      return domain.endsWith(baseDomain)
    }

    // Exact match
    return domain.toLowerCase() === allowedDomain.toLowerCase()
  })
}
