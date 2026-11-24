import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"
import { getLandingPageDomain } from "@/lib/domain"

export async function proxy(request: NextRequest) {
  const tenant = getLandingPageDomain(request.nextUrl.hostname)

  if (tenant) {
    if (request.nextUrl.pathname !== "/") {
      return NextResponse.json(
        { error: "Not Found" },
        { status: 404 }
      )
    }

    return NextResponse.rewrite(
      new URL("/tenant-runtime", request.url)
    )
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
