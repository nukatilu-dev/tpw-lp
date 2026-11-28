"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import UniversalRenderer from "@/components/templates/universal-renderer"
import { makeGuideContent } from "@/components/templates/template-preview-gallery"
import { BUSINESS_PROFILE_LAYOUTS, toUniversalDocument, type BusinessProfileLayout, type UniversalTheme } from "@/lib/templates/universal"
import { applyThemePreset, THEME_PRESETS, type ThemeKey } from "@/lib/templates/themes"
import type { TemplateKey } from "@/lib/templates/registry"

type Page = { id: string; title: string; slug: string | null; status: string; content: Record<string, unknown> }
type ActiveField = { path: string; label: string; kind: "text" | "image" }
type Props = { userId: string; guide: TemplateKey; theme: ThemeKey; newPageId?: string; newPageSlug?: string; initialPage?: Page | null }
const GUIDE_LABEL: Record<TemplateKey,string> = {
  "business-profile":"TPW Tahu Hejo","personal-cv":"Leeloo TPW","digital-menu":"Kedai Kopi TPW",
  "product-catalog":"Katalog Produk TPW","creative-portfolio":"Kreatif Sendiri TPW"
}
const GUIDE_DESCRIPTION: Record<TemplateKey, string> = {
  "business-profile": "Profil usaha, layanan, dan informasi kontak.",
  "personal-cv": "Profil personal, pengalaman, dan portofolio diri.",
  "digital-menu": "Menu digital untuk kedai, restoran, dan kuliner.",
  "product-catalog": "Katalog produk, kategori, foto, dan harga.",
  "creative-portfolio": "Karya, proyek, dan portofolio kreatif.",
}
const GUIDE_KEYS: TemplateKey[] = [
  "business-profile", "personal-cv", "digital-menu", "product-catalog", "creative-portfolio",
]
const DEFAULT_THEMES: Record<TemplateKey, ThemeKey> = {
  "business-profile": "botanical",
  "personal-cv": "expedition",
  "digital-menu": "coffeehouse",
  "product-catalog": "showcase",
  "creative-portfolio": "editorial",
}
function slugify(s:string) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40) }
function isObject(v:unknown): v is Record<string,unknown> { return !!v && typeof v==="object" && !Array.isArray(v) }
function label(s:string) { return s.replace(/([A-Z])/g," $1").replace(/[_-]/g," ").replace(/^./,c=>c.toUpperCase()) }
function Field({name,value,onChange}:{name:string;value:unknown;onChange:(v:unknown)=>void}) {
  if (Array.isArray(value) || isObject(value)) {
    return <label className="ue-field"><span>{label(name)}</span><textarea rows={Math.min(10,Math.max(3,JSON.stringify(value,null,2).split("\n").length))} value={JSON.stringify(value,null,2)} onChange={e=>{try{onChange(JSON.parse(e.target.value))}catch{}}}/><small>Data daftar/kelompok — format JSON valid</small></label>
  }
  if (typeof value==="number") return <label className="ue-field"><span>{label(name)}</span><input type="number" value={value} onChange={e=>onChange(Number(e.target.value))}/></label>
  const multiline = /description|introduction|biography|headline|tagline|address|about/i.test(name)
  return <label className="ue-field"><span>{label(name)}</span>{multiline?<textarea rows={3} value={String(value??"")} onChange={e=>onChange(e.target.value)}/>:<input value={String(value??"")} onChange={e=>onChange(e.target.value)}/>}</label>
}
export default function UniversalEditor({userId,guide,theme,newPageId="",newPageSlug="",initialPage=null}:Props) {
  const router=useRouter()
  const defaults=useMemo(()=>makeGuideContent(guide),[guide])
  const [selectedGuide, setSelectedGuide] = useState<TemplateKey>(guide)
  const [content,setContent]=useState<Record<string,unknown>>(()=>initialPage?.content ?? defaults)
  const [title,setTitle]=useState(initialPage?.title ?? GUIDE_LABEL[guide])
  const [slug,setSlug]=useState(initialPage?.slug ?? newPageSlug ?? newPageId)
  const [pageId,setPageId]=useState(initialPage?.id ?? "")
  const savedMeta = isObject(initialPage?.content?._tpw) ? initialPage?.content?._tpw as Record<string, unknown> : {}
  const [themeKey,setThemeKey]=useState<ThemeKey>((savedMeta.themeKey as ThemeKey | undefined) ?? theme)
  const [themeOverrides,setThemeOverrides]=useState<UniversalTheme>(() => isObject(savedMeta.theme) ? savedMeta.theme as UniversalTheme : {})
  const [businessProfileLayout,setBusinessProfileLayout]=useState<BusinessProfileLayout>(() => {
    const value = savedMeta.businessProfileLayout
    return value === "clean-business" || value === "modern-teal" || value === "corporate-dark" ? value : "corporate-dark"
  })
  const [notice,setNotice]=useState("")
  const [workspaceTab,setWorkspaceTab]=useState<"theme"|"content"|"gallery"|"media">("content")
  const [workspaceVisible,setWorkspaceVisible]=useState(true)
  const workspaceTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  const [activeField,setActiveField]=useState<ActiveField|null>(null)
  const imageInputRef=useRef<HTMLInputElement>(null)
  const [pendingImage,setPendingImage]=useState<File|null>(null)
  const [imagePreviewUrl,setImagePreviewUrl]=useState("")
  const [cropZoom,setCropZoom]=useState(1)
  const [cropX,setCropX]=useState(50)
  const [cropY,setCropY]=useState(50)
  const savedFrames = isObject(savedMeta.imageFrames) ? savedMeta.imageFrames as Record<string,{zoom:number;x:number;y:number}> : {}
  const [imageFrames,setImageFrames]=useState<Record<string,{zoom:number;x:number;y:number}>>(savedFrames)
  const [busy,setBusy]=useState(false)
  const [guideLoading,setGuideLoading]=useState(false)
  useEffect(()=>{
    if(!workspaceVisible || activeField || pendingImage || busy) return
    const reset=()=>{
      if(workspaceTimer.current) clearTimeout(workspaceTimer.current)
      workspaceTimer.current=setTimeout(()=>setWorkspaceVisible(false),10000)
    }
    const events:[keyof WindowEventMap,EventListener][]=[
      ["pointerdown",reset],["keydown",reset],["touchstart",reset],["wheel",reset]
    ]
    events.forEach(([name,fn])=>window.addEventListener(name,fn,{passive:true}))
    reset()
    return ()=>{
      if(workspaceTimer.current) clearTimeout(workspaceTimer.current)
      events.forEach(([name,fn])=>window.removeEventListener(name,fn))
    }
  },[workspaceVisible,activeField,pendingImage,busy,workspaceTab])
  const document=useMemo(()=>{
    const doc=toUniversalDocument(selectedGuide,content)
    doc.themeKey=themeKey
    doc.theme={...applyThemePreset(themeKey,doc.theme),...themeOverrides}
    doc.businessProfileLayout=businessProfileLayout
    // Apply the saved crop metadata to the same renderer used by preview and publishing.
    doc.imageFrames=imageFrames
    return doc
  },[selectedGuide,content,themeKey,themeOverrides,imageFrames,businessProfileLayout])
  async function loadGuideFromDatabase(nextGuide: TemplateKey) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("template_guides")
      .select("content,theme_key")
      .eq("template_key", nextGuide)
      .maybeSingle()
    if (error) throw error
    const guideContent = isObject(data?.content) && Object.keys(data.content).length
      ? data.content as Record<string, unknown>
      : makeGuideContent(nextGuide)
    const allowedThemes = THEME_PRESETS.map((item) => item.key)
    const guideTheme = typeof data?.theme_key === "string" && allowedThemes.includes(data.theme_key as ThemeKey)
      ? data.theme_key as ThemeKey
      : DEFAULT_THEMES[nextGuide]
    return { content: guideContent, theme: guideTheme, fromDatabase: Boolean(data?.content) }
  }

  useEffect(() => {
    if (initialPage) return
    let active = true
    setGuideLoading(true)
    loadGuideFromDatabase(guide)
      .then((result) => {
        if (!active) return
        setContent(result.content)
        setThemeKey(result.theme)
        if (result.fromDatabase) setNotice(`Master Guide ${GUIDE_LABEL[guide]} dimuat dari database.`)
      })
      .catch((error) => {
        if (active) setNotice(`Guide database belum dapat dibaca; memakai contoh lokal. ${error instanceof Error ? error.message : ""}`)
      })
      .finally(() => { if (active) setGuideLoading(false) })
    return () => { active = false }
  // Initial guide is loaded once; category changes are handled by chooseGuide.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function chooseGuide(nextGuide: TemplateKey) {
    if (nextGuide === selectedGuide || guideLoading || busy) return
    if (initialPage && !window.confirm("Mengganti jenis website akan mengganti struktur dan konten dengan Master Guide kategori baru. Lanjutkan?")) return
    setGuideLoading(true)
    setNotice(`Memuat Master Guide ${GUIDE_LABEL[nextGuide]}...`)
    try {
      const result = await loadGuideFromDatabase(nextGuide)
      setSelectedGuide(nextGuide)
      setContent(result.content)
      setTitle(GUIDE_LABEL[nextGuide])
      setThemeKey(result.theme)
      setThemeOverrides({})
      setActiveField(null)
      setNotice(result.fromDatabase
        ? `Master Guide ${GUIDE_LABEL[nextGuide]} dimuat dari database.`
        : `Guide database belum diisi; contoh bawaan digunakan untuk ${GUIDE_LABEL[nextGuide]}.`)
    } catch (error) {
      setNotice(error instanceof Error ? `Gagal memuat Master Guide: ${error.message}` : "Gagal memuat Master Guide.")
    } finally {
      setGuideLoading(false)
    }
  }
  function update(key:string,value:unknown){setContent(current=>({...current,[key]:value}))}
  function readPath(path:string): unknown {
    return path.split(".").reduce<unknown>((value, part) => {
      if (Array.isArray(value)) return value[Number(part)]
      if (isObject(value)) return value[part]
      return undefined
    }, content)
  }
  function updatePath(path:string,value:unknown) {
    const parts=path.split(".")
    setContent(current=>{
      const root={...current} as Record<string,unknown>
      let cursor: Record<string,unknown>|unknown[]=root
      let source: unknown=current
      for(let i=0;i<parts.length-1;i++){
        const part=parts[i]
        const next=Array.isArray(source)?source[Number(part)]:isObject(source)?source[part]:undefined
        const clone=Array.isArray(next)?[...next]:isObject(next)?{...next}:{}
        if(Array.isArray(cursor)) cursor[Number(part)]=clone
        else cursor[part]=clone
        cursor=clone as Record<string,unknown>|unknown[]
        source=next
      }
      const last=parts[parts.length-1]
      if(Array.isArray(cursor)) cursor[Number(last)]=value
      else cursor[last]=value
      return root
    })
  }
  function uploadInlineImage(file?:File){
    if(!file||!activeField)return
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setNotice("Format gambar harus JPG, PNG, atau WebP.");return}
    if(file.size>8*1024*1024){setNotice("Ukuran gambar maksimal 8 MB.");return}
    if(imagePreviewUrl)URL.revokeObjectURL(imagePreviewUrl)
    setPendingImage(file);setImagePreviewUrl(URL.createObjectURL(file))
    setCropZoom(1);setCropX(50);setCropY(50)
    setNotice("Atur posisi foto agar pas dengan frame, lalu terapkan.")
  }
  async function confirmInlineImage(){
    if(!pendingImage||!activeField)return
    const field=activeField
    const id=await saveDraft()
    if(!id)return
    setBusy(true);setNotice("Mengunggah gambar...")
    try{
      const supabase=createClient()
      const extension=pendingImage.type==="image/jpeg"?"jpg":pendingImage.type==="image/png"?"png":"webp"
      const path=`${userId}/${id}/inline-${Date.now()}.${extension}`
      const {error}=await supabase.storage.from("website-assets").upload(path,pendingImage,{cacheControl:"3600",upsert:false,contentType:pendingImage.type})
      if(error)throw error
      const {data}=supabase.storage.from("website-assets").getPublicUrl(path)
      const setNestedValue=(source:unknown,parts:string[],value:unknown):unknown=>{
        if(!parts.length)return value
        const [head,...tail]=parts
        if(Array.isArray(source)){
          const copy=[...source];const index=Number(head)
          if(!Number.isInteger(index)||index<0)return copy
          copy[index]=setNestedValue(copy[index],tail,value);return copy
        }
        const copy=isObject(source)?{...source}:{}
        copy[head]=setNestedValue(copy[head],tail,value);return copy
      }
      const nextContent=setNestedValue(content,field.path.split("."),data.publicUrl) as Record<string,unknown>
      const nextFrames={...imageFrames,[field.path]:{zoom:cropZoom,x:cropX,y:cropY}}
      const oldMeta=isObject(nextContent._tpw)?nextContent._tpw:{}
      const payloadContent={...nextContent,_tpw:{...oldMeta,editor:"universal-v1",templateGuideKey:selectedGuide,themeKey,theme:document.theme,imageFrames:nextFrames,businessProfileLayout}}
      const {error:updateError}=await supabase.from("landing_pages").update({content:payloadContent}).eq("id",id).eq("owner_id",userId).is("deleted_at",null)
      if(updateError)throw updateError
      setContent(nextContent);setImageFrames(nextFrames);setActiveField(null);setPendingImage(null)
      if(imagePreviewUrl)URL.revokeObjectURL(imagePreviewUrl);setImagePreviewUrl("")
      setNotice(`${field.label} berhasil diunggah dan crop disimpan.`)
    }catch(error){setNotice(error instanceof Error?error.message:"Gagal mengunggah gambar. Periksa izin bucket website-assets.")}
    finally{setBusy(false)}
  }
  function cancelImageCrop(){if(imagePreviewUrl)URL.revokeObjectURL(imagePreviewUrl);setImagePreviewUrl("");setPendingImage(null);setNotice("")}
  function updateTheme(key:keyof UniversalTheme,value:string){setThemeOverrides(current=>({...current,[key]:value}))}
  async function uploadBackground(file?:File){
    if(!file)return
    if(!file.type.startsWith("image/")){setNotice("Pilih file gambar untuk background.");return}
    if(file.size>8*1024*1024){setNotice("Ukuran foto background maksimal 8 MB.");return}
    setBusy(true);setNotice("Mengunggah foto background...")
    try{
      const supabase=createClient()
      const extension=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg"
      const path=`${userId}/${pageId||newPageId||"draft"}/background-${Date.now()}.${extension}`
      const {error}=await supabase.storage.from("website-assets").upload(path,file,{cacheControl:"3600",upsert:true,contentType:file.type})
      if(error)throw error
      const {data}=supabase.storage.from("website-assets").getPublicUrl(path)
      updateTheme("backgroundImage",data.publicUrl)
      setNotice("Foto background berhasil dipasang.")
    }catch(error){setNotice(error instanceof Error?error.message:"Gagal mengunggah foto background.")}
    finally{setBusy(false)}
  }
  function changeThemeStyle(value:ThemeKey){setThemeKey(value);setThemeOverrides({})}
  async function saveDraft():Promise<string|null>{
    const clean=slugify(slug)
    if(!title.trim() || !/^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(clean)){setNotice("Judul dan alamat website 2–40 karakter wajib valid.");return null}
    setBusy(true);setNotice("Menyimpan draft...")
    try{
      const supabase=createClient()
      const {data:check,error:checkError}=await supabase.rpc("check_landing_page_slug_availability",{p_slug:clean,p_exclude_page_id:pageId||null})
      if(checkError) throw checkError
      const available=(Array.isArray(check)?check[0]:check) as {is_available?:boolean}|null
      if(!available?.is_available) throw new Error("Alamat website sudah digunakan atau belum tersedia.")
      const oldMeta=isObject(content._tpw)?content._tpw:{}
      const payloadContent={...content,_tpw:{...oldMeta,editor:"universal-v1",templateGuideKey:selectedGuide,themeKey,theme:document.theme,imageFrames,businessProfileLayout}}
      const payload={title:title.trim(),slug:clean,content:payloadContent,template_key:selectedGuide}
      let savedPageId=pageId
      if(pageId){
        const {data,error}=await supabase.from("landing_pages").update(payload).eq("id",pageId).eq("owner_id",userId).is("deleted_at",null).select("id").maybeSingle()
        if(error) throw error
        if(!data) throw new Error("Draft tidak ditemukan atau tidak dapat diedit.")
      }else{
        const {data,error}=await supabase.from("landing_pages").insert({...payload,...(newPageId?{id:newPageId}:{}),owner_id:userId,template_key:selectedGuide,status:"draft",domain_type:"lp"}).select("id").single()
        if(error) throw error
        if(!data?.id) throw new Error("ID draft tidak diterima.")
        savedPageId=data.id
        setPageId(data.id);window.history.replaceState(null,"",`/dashboard/editor/${data.id}`)
      }
      setNotice("Draft berhasil disimpan.")
      return savedPageId || newPageId || null
    }catch(e){setNotice(e instanceof Error?e.message:"Gagal menyimpan draft.");return null}
    finally{setBusy(false)}
  }
  async function submit(){
    const id=await saveDraft();if(!id)return
    setBusy(true)
    try{const {error}=await createClient().rpc("submit_landing_page",{p_page_id:id});if(error)throw error;setNotice("Website berhasil diajukan untuk pemeriksaan Admin.");router.push("/dashboard");router.refresh()}
    catch(e){setNotice(e instanceof Error?e.message:"Gagal mengajukan website.")}finally{setBusy(false)}
  }
  return <main className="ue-shell">
    <header className="ue-top ue-persistent-bar"><div className="ue-brand"><small>TPW-LP · UNIVERSAL EDITOR</small><h1>Edit Website</h1><p>{GUIDE_LABEL[selectedGuide]}</p></div><div className="ue-actions"><button className="ue-save" disabled={busy} onClick={()=>void saveDraft()}><span aria-hidden="true">▣</span> Save</button><button className="ue-submit" disabled={busy} onClick={()=>void submit()}><span aria-hidden="true">↗</span> Ajukan</button><button className="ue-dashboard" type="button" onClick={()=>{if(busy)return;router.push("/dashboard")}}><span aria-hidden="true">⌂</span> Dashboard</button></div></header>
    <div className="ue-workspace-note">Klik teks atau foto pada preview untuk mengedit langsung. Pengaturan tersedia melalui workspace.</div>
    {workspaceVisible && <section className="ue-floating-workspace" aria-label="Workspace editor">
      <div className="ue-workspace-tabs">
        <button type="button" className={workspaceTab==="theme"?"is-active":""} onClick={()=>setWorkspaceTab("theme")}><span>◈</span><small>Theme</small></button>
        <button type="button" className={workspaceTab==="content"?"is-active":""} onClick={()=>setWorkspaceTab("content")}><span>☷</span><small>Content</small></button>
        <button type="button" className={workspaceTab==="gallery"?"is-active":""} onClick={()=>setWorkspaceTab("gallery")}><span>▦</span><small>Gallery</small></button>
        <button type="button" className={workspaceTab==="media"?"is-active":""} onClick={()=>setWorkspaceTab("media")}><span>⚙</span><small>Media & Contact</small></button>
        <button type="button" className="ue-workspace-hide" title="Sembunyikan editor" onClick={()=>setWorkspaceVisible(false)}>⌄</button>
      </div>
      <div className="ue-workspace-body">
      {workspaceTab==="content" && <>
    <section className="ue-category-picker" aria-label="Pilih kategori website">
      <div className="ue-category-heading"><div><strong>Jenis / Kategori Website</strong><p>Master Guide menentukan struktur, field, batas konten, dan Theme Style awal.</p></div><span>{guideLoading ? "MEMUAT GUIDE..." : "5 KATEGORI"}</span></div>
      <div className="ue-category-grid">
        {GUIDE_KEYS.map((key) => <button type="button" key={key} disabled={guideLoading || busy} className={`ue-category-card ${selectedGuide === key ? "is-selected" : ""}`} aria-pressed={selectedGuide === key} onClick={() => void chooseGuide(key)}>
          <span className="ue-category-check">{selectedGuide === key ? "✓" : "＋"}</span>
          <strong>{GUIDE_LABEL[key]}</strong><small>{GUIDE_DESCRIPTION[key]}</small>
        </button>)}
      </div>
    </section>
    <div className="ue-meta"><label>Judul Website<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Alamat Website<div className="ue-slug"><input value={slug} onChange={e=>setSlug(slugify(e.target.value))}/><span>-lp.tpw.my.id</span></div></label><label>Theme Style<select value={themeKey} onChange={e=>changeThemeStyle(e.target.value as ThemeKey)}>{THEME_PRESETS.map(t=><option key={t.key} value={t.key}>{t.name}</option>)}</select></label></div>
    {selectedGuide === "business-profile" && <section className="ue-business-layouts" aria-label="Pilih template Business Profile"><div><strong>Layout Business Profile</strong><p>Pilih komposisi tanpa mengubah konten atau foto yang tersimpan.</p></div><div className="ue-business-layout-grid">{BUSINESS_PROFILE_LAYOUTS.map(item=><button type="button" key={item.key} className={businessProfileLayout===item.key?"is-selected":""} onClick={()=>setBusinessProfileLayout(item.key)} aria-pressed={businessProfileLayout===item.key}><strong>{item.name}</strong><small>{item.description}</small></button>)}</div></section>}
      </>}
      {workspaceTab==="theme" && <details className="ue-style-panel" open><summary>Theme · {THEME_PRESETS.find(t=>t.key===themeKey)?.name}</summary><section aria-label="Pengaturan Theme">
      <div className="ue-style-heading"><div><strong>Theme Style</strong><p>Atur warna, huruf, dan suasana halaman. Perubahan langsung terlihat di preview.</p></div><span>{THEME_PRESETS.find(t=>t.key===themeKey)?.name}</span></div>
      <div className="ue-style-grid">
        <label className="ue-style-wide">Kombinasi Header & Background
          <select value={`${document.theme.headerBackground || "#ffffff"}|${document.theme.background || "#f3f5f4"}|${document.theme.headerText || "#263238"}`} onChange={e=>{const [headerBg,pageBg,headerText]=e.target.value.split("|");updateTheme("headerBackground",headerBg);updateTheme("background",pageBg);updateTheme("headerText",headerText)}}>
            <option value="#ffffff|#f3f5f4|#263238">Clean Modern — Header Putih / Halaman Abu Terang</option>
            <option value="#ffffff|#eaf1e7|#263b2e">Botanical — Header Putih / Halaman Hijau Lembut</option>
            <option value="#fff9f0|#f1e5d4|#493c30">Warm Artisan — Header Krem / Halaman Beige</option>
            <option value="#20242b|#303640|#ffffff">Dark Elegant — Header Gelap / Halaman Arang</option>
            <option value="#0d5d5a|#edf5f3|#ffffff">Modern Teal — Header Teal / Halaman Mint</option>
          </select>
          <small>Warna header, teks navigasi, dan latar halaman dipasangkan agar tetap harmonis.</small>
        </label>
        <label>Warna utama<input type="color" value={document.theme.primary || "#174d3b"} onChange={e=>updateTheme("primary",e.target.value)}/></label>
        <label>Warna aksen<input type="color" value={document.theme.accent || "#d8b66a"} onChange={e=>updateTheme("accent",e.target.value)}/></label>
        <label>Background<input type="color" value={document.theme.background || "#f7f8f1"} onChange={e=>updateTheme("background",e.target.value)}/></label>
        <label>Warna teks<input type="color" value={document.theme.text || "#26372f"} onChange={e=>updateTheme("text",e.target.value)}/></label>
        <label className="ue-style-wide">Jenis huruf
          <select value={document.theme.fontFamily || "Arial, sans-serif"} onChange={e=>updateTheme("fontFamily",e.target.value)}>
            <optgroup label="Modern"><option value="Inter, Arial, sans-serif">Inter</option><option value="Lato, Arial, sans-serif">Lato</option><option value="Poppins, Arial, sans-serif">Poppins</option></optgroup>
            <optgroup label="Classic"><option value="Merriweather, Georgia, serif">Merriweather</option><option value="Playfair Display, Georgia, serif">Playfair Display</option></optgroup>
            <optgroup label="Rounded"><option value="Nunito, Arial, sans-serif">Nunito</option><option value="Quicksand, Arial, sans-serif">Quicksand</option></optgroup>
            <optgroup label="Display"><option value="Oswald, Impact, sans-serif">Oswald</option><option value="Bebas Neue, Impact, sans-serif">Bebas Neue</option></optgroup>
          </select>
        </label>
        <div className="ue-style-wide ue-font-style"><span>Gaya tulisan</span><div role="group" aria-label="Gaya tulisan">
          <button type="button" className={(document.theme.fontStyle||"normal")==="normal"?"is-active":""} onClick={()=>updateTheme("fontStyle","normal")}>Normal</button>
          <button type="button" className={document.theme.fontStyle==="bold"?"is-active":""} onClick={()=>updateTheme("fontStyle","bold")}>Bold</button>
          <button type="button" className={document.theme.fontStyle==="italic"?"is-active":""} onClick={()=>updateTheme("fontStyle","italic")}>Italic</button>
        </div></div>
        <div className="ue-background-picker">
          <div className="ue-background-title"><span>Foto background</span><small>Pilih foto dari perangkat Anda · Maksimal 8 MB</small></div>
          <div className="ue-background-controls">
            <label className="ue-upload-background">{document.theme.backgroundImage ? "Ganti Foto" : "Pilih Foto"}<input type="file" accept="image/*" disabled={busy} onChange={e=>{void uploadBackground(e.target.files?.[0]);e.currentTarget.value=""}}/></label>
            {document.theme.backgroundImage && <button type="button" className="ue-remove-background" onClick={()=>updateTheme("backgroundImage","")}>Hapus Foto</button>}
            {document.theme.backgroundImage && <img className="ue-background-thumb" src={document.theme.backgroundImage} alt="Preview background"/>}
          </div>
        </div>
        <label>Posisi foto<select value={document.theme.backgroundPosition || "center"} onChange={e=>updateTheme("backgroundPosition",e.target.value)}><option value="center">Tengah</option><option value="top">Atas</option><option value="bottom">Bawah</option><option value="left">Kiri</option><option value="right">Kanan</option></select></label>
        <label>Ukuran foto<select value={document.theme.backgroundSize || "cover"} onChange={e=>updateTheme("backgroundSize",e.target.value)}><option value="cover">Penuhi area</option><option value="contain">Tampilkan utuh</option><option value="auto">Ukuran asli</option></select></label>
        <label className="ue-style-wide ue-overlay-control">Kegelapan foto <strong>{Math.round(Number((document.theme.backgroundOverlay||"rgba(0, 0, 0, 0.35)").match(/([0-9.]+)\s*\)$/)?.[1]||0.35)*100)}%</strong>
          <input type="range" min="0" max="80" step="5" value={Math.round(Number((document.theme.backgroundOverlay||"rgba(0, 0, 0, 0.35)").match(/([0-9.]+)\s*\)$/)?.[1]||0.35)*100)} onChange={e=>updateTheme("backgroundOverlay",`rgba(0, 0, 0, ${Number(e.target.value)/100})`)}/>
          <small>Geser ke kiri agar foto lebih terang, ke kanan agar lebih gelap.</small>
        </label>
      </div>
    </section></details>}
      {workspaceTab==="gallery" && <div className="ue-tab-help"><strong>Gallery & Image</strong><p>Pilih gambar langsung pada live preview untuk membuka Image Editor. Anda dapat mengganti foto, mengatur zoom, menggeser posisi, dan menerapkan crop.</p><button type="button" onClick={()=>setWorkspaceVisible(false)}>Tampilkan area preview penuh</button></div>}
      {workspaceTab==="media" && <div className="ue-tab-help"><strong>Media & Contact</strong><p>Pilih bagian kontak, WhatsApp, Maps, atau video pada preview untuk mengedit elemen yang tersedia. Pengaturan ini tidak mengubah halaman lain.</p></div>}
      </div></section>}
    {!workspaceVisible && <button type="button" className="ue-reopen-workspace" onClick={()=>setWorkspaceVisible(true)} aria-label="Buka workspace editor">✎ <span>Editor</span></button>}
    <div className="ue-layout ue-visual-layout">
      <nav className="ue-section-nav" aria-label="Bagian website">
        {document.sections.filter(section=>section.visible).map(section=>{
          const navItems:Record<string,{icon:string;label:string}>= {header:{icon:"◉",label:"Identitas"},hero:{icon:"▣",label:"Hero"},about:{icon:"ⓘ",label:"Tentang"},services:{icon:"☷",label:"Layanan"},products:{icon:"◇",label:"Produk"},gallery:{icon:"▦",label:"Galeri"},contact:{icon:"✉",label:"Kontak"},location:{icon:"⌖",label:"Lokasi"}}
          const item=navItems[section.type]||{icon:"•",label:section.type}
          return <button key={section.id} type="button" title={item.label} aria-label={item.label} onClick={()=>{const node=window.document.getElementById(`ue-section-${section.id}`);node?.scrollIntoView({behavior:"smooth",block:"start"})}}><span aria-hidden="true">{item.icon}</span></button>
        })}
      </nav>
      <section className="ue-preview ue-canvas"><div className="ue-preview-head">AREA EDIT WEBSITE <span>{themeKey} · Klik elemen untuk mengubah</span></div><div className="ue-preview-frame"><UniversalRenderer document={document} editable={selectedGuide==="business-profile"} onSelectField={(path: string, fieldLabel: string, kind: "text" | "image" = "text")=>{setWorkspaceVisible(false);setActiveField({path,label:fieldLabel,kind});if(kind==="image")imageInputRef.current?.click()}}/></div></section>
    </div>
    {activeField && activeField.kind==="text" && <div className="ue-inline-editor" role="dialog" aria-label={`Edit ${activeField.label}`}><div><strong>{activeField.label}</strong><button type="button" onClick={()=>setActiveField(null)} aria-label="Tutup">×</button></div><textarea autoFocus rows={activeField.path==="introduction"||activeField.path==="about"||activeField.path.includes("description")?4:2} value={String(readPath(activeField.path)??"")} onChange={e=>updatePath(activeField.path,e.target.value)} /><small>Perubahan langsung terlihat pada tampilan website.</small></div>}
    {pendingImage && imagePreviewUrl && activeField && <div className="ue-crop-backdrop" role="dialog" aria-modal="true" aria-label="Atur crop foto">
      <div className="ue-crop-dialog"><div className="ue-crop-heading"><div><strong>Atur foto — {activeField.label}</strong><small>Foto asli tetap disimpan; pengaturan frame dapat diubah lagi.</small></div><button type="button" onClick={cancelImageCrop} aria-label="Tutup">×</button></div>
        <div className={`ue-crop-frame ${activeField.path.includes("logo")?"is-logo":activeField.path.includes("background")?"is-hero":"is-card"}`}><img src={imagePreviewUrl} alt="Pratinjau crop" style={{objectFit:activeField.path.includes("logo")?"contain":"cover",objectPosition:`${cropX}% ${cropY}%`,transform:activeField.path.includes("logo")?"none":`scale(${cropZoom})`,transformOrigin:"center center"}}/></div>
        <label className="ue-crop-control">Zoom <strong>{cropZoom.toFixed(1)}×</strong><input type="range" min="1" max="3" step="0.05" value={cropZoom} onChange={e=>setCropZoom(Number(e.target.value))}/></label>
        <label className="ue-crop-control">Geser horizontal <strong>{cropX}%</strong><input type="range" min="0" max="100" value={cropX} onChange={e=>setCropX(Number(e.target.value))}/></label>
        <label className="ue-crop-control">Geser vertikal <strong>{cropY}%</strong><input type="range" min="0" max="100" value={cropY} onChange={e=>setCropY(Number(e.target.value))}/></label>
        <div className="ue-crop-actions"><button type="button" className="ue-crop-reset" onClick={()=>{setCropZoom(1);setCropX(50);setCropY(50)}}>Reset</button><button type="button" disabled={busy} onClick={()=>void confirmInlineImage()}>{busy?"Mengunggah…":"Terapkan Foto"}</button></div>
      </div></div>}
    <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={e=>{uploadInlineImage(e.target.files?.[0]);e.currentTarget.value=""}} />
    {notice&&<p className="ue-notice" role="status">{notice}</p>}
    <style jsx>{`
      .ue-workspace-note{max-width:1500px;margin:14px auto;color:#b9c8b0;font-size:13px}.ue-section-nav{position:sticky;top:14px;display:flex;flex-direction:column;gap:8px;align-self:start;width:54px}.ue-section-nav button{display:grid;place-items:center;width:48px;height:48px;border:1px solid #34363d;border-radius:12px;background:#1c1d23;color:#e8e8eb;font-size:21px;cursor:pointer;transition:background .15s,border-color .15s}.ue-section-nav button:hover,.ue-section-nav button:focus-visible{border-color:#8bba72;background:#293126;outline:none}.ue-visual-layout{grid-template-columns:64px minmax(0,1fr)!important;align-items:start}.ue-canvas{position:relative;top:auto}.ue-canvas .ue-preview-frame{max-height:none;overflow:visible}.ue-inline-editor{position:fixed;z-index:100;left:50%;bottom:24px;transform:translateX(-50%);width:min(560px,calc(100vw - 28px));padding:14px;border:1px solid #8bba72;border-radius:12px;background:#202127;box-shadow:0 18px 60px #0009}.ue-inline-editor>div{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.ue-inline-editor button{border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer}.ue-inline-editor textarea{width:100%;box-sizing:border-box;background:#111216;color:#fff;border:1px solid #4b4d55;border-radius:8px;padding:10px;font:inherit}.ue-inline-editor small{display:block;color:#a1a1aa;margin-top:6px}.ue-style-panel>summary{cursor:pointer;color:#e8e8eb;font-weight:600}.ue-shell{min-height:100vh;background:#101114;color:#f4f4f5;padding:28px;}.ue-top{display:flex;justify-content:space-between;gap:20px;align-items:center;max-width:1500px;margin:auto}.ue-top small{color:#a1a1aa;letter-spacing:.12em}.ue-top h1{font-size:28px;margin:7px 0}.ue-top p,.ue-hint{color:#a1a1aa}.ue-actions{display:flex;gap:10px}.ue-actions button{border:1px solid #56604e;border-radius:8px;padding:11px 16px;background:#8bba72;color:#111;font-weight:700;cursor:pointer}.ue-actions button:disabled{opacity:.5}.ue-meta{max-width:1500px;margin:22px auto;display:grid;grid-template-columns:1fr 1fr 220px;gap:12px}.ue-meta label,.ue-field{display:flex;flex-direction:column;gap:7px;color:#c9c9ce;font-size:13px}.ue-meta input,.ue-meta select,.ue-field input,.ue-field textarea{width:100%;box-sizing:border-box;background:#202127;border:1px solid #41434b;border-radius:7px;padding:10px;color:#fff;font:inherit}.ue-slug{display:flex;align-items:center;gap:8px}.ue-slug span{white-space:nowrap;color:#a1a1aa}.ue-layout{max-width:1500px;margin:auto;display:grid;grid-template-columns:minmax(320px, .8fr) minmax(0,1.2fr);gap:18px;align-items:start}.ue-panel,.ue-preview{background:#1c1d23;border:1px solid #34363d;border-radius:12px;padding:18px;min-width:0}.ue-panel h2{margin:0}.ue-field{margin:15px 0}.ue-field small{color:#92939b}.ue-preview{position:sticky;top:12px}.ue-preview-head{font-size:11px;letter-spacing:.12em;color:#a1a1aa;display:flex;justify-content:space-between;margin-bottom:12px}.ue-preview-frame{background:white;color:#222;max-height:calc(100vh - 100px);overflow:auto;border-radius:8px}
       .ue-category-picker{max-width:1500px;margin:16px auto;padding:14px;border:1px solid #34363d;border-radius:12px;background:#191a20}
       .ue-category-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;color:#f4f4f5}
       .ue-category-heading p{margin:4px 0 0;color:#a1a1aa;font-size:12px}.ue-category-heading>span{font-size:10px;letter-spacing:.1em;color:#b8c5ad;white-space:nowrap}
       .ue-category-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
       .ue-category-card{display:flex;flex-direction:column;align-items:flex-start;gap:7px;min-width:0;min-height:90px;padding:11px;border:1px solid #41434b;border-radius:9px;background:#22242b;color:#f4f4f5;text-align:left;cursor:pointer}
       .ue-category-card:hover{border-color:#8bba72}.ue-category-card.is-selected{border:2px solid #8bba72;background:#293126;padding:10px}.ue-category-card:disabled{opacity:.6;cursor:wait}
       .ue-category-card strong{font-size:12px}.ue-category-card small{font-size:11px;line-height:1.4;color:#b8bac3}.ue-category-check{display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#383b42;color:#d8dbe0}.ue-category-card.is-selected .ue-category-check{background:#8bba72;color:#111}
       .ue-business-layouts{max-width:1500px;margin:0 auto 18px;padding:16px;border:1px solid #34363d;border-radius:12px;background:#191a20}.ue-business-layouts>div:first-child{display:flex;justify-content:space-between;align-items:baseline;gap:14px}.ue-business-layouts p{margin:5px 0 14px;color:#a1a1aa;font-size:12px}.ue-business-layout-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ue-business-layout-grid button{min-height:90px;padding:14px;border:1px solid #41434b;border-radius:9px;background:#22242b;color:#f4f4f5;text-align:left;cursor:pointer}.ue-business-layout-grid button:hover,.ue-business-layout-grid button.is-selected{border-color:#8bba72;background:#293126}.ue-business-layout-grid button.is-selected{box-shadow:inset 0 0 0 1px #8bba72}.ue-business-layout-grid strong,.ue-business-layout-grid small{display:block}.ue-business-layout-grid small{margin-top:7px;color:#b8bac3;line-height:1.4}@media(max-width:650px){.ue-business-layouts{padding:12px}.ue-business-layout-grid{grid-template-columns:1fr}.ue-business-layout-grid button{min-height:72px}}
       @media(max-width:900px){.ue-category-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
       @media(max-width:600px){.ue-category-picker{padding:11px;margin:12px auto}.ue-category-grid{display:flex;overflow-x:auto;gap:8px;padding-bottom:6px;scroll-snap-type:x mandatory}.ue-category-card{flex:0 0 190px;scroll-snap-align:start}.ue-category-heading{align-items:flex-start}.ue-category-heading p{max-width:240px}}
       .ue-style-panel{max-width:1500px;margin:0 auto 18px;padding:16px;border:1px solid #34363d;border-radius:12px;background:#1c1d23}
       .ue-style-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
       .ue-style-heading p{margin:5px 0 0;color:#a1a1aa;font-size:12px}
       .ue-style-heading>span{font-size:11px;color:#b8c5ad}
       .ue-style-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}
       .ue-style-grid>label,.ue-font-style{display:flex;flex-direction:column;gap:7px;color:#c9c9ce;font-size:12px;min-width:0}
       .ue-style-grid input:not([type="color"]):not([type="range"]),.ue-style-grid select{width:100%;min-width:0;box-sizing:border-box;background:#202127;border:1px solid #41434b;border-radius:7px;padding:10px;color:#fff;font:inherit}
       .ue-style-grid input[type="color"]{width:100%;height:40px;padding:4px;background:#202127;border:1px solid #41434b;border-radius:7px}
       .ue-style-wide{grid-column:1/-1}
       .ue-font-style>div{display:flex;gap:8px}
       .ue-font-style button,.ue-remove-background{border:1px solid #41434b;border-radius:7px;background:#252730;color:#e7e7eb;padding:9px 17px;cursor:pointer}
       .ue-font-style button.is-active{background:#8bba72;color:#111;border-color:#8bba72;font-weight:700}
       .ue-background-picker{grid-column:span 2;display:flex;flex-direction:column;gap:8px;min-width:0}
       .ue-background-title{display:flex;flex-direction:column;gap:4px;color:#c9c9ce;font-size:12px}
       .ue-background-title small,.ue-overlay-control small{color:#92939b;font-size:11px}
       .ue-background-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
       .ue-upload-background{display:inline-flex;align-items:center;padding:10px 15px;border-radius:7px;background:#8bba72;color:#111;font-weight:700;cursor:pointer}
       .ue-upload-background input{display:none}
       .ue-background-thumb{width:72px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #555}
       .ue-overlay-control{display:grid!important;grid-template-columns:1fr auto;align-items:center}
       .ue-overlay-control input{grid-column:1/-1;width:100%;accent-color:#8bba72}
       .ue-overlay-control small{grid-column:1/-1}

      .ue-crop-backdrop{position:fixed;inset:0;z-index:300;display:grid;place-items:center;padding:16px;background:#000b;backdrop-filter:blur(5px)}
      .ue-crop-dialog{width:min(520px,100%);max-height:min(92vh,850px);overflow:auto;padding:18px;border:1px solid #59634f;border-radius:16px;background:#1c1d23;color:#f4f4f5;box-shadow:0 24px 90px #000b}
      .ue-crop-heading{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.ue-crop-heading strong,.ue-crop-heading small{display:block}.ue-crop-heading small{margin-top:5px;color:#a1a1aa;font-size:12px}.ue-crop-heading button{border:0;background:transparent;color:#fff;font-size:28px;cursor:pointer}
      .ue-crop-frame{width:100%;max-height:360px;aspect-ratio:16/9;overflow:hidden;display:grid;place-items:center;background:#090a0d;border:1px solid #555;border-radius:10px;margin-bottom:16px}.ue-crop-frame.is-logo{aspect-ratio:1/1;max-width:280px;margin:0 auto 16px}.ue-crop-frame.is-card{aspect-ratio:4/3}.ue-crop-frame img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 50%;transform-origin:center;transition:transform .08s linear}.ue-crop-frame.is-logo img{object-fit:contain!important;transform:none!important}
      .ue-crop-control{display:grid;grid-template-columns:1fr auto;gap:8px;margin:12px 0;color:#ddd;font-size:13px}.ue-crop-control input{grid-column:1/-1;width:100%;accent-color:#8bba72}.ue-crop-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.ue-crop-actions button{border:1px solid #6b805e;border-radius:8px;padding:11px 16px;background:#8bba72;color:#111;font-weight:700;cursor:pointer}.ue-crop-actions .ue-crop-reset{background:transparent;color:#eee;border-color:#555}
       .ue-notice{max-width:1500px;margin:14px auto;color:#c9e8b7}@media(max-width:900px){.ue-visual-layout{grid-template-columns:1fr!important}.ue-section-nav{position:static;display:flex;flex-direction:row;overflow:auto;width:100%}.ue-section-nav button{flex:0 0 44px;width:44px;height:44px}.ue-top{align-items:flex-start;flex-direction:column}.ue-meta{grid-template-columns:1fr}.ue-layout{grid-template-columns:1fr}.ue-preview{position:static}.ue-shell{padding:16px}.ue-style-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      .ue-guide-picker{max-width:1500px;margin:20px auto 0;padding:16px;border:1px solid #34363d;border-radius:12px;background:#191a20}
      .ue-guide-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
      .ue-guide-heading strong{font-size:14px}.ue-guide-heading p{margin:4px 0 0;color:#a1a1aa;font-size:12px}.ue-guide-heading>span{font-size:10px;letter-spacing:.1em;color:#a1a1aa}
      .ue-guide-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}
      .ue-guide-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:7px;min-width:0;min-height:104px;padding:13px;border:1px solid #41434b;border-radius:9px;background:#22242b;color:#f4f4f5;text-align:left;cursor:pointer}
      .ue-guide-card:hover{border-color:#8bba72}.ue-guide-card.is-selected{border:2px solid #8bba72;background:#293126;padding:12px}
      .ue-guide-card strong{font-size:12px}.ue-guide-card small{color:#b8bac3;font-size:11px;line-height:1.45}
      .ue-guide-check{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#383b42;color:#d8dbe0;font-size:13px}
      .ue-guide-card.is-selected .ue-guide-check{background:#8bba72;color:#111}
      .ue-mobile-tabs{display:none}
      .ue-mobile-actions{display:none}
      .ue-panel{display:grid;grid-template-columns:minmax(0,1fr);align-content:start}
      .ue-field{min-width:0;width:100%;box-sizing:border-box}.ue-field input,.ue-field textarea{display:block;min-width:0;max-width:100%;line-height:1.5}
      .ue-field textarea{resize:vertical;white-space:pre-wrap;overflow-wrap:anywhere}
      .ue-layout{grid-template-columns:minmax(300px,.85fr) minmax(0,1.15fr)}
      @media(max-width:1100px){.ue-guide-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:900px){.ue-guide-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:720px){
        .ue-shell{padding:14px 12px 92px}
        .ue-top{gap:12px}
        .ue-top h1{font-size:23px;line-height:1.2}
        .ue-top p{font-size:13px;margin:5px 0 0}
        .ue-top .ue-actions{display:none}
        @media(max-width:560px){.ue-style-grid{grid-template-columns:1fr}.ue-style-wide,.ue-background-picker{grid-column:auto}.ue-style-heading{align-items:flex-start;flex-direction:column}}
       .ue-guide-picker{margin-top:14px;padding:12px}
        .ue-guide-grid{display:flex;overflow-x:auto;gap:8px;padding:1px 1px 7px;scroll-snap-type:x mandatory;overscroll-behavior-x:contain}
        .ue-guide-card{flex:0 0 min(78vw,245px);min-height:92px;scroll-snap-align:start;padding:11px}
        .ue-guide-card.is-selected{padding:10px}
        .ue-guide-card strong{font-size:13px}
        .ue-guide-card small{font-size:11px}
        .ue-guide-heading p{font-size:11px;max-width:250px}
        .ue-meta{grid-template-columns:1fr;gap:10px;margin:14px auto}
        .ue-meta label{gap:5px}
        .ue-meta input,.ue-meta select{min-height:43px}
        .ue-layout{display:block;margin-top:12px}
        .ue-mobile-tabs{display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:4px;background:#1c1d23;border:1px solid #34363d;border-radius:10px;margin:12px 0}
        .ue-mobile-tabs button{border:0;border-radius:7px;background:transparent;color:#b8bac3;padding:10px;font:inherit;font-size:13px;font-weight:600}
        .ue-mobile-tabs button.is-active{background:#8bba72;color:#111}
        .ue-mobile-hidden{display:none!important}
        .ue-panel,.ue-preview{padding:13px;border-radius:10px}
        .ue-panel h2{font-size:16px}
        .ue-hint{font-size:12px;line-height:1.5}
        .ue-field{margin:12px 0;font-size:13px}
        .ue-field input,.ue-field textarea{font-size:16px;padding:11px;min-height:43px}
        .ue-field textarea{min-height:92px}
        .ue-preview{position:static;margin:0}
        .ue-preview-frame{max-height:none;min-height:65vh;overflow:auto}
        .ue-mobile-actions{position:fixed;z-index:50;left:0;right:0;bottom:0;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:rgba(16,17,20,.96);border-top:1px solid #34363d;backdrop-filter:blur(12px)}
        .ue-mobile-actions button{min-height:44px;border:1px solid #56604e;border-radius:8px;padding:10px 8px;background:#8bba72;color:#111;font-weight:700;font-size:12px}
        .ue-mobile-actions button:disabled{opacity:.5}
        .ue-notice{font-size:12px;margin-bottom:10px}
      }
      .ue-style-panel{max-width:1500px;margin:12px auto 18px;padding:16px;border:1px solid #34363d;border-radius:12px;background:#191a20}
      .ue-style-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
      .ue-style-heading strong{font-size:14px}.ue-style-heading p{margin:4px 0 0;color:#a1a1aa;font-size:12px}.ue-style-heading>span{font-size:11px;color:#cbd5c0}
      .ue-style-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      .ue-style-grid label{display:flex;flex-direction:column;gap:6px;color:#c9c9ce;font-size:12px;min-width:0}
      .ue-style-grid input,.ue-style-grid select{box-sizing:border-box;width:100%;min-width:0;min-height:40px;border:1px solid #41434b;border-radius:7px;background:#202127;color:#fff;padding:8px;font:inherit}
      .ue-style-grid input[type="color"]{padding:4px;height:40px}
      .ue-style-grid small{color:#92939b;font-size:10px;line-height:1.4}.ue-style-wide{grid-column:span 2}
      @media(max-width:720px){.ue-style-panel{padding:12px;margin:12px auto}.ue-style-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ue-style-wide{grid-column:1/-1}.ue-style-grid input,.ue-style-grid select{min-height:43px;font-size:14px}}
      .ue-persistent-bar{position:sticky;top:0;z-index:120;max-width:none;width:100%;box-sizing:border-box;padding:10px max(18px,calc((100vw - 1500px)/2));margin:-28px 0 14px;background:rgba(16,17,20,.96);border-bottom:1px solid #34363d;backdrop-filter:blur(14px)}
      .ue-persistent-bar .ue-brand h1{font-size:20px;margin:2px 0}.ue-persistent-bar .ue-brand p{font-size:11px;margin:0}.ue-persistent-bar .ue-actions{flex-wrap:nowrap}.ue-persistent-bar .ue-actions button{white-space:nowrap;min-height:40px;padding:9px 13px}.ue-persistent-bar .ue-dashboard{background:#252832;color:#f4f4f5;border-color:#454956}
      .ue-floating-workspace{position:fixed;z-index:110;left:50%;bottom:14px;transform:translateX(-50%);width:min(1100px,calc(100vw - 32px));max-height:60vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid #59616d;border-radius:15px;background:rgba(25,27,33,.97);box-shadow:0 18px 70px #000b;backdrop-filter:blur(18px)}
      .ue-workspace-tabs{flex:0 0 auto;display:flex;align-items:stretch;gap:5px;padding:8px;border-bottom:1px solid #3c414b}.ue-workspace-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-width:76px;padding:9px 13px;border:1px solid transparent;border-radius:9px;background:transparent;color:#cbd0d8;font:inherit;cursor:pointer}.ue-workspace-tabs button span{font-size:18px}.ue-workspace-tabs button small{font-size:11px}.ue-workspace-tabs button.is-active{background:#303b2d;border-color:#718b62;color:#e6f4dc}.ue-workspace-tabs .ue-workspace-hide{margin-left:auto;min-width:38px;font-size:22px}.ue-workspace-body{overflow:auto;padding:4px 14px 12px;overscroll-behavior:contain}.ue-workspace-body .ue-category-picker,.ue-workspace-body .ue-business-layouts,.ue-workspace-body .ue-style-panel{max-width:none;margin:8px 0;padding:10px}.ue-workspace-body .ue-category-heading{margin-bottom:8px}.ue-workspace-body .ue-category-card{min-height:65px}.ue-workspace-body .ue-meta{max-width:none;margin:8px 0;grid-template-columns:1fr 1fr 180px}.ue-tab-help{padding:16px;color:#e7e9ee}.ue-tab-help p{max-width:720px;color:#b7bec9;font-size:13px;line-height:1.55}.ue-tab-help button{border:1px solid #56604e;border-radius:8px;padding:9px 12px;background:#8bba72;color:#111;font-weight:700}.ue-reopen-workspace{position:fixed;z-index:111;left:50%;bottom:14px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:11px 18px;border:1px solid #718b62;border-radius:999px;background:#202a1e;color:#e6f4dc;box-shadow:0 8px 30px #0009;font-weight:700;cursor:pointer}
      .ue-layout.ue-visual-layout{display:block!important;max-width:1500px;margin:14px auto 0}.ue-section-nav{display:none!important}.ue-canvas{width:100%;box-sizing:border-box}.ue-preview-frame{max-height:none!important;overflow:visible!important}
      @media(max-width:720px){.ue-persistent-bar{margin:-16px 0 10px;padding:9px 10px;gap:8px;align-items:center}.ue-persistent-bar .ue-brand h1{font-size:16px}.ue-persistent-bar .ue-brand small{font-size:8px}.ue-persistent-bar .ue-brand p{display:none}.ue-persistent-bar .ue-actions{gap:5px}.ue-persistent-bar .ue-actions button{min-height:37px;padding:7px 8px;font-size:11px}.ue-persistent-bar .ue-actions button span{display:none}.ue-floating-workspace{width:calc(100vw - 16px);bottom:calc(8px + env(safe-area-inset-bottom));max-height:60vh;border-radius:13px}.ue-workspace-tabs{gap:2px;padding:6px}.ue-workspace-tabs button{min-width:0;flex:1;flex-direction:column;gap:2px;padding:7px 3px}.ue-workspace-tabs button span{font-size:17px}.ue-workspace-tabs button small{font-size:9px}.ue-workspace-tabs .ue-workspace-hide{flex:0 0 34px;margin-left:0}.ue-workspace-body{padding:3px 8px 9px}.ue-workspace-body .ue-meta{grid-template-columns:1fr}.ue-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ue-category-card{min-height:72px}.ue-category-card small{font-size:10px}.ue-business-layout-grid{grid-template-columns:1fr}.ue-canvas{padding:8px}.ue-preview-frame{min-height:55vh}}
      @media(max-width:380px){
        .ue-shell{padding-left:9px;padding-right:9px}
        .ue-top h1{font-size:21px}
        .ue-guide-card{flex-basis:82vw}
        .ue-slug{gap:5px}
        .ue-slug span{font-size:11px}
      }
    `}</style>
  </main>
}
