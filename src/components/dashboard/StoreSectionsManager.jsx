import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Stack, TextField, MenuItem, Switch, FormControlLabel } from "@mui/material";
import api from "../../API/axiosInstance.js";
import useOffers from "../../hooks/offers/useOffers.js";
import { exclusive } from "../../utils/offerPresentation.js";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import extractApiError from "../../utils/extractApiError.js";
import "../offers/OfferGallery.css";
const languages = [["A", "العربية"], ["E", "الإنجليزية"], ["I", "العبرية"]];
function Editor({ storeId, initial, offers }) {
 const [draft, setDraft] = useState(initial);
 const [offerId, setOfferId] = useState(initial.premiumOfferId || offers[0]?.id || "");
 const [error, setError] = useState("");
 const cache = useQueryClient();
 const endpoint = `/api/Store/${storeId}/sections-settings`;
 const change = (key,value) => setDraft(d => ({...d,[key]:value}));
 const presentation = draft.offers?.[offerId] || {images:[],title:{},badge:{}};
 const editOffer = (key,value) => setDraft(d => ({...d,offers:{...d.offers,[offerId]:{...(d.offers?.[offerId] || {images:[],title:{},badge:{}}),[key]:value}}}));
 const save = useMutation({mutationFn:()=>api.put(endpoint,{...draft, premiumOfferId: offers.some(o=>o.id===draft.premiumOfferId) ? draft.premiumOfferId : null, offers:Object.fromEntries(Object.entries(draft.offers || {}).filter(([id])=>offers.some(o=>o.id===id)))}),onSuccess:()=>cache.invalidateQueries({predicate:q=>!q.queryKey.includes("sections-settings")})});
 const upload = useMutation({mutationFn:async files=>{
  if(presentation.images.length + files.length > 12) throw new Error("الحد الأقصى 12 صورة لكل عرض");
  for(const file of files){
   const body=new FormData();body.append("image",file);
   const response=await api.post(endpoint+"/images",body,{headers:{"Content-Type":"multipart/form-data"}});
   setDraft(d=>{const current=d.offers?.[offerId] || {images:[],title:{},badge:{}};return {...d,offers:{...d.offers,[offerId]:{...current,images:[...current.images,response.url]}}};});
  }
 }});
 return <Stack spacing={3} className="owner-panel">
  <h2>أقسام الواجهة والبريميوم</h2>
  {[["showCover","إظهار صورة الكوفر"],["showFeaturedProducts","إظهار مختارات المتجر"],["premiumEnabled","إظهار قسم البريميوم"]].map(([key,label])=><FormControlLabel key={key} label={label} control={<Switch checked={draft[key] !== false} onChange={e=>change(key,e.target.checked)}/>}/>)}
  <FormControlLabel label="إظهار صفحة المواقع في الهيدر" control={<Switch checked={draft.showLocations === true} onChange={e=>change("showLocations",e.target.checked)}/>} />
  <h3>مواقع الفروع</h3>
  {(draft.locations || []).map((branch,index)=><Stack key={index} spacing={2}>
   {[["name","اسم الفرع",180],["address","العنوان",500],["mapUrl","رابط الموقع على Google Maps",2000],["phone","الهاتف",30],["whatsApp","واتساب مع رمز الدولة (مثال: 972528601833)",15]].map(([key,label,maxLength])=><TextField key={key} label={label} value={branch[key] || ""} inputProps={{maxLength}} onChange={e=>change("locations",draft.locations.map((item,i)=>i===index ? {...item,[key]:e.target.value} : item))}/>)}
   <Button color="error" onClick={()=>change("locations",draft.locations.filter((_,i)=>i!==index))}>إزالة الفرع</Button>
  </Stack>)}
  <Button disabled={(draft.locations || []).length >= 20} onClick={()=>change("locations",[...(draft.locations || []),{name:"",address:"",phone:"",whatsApp:""}])}>إضافة فرع</Button>
  <h3>عنوان العروضات</h3>
  {languages.map(([code,label])=><TextField key={code} label={`عنوان العروضات — ${label}`} value={draft.offersHeading?.[code] ?? exclusive[code]} inputProps={{maxLength:180}} onChange={e=>change("offersHeading",{...exclusive,...draft.offersHeading,[code]:e.target.value})}/>)}
  <TextField select label="العرض الخاص بقسم البريميوم" value={draft.premiumOfferId || ""} onChange={e=>change("premiumOfferId",e.target.value || null)}><MenuItem value="">اختيار تلقائي من العروض المميزة</MenuItem>{offers.map(o=><MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}</TextField>
  <h3>صور ونصوص العرض</h3>
  <TextField select label="اختر العرض لتعديل صوره ونصوصه" value={offerId} disabled={upload.isPending} onChange={e=>setOfferId(e.target.value)}>{offers.map(o=><MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}</TextField>
  {!offers.length && <Alert severity="info">أنشئ عرضًا من النموذج أدناه ثم اختره لإضافة الصور والنصوص.</Alert>}
  {offerId && <>
   <p>أول صورة هي الرئيسية. يمكنك اختيار الصورة الرئيسية وإزالة الصور الفرعية.</p>
   <Button component="label" disabled={upload.isPending}>{upload.isPending ? "جارٍ رفع الصور..." : "إضافة صور"}<input hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{setError("");upload.mutate(Array.from(e.target.files));e.target.value="";}}/></Button>
   <div className="offer-gallery__thumbs">{presentation.images.map((url,index)=><div key={url}><img src={resolveAssetUrl(url)} alt=""/><Button disabled={upload.isPending} onClick={()=>editOffer("images",[url,...presentation.images.filter(x=>x!==url)])}>{index===0 ? "الرئيسية" : "اجعلها رئيسية"}</Button><Button disabled={upload.isPending} color="error" onClick={()=>editOffer("images",presentation.images.filter(x=>x!==url))}>إزالة</Button></div>)}</div>
   {languages.map(([code,label])=><Stack spacing={2} key={code}><TextField label={`عنوان العرض — ${label}`} value={presentation.title?.[code] || ""} inputProps={{maxLength:180}} onChange={e=>editOffer("title",{...presentation.title,[code]:e.target.value})}/><TextField label={`الشارة — ${label}`} value={presentation.badge?.[code] ?? exclusive[code]} inputProps={{maxLength:180}} onChange={e=>editOffer("badge",{...exclusive,...presentation.badge,[code]:e.target.value})}/></Stack>)}
   <TextField label="لون العنوان (فارغ لاستخدام الثيم)" placeholder="#006644" value={presentation.titleColor || ""} onChange={e=>editOffer("titleColor",e.target.value)}/>
  </>}
  {[save,upload].filter(x=>x.isError).map((x,i)=><Alert key={i} severity="error">{extractApiError(x.error)}</Alert>)}
  {error && <Alert severity="error">{error}</Alert>}{save.isSuccess && <Alert severity="success">تم حفظ إعدادات الأقسام</Alert>}
  <Button variant="contained" disabled={save.isPending || upload.isPending} onClick={()=>{if(Object.values(draft.offers || {}).some(x=>x.titleColor && !/^#[0-9a-f]{6}$/i.test(x.titleColor))){setError("أدخل اللون بصيغة #RRGGBB");return;}save.mutate();}}>حفظ إعدادات الأقسام</Button>
 </Stack>;
}
export default function StoreSectionsManager({storeId}) {
 const query=useQuery({queryKey:["sections-settings",storeId],queryFn:()=>api.get(`/api/Store/${storeId}/sections-settings`),enabled:!!storeId});
 const offers=useOffers(storeId,true);
 if(query.isError || offers.isError) return <Alert severity="error">{extractApiError(query.error || offers.error)}</Alert>;
 if(!query.data || offers.isLoading) return <p>جارٍ التحميل...</p>;
 return <Editor key={storeId} storeId={storeId} initial={query.data} offers={(offers.data || []).filter(o=>Number(o.type)===1)}/>;
}
