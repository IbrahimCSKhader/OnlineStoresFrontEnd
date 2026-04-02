/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from "react";
import Box from "@mui/material/Box";
import { createBrowserRouter } from "react-router-dom";
import LoadingState from "./components/common/loaders/LoadingState.jsx";
import MainLayout from "./layout/MainLayout.jsx";

const Home = lazy(() => import("./pages/Home/Home.jsx"));
const About = lazy(() => import("./pages/About/About.jsx"));
const Market = lazy(() => import("./pages/Market/Market.jsx"));
const Contact = lazy(() => import("./pages/Contact/Contact.jsx"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound.jsx"));
const Login = lazy(() => import("./pages/auth/Login.jsx"));
const Register = lazy(() => import("./pages/auth/Register.jsx"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail.jsx"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const Cart = lazy(() => import("./pages/customer/Cart.jsx"));
const Checkout = lazy(() => import("./pages/customer/Checkout.jsx"));
const CategoryPage = lazy(() => import("./pages/public/CategoryPage.jsx"));
const StoreDetails = lazy(() => import("./pages/public/StoreDetails.jsx"));
const ProductDetails = lazy(() => import("./pages/public/ProductDetails.jsx"));
const OwnerDashboard = lazy(() => import("./pages/owner/Dashboard.jsx"));
const OwnerProducts = lazy(() => import("./pages/owner/ProductsManagement.jsx"));
const OwnerOrders = lazy(() => import("./pages/owner/OrdersManagement.jsx"));
const OwnerCategories = lazy(() => import("./pages/owner/CategoriesManagement.jsx"));
const OwnerSections = lazy(() => import("./pages/owner/SectionsManagement.jsx"));
const OwnerCoupons = lazy(() => import("./pages/owner/CouponsManagement.jsx"));
const OwnerReviews = lazy(() => import("./pages/owner/ReviewsManagement.jsx"));

function withRouteSuspense(page) {
  return (
    <Suspense
      fallback={
        <Box className="storefront-page">
          <LoadingState label="جارٍ تحميل الصفحة..." />
        </Box>
      }
    >
      {page}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: withRouteSuspense(<Home />) },
      { path: "about", element: withRouteSuspense(<About />) },
      { path: "market", element: withRouteSuspense(<Market />) },
      { path: "market/:slug", element: withRouteSuspense(<StoreDetails />) },
      {
        path: "market/:slug/category/:categoryId",
        element: withRouteSuspense(<CategoryPage />),
      },
      {
        path: "market/:slug/product/:productId",
        element: withRouteSuspense(<ProductDetails />),
      },
      { path: "market/:slug/cart", element: withRouteSuspense(<Cart />) },
      { path: "market/:slug/checkout", element: withRouteSuspense(<Checkout />) },
      { path: "contact", element: withRouteSuspense(<Contact />) },
      { path: "auth/login", element: withRouteSuspense(<Login />) },
      { path: "auth/register", element: withRouteSuspense(<Register />) },
      { path: "auth/verify-email", element: withRouteSuspense(<VerifyEmail />) },
      { path: "dashboard", element: withRouteSuspense(<Dashboard />) },
      { path: "admin", element: withRouteSuspense(<Dashboard />) },
      { path: "owner", element: withRouteSuspense(<OwnerDashboard />) },
      { path: "owner/products", element: withRouteSuspense(<OwnerProducts />) },
      { path: "owner/orders", element: withRouteSuspense(<OwnerOrders />) },
      {
        path: "owner/categories",
        element: withRouteSuspense(<OwnerCategories />),
      },
      { path: "owner/sections", element: withRouteSuspense(<OwnerSections />) },
      { path: "owner/coupons", element: withRouteSuspense(<OwnerCoupons />) },
      { path: "owner/reviews", element: withRouteSuspense(<OwnerReviews />) },
      { path: "*", element: withRouteSuspense(<NotFound />) },
    ],
  },
]);

export default router;
