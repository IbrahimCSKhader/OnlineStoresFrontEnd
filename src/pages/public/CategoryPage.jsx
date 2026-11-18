import { useParams } from "react-router-dom";
import ProductsPage from "./ProductsPage.jsx";

export default function CategoryPage() {
  const { slug, categoryId } = useParams();
  return <ProductsPage key={`${slug}:${categoryId}`} categoryId={categoryId} />;
}
