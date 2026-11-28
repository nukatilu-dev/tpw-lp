 "use client"
import { useEffect, useMemo, useState } from "react"
import { makeGuideContent } from "@/components/templates/template-preview-gallery"
import type { TemplateKey } from "@/lib/templates/registry"
import { THEME_PRESETS, type ThemeKey } from "@/lib/templates/themes"
const KEYS:TemplateKey[]=["business-profile","personal-cv","digital-menu","product-catalog","creative-portfolio"]
const NAMES:Record<TemplateKey,string>={"business-profile":"Business Profile — TPW Tahu Hejo","personal-cv":"Virtual Artist Profile — Leeloo TPW","digital-menu":"Digital Menu — Kedai Kopi TPW","product-catalog":"Product Catalog — Katalog Produk TPW","creative-portfolio":"Creative Portfolio — Kreatif Sendiri TPW"}
const DEFAULT_THEMES:Record<TemplateKey,ThemeKey>={"business-profile":"botanical","personal-cv":"expedition","digital-menu":"coffeehouse","product-catalog":"showcase","creative-portfolio":"editorial"}
export default function TemplateGuideEditor() {
 const [selected,setSelected]=useState<TemplateKey>(KEYS[0])
 const fallback=useMemo(()=>makeGuideContent(selected),[selected])
 const [jsonText,setJsonText]=useState("")
 const [themeKey,setThemeKey]=useState<ThemeKey>(DEFAULT_THEMES[KEYS[0]])
 const [loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState("")
 useEffect(()=>{
  let active=true; setLoading(true);setMessage("")
  fetch(`/api/admin/template-guides?key=${encodeURIComponent(selected)}`,{cache:"no-store"})
   .then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error||"Gagal membaca guide.");if(!active)return
    const c=p.guide?.content??fallback;setJsonText(JSON.stringify(c,null,2));setThemeKey(p.guide?.theme_key??DEFAULT_THEMES[selected])
   }).catch(e=>{if(active){setJsonText(JSON.stringify(fallback,null,2));setThemeKey(DEFAULT_THEMES[selected]);setMessage(e instanceof Error?e.message:"Gagal membaca guide.")}})
   .finally(()=>{if(active)setLoading(false)})
  return ()=>{active=false}
 },[selected,fallback])
 async function save(){
  let content:unknown
  try{content=JSON.parse(jsonText)}catch{setMessage("JSON belum valid.");return}
  if(!content||typeof content!=="object"||Array.isArray(content)){setMessage("Konten harus berupa objek JSON.");return}
  setSaving(true);setMessage("")
  try{const r=await fetch("/api/admin/template-guides",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({templateKey:selected,themeKey,content})});const p=await r.json();if(!r.ok)throw new Error(p.error||"Gagal menyimpan.");setJsonText(JSON.stringify(p.guide.content,null,2));setMessage("Perubahan master guide berhasil disimpan.")}
  catch(e){setMessage(e instanceof Error?e.message:"Gagal menyimpan.")}finally{setSaving(false)}
 }
 return <main style={{minHeight:"100vh",background:"#101114",color:"#f4f4f5",padding:24}}><div style={{maxWidth:1100,margin:"0 auto"}}>
  <a href="/admin" style={{color:"#aaa"}}>← Kembali ke Admin</a><h1>Master Template Guide Editor</h1>
  <p style={{color:"#aaa"}}>Perubahan master tidak menimpa website pelanggan yang sudah dibuat.</p>
  <div style={{display:"grid",gridTemplateColumns:"minmax(210px,.7fr) minmax(0,1.6fr)",gap:20,alignItems:"start"}}>
   <aside style={{display:"grid",gap:8}}>{KEYS.map(k=><button key={k} onClick={()=>setSelected(k)} style={{padding:13,textAlign:"left",borderRadius:8,border:selected===k?"1px solid #7caa91":"1px solid #383a42",background:selected===k?"#26372f":"#1c1d22",color:"#fff"}}>{NAMES[k]}</button>)}</aside>
   <section style={{display:"grid",gap:12}}>
    <label style={{display:"grid",gap:7}}>Tema visual<select value={themeKey} onChange={e=>setThemeKey(e.target.value as ThemeKey)} style={{padding:11,background:"#25262d",color:"#fff",borderRadius:8}}>{THEME_PRESETS.map(t=><option key={t.key} value={t.key}>{t.name}</option>)}</select></label>
    <label style={{display:"grid",gap:7}}>Konten guide (JSON)<textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} spellCheck={false} style={{width:"100%",minHeight:520,boxSizing:"border-box",padding:14,borderRadius:9,background:"#191a1f",color:"#eee",fontFamily:"monospace",fontSize:13,lineHeight:1.55}}/></label>
    {message&&<p role="status" style={{color:message.includes("berhasil")?"#86c99c":"#f0b27a"}}>{message}</p>}
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button disabled={loading||saving} onClick={save} style={{padding:"11px 18px",border:0,borderRadius:8,background:"#397452",color:"#fff"}}>{saving?"Menyimpan...":"Simpan Master Guide"}</button><a href="/dashboard/template-preview" style={{padding:11,color:"#fff"}}>Buka Preview</a></div>
    {loading&&<p>Memuat data guide...</p>}
   </section>
  </div>
 </div></main>
}
