export function getLandingPageHostname(
  slug: string | null | undefined,
  domainType: string | null | undefined
): string | null {
  if (!slug) return null

  const suffix = domainType === "lpf" ? "lpf" : "lp"
  return `${slug}-${suffix}.tpw.my.id`
}

export function getLandingPageDomain(
  hostname: string | null | undefined
): { slug: string; domainType: "lp" | "lpf" } | null {
  if (!hostname) return null

  const host = hostname.toLowerCase().replace(/\.$/, "")
  const match = host.match(
    /^([a-z0-9]+(?:-[a-z0-9]+)*)-(lp|lpf)\.tpw\.my\.id$/
  )

  if (!match) return null

  return {
    slug: match[1],
    domainType: match[2] as "lp" | "lpf",
  }
}
