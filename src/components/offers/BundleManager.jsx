import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import AppButton from "../common/buttons/AppButton.jsx";
import SurfaceCard from "../common/cards/SurfaceCard.jsx";
import useOffers from "../../hooks/offers/useOffers.js";
import { offerApi } from "../../API/offer.api.js";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import { getProductImage } from "../../utils/products.js";
import extractApiError from "../../utils/extractApiError.js";
import formatCurrency from "../../utils/formatCurrency.js";
import "./Offers.css";
const empty = () => ({ name: "", description: "", bundlePrice: "", isActive: true, items: {} });
export default function BundleManager({ storeId, products = [] }) {
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [validation, setValidation] = useState("");
  const [pendingDelete, setPendingDelete] = useState("");
  const query = useOffers(storeId, true);
  const cache = useQueryClient();
  const refresh = () => cache.invalidateQueries({ queryKey: ["offers", storeId] });
  const save = useMutation({ mutationFn: ({ id, payload }) => id ? offerApi.update(id, payload) : offerApi.create(payload),
    onSuccess: () => { refresh(); setForm(empty()); setEditing(null); setValidation(""); } });
  const remove = useMutation({ mutationFn: offerApi.remove, onSuccess: () => { refresh(); setPendingDelete(""); } });
  const toggle = useMutation({ mutationFn: offer => offerApi.update(offer.id, { isActive: !offer.isActive }), onSuccess: refresh });
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const submit = event => {
    event.preventDefault();
    const items = Object.entries(form.items).map(([productId, requiredQuantity]) => ({ productId, requiredQuantity: Number(requiredQuantity) }));
    if (!items.length) { setValidation("اختر منتجاً واحداً على الأقل"); return; }
    if (items.some(i => !Number.isInteger(i.requiredQuantity) || i.requiredQuantity < 1)) { setValidation("كمية كل منتج يجب أن تكون عدداً صحيحاً أكبر من صفر"); return; }
    setValidation("");
    save.mutate({ id: editing?.id, payload: { storeId, name: form.name.trim(), description: form.description,
      bundlePrice: Number(form.bundlePrice), type: 1, isActive: form.isActive,
      startDate: editing?.startDate || new Date().toISOString(), items } });
  };
  const edit = offer => {
    setEditing(offer); setForm({ name: offer.name, description: offer.description || "", bundlePrice: offer.bundlePrice,
      isActive: offer.isActive, items: Object.fromEntries(offer.items.map(i => [i.productId, i.requiredQuantity])) });
    document.getElementById("bundle-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const bundles = (query.data || []).filter(o => Number(o.type) === 1);
  const visible = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
  return <section>
    <h2>عروضات المتجر والباكيجات</h2><p>اختر منتجاً أو عدة منتجات، وحدد الكميات والسعر النهائي للباكيج كامل.</p>
    {query.isError && <Alert severity="error">{extractApiError(query.error)}</Alert>}
    {[save, remove, toggle].filter(m => m.isError).map((m, i) => <Alert severity="error" key={i}>{extractApiError(m.error)}</Alert>)}
    {save.isSuccess && <Alert severity="success">تم حفظ الباكيج</Alert>}
    <SurfaceCard><form id="bundle-editor" className="bundle-editor" onSubmit={submit}>
      <h3>{editing ? "تعديل الباكيج" : "إنشاء باكيج جديد"}</h3>
      <TextField label="اسم الباكيج" required value={form.name} inputProps={{ maxLength: 180 }} onChange={e => update("name", e.target.value)} />
      <TextField label="وصف العرض" multiline value={form.description} inputProps={{ maxLength: 1000 }} onChange={e => update("description", e.target.value)} />
      <TextField label="سعر الباكيج كامل" type="number" required value={form.bundlePrice} inputProps={{ min: 0.01, step: 0.01 }} onChange={e => update("bundlePrice", e.target.value)} />
      <FormControlLabel control={<Switch checked={form.isActive} onChange={e => update("isActive", e.target.checked)} />} label="العرض فعال" />
      <TextField label="ابحث عن منتج" value={search} onChange={e => setSearch(e.target.value)} />
      <p>المنتجات المحددة: {Object.keys(form.items).length}</p>
      <div className="bundle-editor__products">{visible.map(product => <div className="bundle-editor__row" key={product.id}>
        <input id={`bundle-product-${product.id}`} type="checkbox" checked={Object.hasOwn(form.items, product.id)} onChange={e => {
          const items = { ...form.items }; if (e.target.checked) items[product.id] = 1; else delete items[product.id]; update("items", items);
        }} />
        {getProductImage(product) && <img src={resolveAssetUrl(getProductImage(product))} alt="" />}
        <label htmlFor={`bundle-product-${product.id}`}>{product.name}</label>
        {Object.hasOwn(form.items, product.id) && <input aria-label={`كمية ${product.name}`} type="number" min="1" step="1" required value={form.items[product.id]} onChange={e => update("items", { ...form.items, [product.id]: e.target.value })} />}
      </div>)}</div>
      {!products.length && <Alert severity="info">أضف منتجات للمتجر أولاً لإنشاء باكيج.</Alert>}
      {validation && <Alert severity="error">{validation}</Alert>}
      <div className="bundle-manager__actions"><AppButton type="submit" variant="contained" disabled={save.isPending || !products.length}>{save.isPending ? "جارٍ الحفظ..." : "حفظ الباكيج"}</AppButton>
      {editing && <AppButton onClick={() => { setEditing(null); setForm(empty()); }}>إلغاء التعديل</AppButton>}</div>
    </form></SurfaceCard>
    <div className="bundle-manager__list">{bundles.map(offer => <article key={offer.id} className="bundle-manager__item">
      <h3>{offer.name} <small>({offer.isActive ? "فعال" : "متوقف"})</small></h3><strong>{formatCurrency(offer.bundlePrice)}</strong>
      <p>{offer.items.map(i => `${i.productName} × ${i.requiredQuantity}`).join(" + ")}</p>
      <div className="bundle-manager__actions"><AppButton onClick={() => edit(offer)}>تعديل</AppButton><AppButton disabled={toggle.isPending} onClick={() => toggle.mutate(offer)}>{offer.isActive ? "إيقاف" : "تفعيل"}</AppButton>
        {pendingDelete === offer.id ? <><AppButton color="error" disabled={remove.isPending} onClick={() => remove.mutate(offer.id)}>تأكيد حذف الباكيج</AppButton><AppButton onClick={() => setPendingDelete("")}>إلغاء</AppButton></> : <AppButton color="error" onClick={() => setPendingDelete(offer.id)}>حذف</AppButton>}
      </div>
    </article>)}</div>
  </section>;
}
