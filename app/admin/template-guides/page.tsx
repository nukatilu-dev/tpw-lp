import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TemplateGuideEditor from "@/components/templates/template-guide-editor"
export const dynamic = "force-dynamic"
export default async function TemplateGuidesAdminPage() {
 const supabase=await createClient()
 const {data:{user},error}=await supabase.auth.getUser()
 if(error || !user) redirect("/login")
 const {data:isAdmin,error:adminError}=await supabase.rpc("is_admin")
 if(adminError || !isAdmin) redirect("/dashboard")
 return <TemplateGuideEditor />
}
