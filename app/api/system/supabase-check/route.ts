import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    return NextResponse.json(
      { success: false, message: "Supabase configuration missing" },
      { status: 500 }
    )
  }

  try {
    const parsed = new URL(url)

    const response = await fetch(
      `${url}/auth/v1/settings`,
      {
        headers: { apikey: key },
        cache: "no-store",
      }
    )

    return NextResponse.json(
      {
        success: response.ok,
        project: parsed.host,
        auth_status: response.status,
        message: response.ok
          ? "Supabase connection successful"
          : "Supabase authentication endpoint rejected the request",
      },
      { status: response.ok ? 200 : 502 }
    )
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Supabase connection failed",
      },
      { status: 502 }
    )
  }
}
