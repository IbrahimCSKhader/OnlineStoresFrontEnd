import LocationOnRounded from "@mui/icons-material/LocationOnRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import { branchMap } from "../../utils/branchMap.js";
import { Navigate, useParams } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";

export default function StoreLocations() {
 const { slug } = useParams();
 const { t, language } = useStorefrontLanguage();
 const { buildStorePreviewPath } = useOwnerStorePreview();
 const query = useStoreBySlug(slug, { language });
 const store = normalizeEntityResponse(query.data);
 useStoreBranding(store);
 if (query.isLoading) return <EmptyState title={t("جاري التحميل...")} />;
 if (query.error || !store) return <EmptyState title={t("تعذر فتح الصفحة")} />;
 if (store.appearance?.sections?.showLocations !== true) return <Navigate replace to={buildStorePreviewPath(buildStorefrontPath(store.slug || slug))} />;
 const branches = store.appearance.sections.locations || [];
 return <Box className="storefront-page" sx={{display:"grid",gap:3}}>
  <SurfaceCard variant="hero">
   <Typography component="h1" variant="h2">{{A:"المواقع",E:"Locations",I:"סניפים"}[language] || "المواقع"}</Typography>
   <Typography variant="h5" sx={{mt:2}}>{store.name}</Typography>
   <Typography sx={{mt:2}}>يسعدنا استقبالكم في فروعنا</Typography>
  </SurfaceCard>
  <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"repeat(2, minmax(0, 1fr))"},gap:3}}>
   {branches.map((branch,index)=>{ const map = branchMap(branch); return <SurfaceCard component="section" key={index} sx={{overflow:"hidden",p:{xs:2,md:3}}}>
    <Stack spacing={2}>
     <Stack direction="row" spacing={1} alignItems="center"><LocationOnRounded color="primary"/><Typography component="h2" variant="h4">{branch.name}</Typography></Stack>
     <Box sx={{borderRadius:3,overflow:"hidden",border:1,borderColor:"divider",bgcolor:"action.hover"}}>
      <Box component="iframe" title={`خريطة ${branch.name}`} src={map.embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen sx={{display:"block",width:"100%",height:{xs:240,md:300},border:0}} />
      <Stack direction="row" alignItems="center" spacing={1} sx={{px:2,py:1.25,bgcolor:"background.paper"}}><LocationOnRounded color="primary" fontSize="small"/><Typography variant="body2">موقع الفرع على الخريطة</Typography></Stack>
     </Box>
     <Typography color="text.secondary">📍 {branch.address}</Typography>
     {branch.phone && <Typography component="a" href={`tel:${branch.phone.replace(/[^+0-9]/g, "")}`}>هاتف: <bdi>{branch.phone}</bdi></Typography>}
     {branch.whatsApp && <Typography component="a" href={`https://wa.me/${branch.whatsApp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">واتساب: <bdi>{branch.whatsApp.startsWith("972") ? "0"+branch.whatsApp.slice(3) : branch.whatsApp}</bdi></Typography>}
     <AppButton component="a" variant="contained" href={map.href} endIcon={<OpenInNewRounded/>} target="_blank" rel="noopener noreferrer">فتح الموقع على خرائط Google</AppButton>
    </Stack>
   </SurfaceCard>;})}
  </Box>
  <Typography color="text.secondary">{store.slug === "jubeh-office-furniture" ? "نسعد بزيارتكم لمعارضنا أو تصفح متجرنا الإلكتروني لاكتشاف تشكيلتنا المتنوعة واختيار الأثاث الأنسب لاحتياجاتكم." : "نسعد بزيارتكم لفروعنا أو تصفح متجرنا الإلكتروني."}</Typography>
 </Box>;
}
