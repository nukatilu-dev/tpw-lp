import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
export const runtime = "nodejs"
const KEYS = ["business-profile","personal-cv","digital-menu","product-catalog","creative-portfolio"] as const
const THEMES = ["botanical","editorial","coffeehouse","showcase","expedition"] as const
async function admin() {
 const supabase = await createClient()
 const {data:{user},error} = await supabase.auth.getUser()
 if(error || !user) return {error:NextResponse.json({error:"Silakan login kembali."},{status:401})}
 const {data:isAdmin,error:adminError} = await supabase.rpc("is_admin")
 if(adminError || !isAdmin) return {error:NextResponse.json({error:"Akses Admin tidak diizinkan."},{status:403})}
 return {supabase,user}
}
export async function GET(request:Request) {
 const auth = await admin()
 if("error" in auth) return auth.error
 const key = new URL(request.url).searchParams.get("key")
 if(!key || !KEYS.includes(key as typeof KEYS[number])) return NextResponse.json({error:"Template key tidak valid."},{status:400})
 const {data,error} = await auth.supabase.from("template_guides").select("template_key,content,theme_key,updated_at").eq("template_key",key).maybeSingle()
 if(error) return NextResponse.json({error:error.message},{status:400})
 return NextResponse.json({guide:data})
}
export async function PUT(request:Request) {
 const auth = await admin()
 if("error" in auth) return auth.error
 let body:Record<string,unknown>
 try { body=await request.json() } catch { return NextResponse.json({error:"JSON tidak valid."},{status:400}) }
 const key=typeof body.templateKey==="string"?body.templateKey:""
 const themeKey=typeof body.themeKey==="string"?body.themeKey:""
 const content=body.content
 if(!KEYS.includes(key as typeof KEYS[number])) return NextResponse.json({error:"Template key tidak valid."},{status:400})
 if(!THEMES.includes(themeKey as typeof THEMES[number])) return NextResponse.json({error:"Theme key tidak valid."},{status:400})
 if(!content || typeof content!=="object" || Array.isArray(content)) return NextResponse.json({error:"Konten harus berupa objek JSON."},{status:400})
 if(JSON.stringify(content).length>200000) return NextResponse.json({error:"Konten maksimal 200 KB."},{status:413})
 const {data,error}=await auth.supabase.from("template_guides").upsert({template_key:key,content,theme_key:themeKey,updated_at:new Date().toISOString(),updated_by:auth.user.id},{onConflict:"template_key"}).select("template_key,content,theme_key,updated_at").single()
 if(error) return NextResponse.json({error:error.message},{status:400})
 return NextResponse.json({guide:data})
}
