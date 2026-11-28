import { Link } from "react-router-dom";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import KeyboardDoubleArrowDownRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowDownRounded";
import { resolveAssetUrl, resolveStoreLogoUrl } from "../../utils/assetUrl.js";
import { getProductImage } from "../../utils/products.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";

export default function AlaaHero({ store, products, buildPath }) {
  const path = (suffix = "") => buildPath(buildStorefrontPath(store.slug, suffix));
  const books = products.filter(p => getProductImage(p)).slice(0, 4);
  return <>
    <section className="alaa-hero">
      <div className="alaa-hero__top">
        <Link to={path()} aria-label={store.name}><img className="alaa-hero__logo" src={resolveStoreLogoUrl(store)} alt={store.name} /></Link>
        <div className="alaa-hero__tools">
          <a href="#store-catalog" aria-label="ابحث عن كتاب"><SearchOutlinedIcon /></a>
          {!store.isCatalog && <Link to={path("/cart")} aria-label="سلة المشتريات"><ShoppingCartOutlinedIcon /></Link>}
        </div>
      </div>
      <div className="alaa-hero__content">
        <div className="alaa-hero__copy">
          <p className="alaa-hero__intro">كل الكتب التي تبحث عنها في</p>
          <h1>مكتبة <span>الاء روب</span></h1>
          <p className="alaa-hero__description">{store.description}</p>
        </div>
        {books.length > 0 && <div className="alaa-hero__releases">
          <h2><span>NEW!</span> أحدث إصدارات الاء روب</h2>
          <div className="alaa-hero__books">{books.map(book => <Link key={book.id} to={path(`/product/${book.id}`)} aria-label={book.name}>
            <img src={resolveAssetUrl(getProductImage(book))} alt={book.name} decoding="async" />
          </Link>)}</div>
        </div>}
      </div>
      <a className="alaa-hero__down" href="#store-catalog" aria-label="تصفح الإصدارات"><KeyboardDoubleArrowDownRoundedIcon /></a>
    </section>
    <section className="alaa-promos" aria-label="اكتشف المكتبة">
      <Link to={path("/products")} className={`alaa-promo${books.length ? " alaa-promo--illustrated" : ""}`}>{books.length > 0 && <img src={resolveAssetUrl(getProductImage(books[0]))} alt="" loading="lazy" />}<span>إصدارات الاء روب</span><h2>اختر كتابك القادم</h2><p>تصفّح الكتب واكتشف حكاية جديدة</p><b>تصفّح الإصدارات ←</b></Link>
      <a href="#alaa-author" className="alaa-promo alaa-promo--green"><span>من قلم الاء</span><h2>كلمات تلامس القلب</h2><p>تعرّف على الكاتبة وإصداراتها</p><b>عن الكاتبة ←</b></a>
    </section>
  </>;
}
