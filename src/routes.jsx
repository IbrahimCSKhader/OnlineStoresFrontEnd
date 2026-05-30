import { Suspense } from "react";
import Box from "@mui/material/Box";
import { Navigate, createBrowserRouter, useLocation } from "react-router-dom";
import AppRouteError from "./components/common/feedback/AppRouteError.jsx";
import LoadingState from "./components/common/loaders/LoadingState.jsx";
import MainLayout from "./layout/MainLayout.jsx";
import StoreLayout from "./layout/StoreLayout.jsx";
import RouteFrame from "./routes/RouteFrame.jsx";
import {
  isCustomDomainStorefront,
  normalizeStorefrontPath,
} from "./utils/customDomain.js";
import lazyWithRetry from "./utils/lazyWithRetry.js";
const Home = lazyWithRetry(() => import("./pages/Home/Home.jsx"), "home");
const About = lazyWithRetry(() => import("./pages/About/About.jsx"), "about");
const Market = lazyWithRetry(
  () => import("./pages/Market/Market.jsx"),
  "market",
);
const Contact = lazyWithRetry(
  () => import("./pages/Contact/Contact.jsx"),
  "contact",
);
const NotFound = lazyWithRetry(
  () => import("./pages/NotFound/NotFound.jsx"),
  "not-found",
);

const Login = lazyWithRetry(() => import("./pages/auth/Login.jsx"), "login");
const Register = lazyWithRetry(
  () => import("./pages/auth/Register.jsx"),
  "register",
);
const VerifyEmail = lazyWithRetry(
  () => import("./pages/auth/VerifyEmail.jsx"),
  "verify-email",
);
const StoreRegister = lazyWithRetry(
  () => import("./pages/storeRegister/StoreRegister.jsx"),
  "store-register",
);
const GoogleCallbackPage = lazyWithRetry(
  () => import("./pages/auth/GoogleCallbackPage.jsx"),
  "google-callback",
);
const GoogleFailureCallback = lazyWithRetry(
  () => import("./pages/auth/GoogleFailureCallback.jsx"),
  "google-failure",
);

const AdminLogin = lazyWithRetry(
  () => import("./pages/admin/AdminLogin.jsx"),
  "admin-login",
);
const SuperAdminLayout = lazyWithRetry(
  () => import("./layout/SuperAdminLayout.jsx"),
  "super-admin-layout",
);
const SuperAdminOverview = lazyWithRetry(
  () => import("./pages/admin/Overview.jsx"),
  "super-admin-overview",
);
const SuperAdminOwners = lazyWithRetry(
  () => import("./pages/admin/Owners.jsx"),
  "super-admin-owners",
);
const SuperAdminStores = lazyWithRetry(
  () => import("./pages/admin/Stores.jsx"),
  "super-admin-stores",
);
const AdminStoreDetails = lazyWithRetry(
  () => import("./pages/admin/StoreDetails.jsx"),
  "admin-store-details",
);

const Cart = lazyWithRetry(() => import("./pages/customer/Cart.jsx"), "cart");
const Checkout = lazyWithRetry(
  () => import("./pages/customer/Checkout.jsx"),
  "checkout",
);

const CategoryPage = lazyWithRetry(
  () => import("./pages/public/CategoryPage.jsx"),
  "category-page",
);
const StoreDetails = lazyWithRetry(
  () => import("./pages/public/StoreDetails.jsx"),
  "store-details",
);
const ProductDetails = lazyWithRetry(
  () => import("./pages/public/ProductDetails.jsx"),
  "product-details",
);
const StoreAbout = lazyWithRetry(
  () => import("./pages/public/StoreAbout.jsx"),
  "store-about",
);
const StoreContact = lazyWithRetry(
  () => import("./pages/public/StoreContact.jsx"),
  "store-contact",
);

const OwnerDashboard = lazyWithRetry(
  () => import("./pages/owner/Dashboard.jsx"),
  "owner-dashboard",
);
const OwnerProducts = lazyWithRetry(
  () => import("./pages/owner/ProductsManagement.jsx"),
  "owner-products",
);
const OwnerSubscription = lazyWithRetry(
  () => import("./pages/owner/StoreSubscription.jsx"),
  "owner-subscription",
);
const OwnerOrders = lazyWithRetry(
  () => import("./pages/owner/OrdersManagement.jsx"),
  "owner-orders",
);
const OwnerOrderDetails = lazyWithRetry(
  () => import("./pages/owner/OrderDetailsPage.jsx"),
  "owner-order-details",
);
const OwnerCategories = lazyWithRetry(
  () => import("./pages/owner/CategoriesManagement.jsx"),
  "owner-categories",
);
const OwnerSections = lazyWithRetry(
  () => import("./pages/owner/SectionsManagement.jsx"),
  "owner-sections",
);
const OwnerCoupons = lazyWithRetry(
  () => import("./pages/owner/CouponsManagement.jsx"),
  "owner-coupons",
);
const OwnerCustomers = lazyWithRetry(
  () => import("./pages/owner/CustomersManagement.jsx"),
  "owner-customers",
);
const OwnerCustomerDetails = lazyWithRetry(
  () => import("./pages/owner/CustomerDetailsPage.jsx"),
  "owner-customer-details",
);

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

function DomainAwareRootLayout() {
  return isCustomDomainStorefront() ? <StoreLayout /> : <MainLayout />;
}

function DomainAwareElement({ platform, storefront }) {
  return isCustomDomainStorefront() ? storefront : platform;
}

function CustomDomainElement({ children }) {
  return isCustomDomainStorefront() ? children : withRouteSuspense(<NotFound />);
}

function StorefrontSlugLayout() {
  const location = useLocation();

  if (isCustomDomainStorefront()) {
    return (
      <Navigate
        to={{
          pathname: normalizeStorefrontPath(location.pathname),
          search: location.search,
        }}
        replace
      />
    );
  }

  return <StoreLayout />;
}

const router = createBrowserRouter([
  {
    element: <RouteFrame />,
    errorElement: <AppRouteError />,
    children: [
      {
        path: "/admin/login",
        element: withRouteSuspense(<AdminLogin />),
      },
      {
        path: "/admin",
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "/dashboard",
        element: withRouteSuspense(<SuperAdminLayout />),
        errorElement: <AppRouteError />,
        children: [
          { index: true, element: withRouteSuspense(<SuperAdminOverview />) },
          { path: "owners", element: withRouteSuspense(<SuperAdminOwners />) },
          { path: "stores", element: withRouteSuspense(<SuperAdminStores />) },
          {
            path: "stores/:storeId",
            element: withRouteSuspense(<AdminStoreDetails />),
          },
          { path: "*", element: <Navigate to="/dashboard" replace /> },
        ],
      },
      {
        path: "/",
        element: <DomainAwareRootLayout />,
        errorElement: <AppRouteError />,
        children: [
          {
            index: true,
            element: (
              <DomainAwareElement
                platform={withRouteSuspense(<Home />)}
                storefront={withRouteSuspense(<StoreDetails />)}
              />
            ),
          },
          {
            path: "about",
            element: (
              <DomainAwareElement
                platform={withRouteSuspense(<About />)}
                storefront={withRouteSuspense(<StoreAbout />)}
              />
            ),
          },
          { path: "market", element: withRouteSuspense(<Market />) },
          {
            path: "contact",
            element: (
              <DomainAwareElement
                platform={withRouteSuspense(<Contact />)}
                storefront={withRouteSuspense(<StoreContact />)}
              />
            ),
          },

          {
            path: "category/:categoryId",
            element: (
              <CustomDomainElement>
                {withRouteSuspense(<CategoryPage />)}
              </CustomDomainElement>
            ),
          },
          {
            path: "product/:productId",
            element: (
              <CustomDomainElement>
                {withRouteSuspense(<ProductDetails />)}
              </CustomDomainElement>
            ),
          },
          {
            path: "cart",
            element: (
              <CustomDomainElement>
                {withRouteSuspense(<Cart />)}
              </CustomDomainElement>
            ),
          },
          {
            path: "checkout",
            element: (
              <CustomDomainElement>
                {withRouteSuspense(<Checkout />)}
              </CustomDomainElement>
            ),
          },
          {
            path: "login",
            element: (
              <CustomDomainElement>
                {withRouteSuspense(<Login />)}
              </CustomDomainElement>
            ),
          },
          {
            path: "register",
            element: (
              <CustomDomainElement>
                {withRouteSuspense(<Register />)}
              </CustomDomainElement>
            ),
          },
          {
            path: "verify-email",
            element: (
              <CustomDomainElement>
                {withRouteSuspense(<VerifyEmail />)}
              </CustomDomainElement>
            ),
          },

          { path: "auth/login", element: withRouteSuspense(<Login />) },
          { path: "auth/register", element: withRouteSuspense(<Register />) },
          { path: "storeRegister", element: withRouteSuspense(<StoreRegister />) },
          {
            path: "auth/verify-email",
            element: withRouteSuspense(<VerifyEmail />),
          },
          {
            path: "auth/google-callback",
            element: withRouteSuspense(<GoogleCallbackPage />),
          },
          {
            path: "auth/google/success",
            element: withRouteSuspense(<GoogleCallbackPage />),
          },
          {
            path: "auth/google/failure",
            element: withRouteSuspense(<GoogleFailureCallback />),
          },

          { path: "owner", element: withRouteSuspense(<OwnerDashboard />) },
          { path: "owner/products", element: withRouteSuspense(<OwnerProducts />) },
          {
            path: "owner/subscription",
            element: withRouteSuspense(<OwnerSubscription />),
          },
          { path: "owner/orders", element: withRouteSuspense(<OwnerOrders />) },
          {
            path: "owner/orders/:orderId",
            element: withRouteSuspense(<OwnerOrderDetails />),
          },
          {
            path: "owner/categories",
            element: withRouteSuspense(<OwnerCategories />),
          },
          { path: "owner/sections", element: withRouteSuspense(<OwnerSections />) },
          { path: "owner/coupons", element: withRouteSuspense(<OwnerCoupons />) },
          {
            path: "owner/customers",
            element: withRouteSuspense(<OwnerCustomers />),
          },
          {
            path: "owner/customers/:customerId",
            element: withRouteSuspense(<OwnerCustomerDetails />),
          },

          { path: "*", element: withRouteSuspense(<NotFound />) },
        ],
      },
      {
        path: "/market/:slug",
        element: <StorefrontSlugLayout />,
        errorElement: <AppRouteError />,
        children: [
          { index: true, element: withRouteSuspense(<StoreDetails />) },
          { path: "about", element: withRouteSuspense(<StoreAbout />) },
          { path: "contact", element: withRouteSuspense(<StoreContact />) },
          {
            path: "category/:categoryId",
            element: withRouteSuspense(<CategoryPage />),
          },
          {
            path: "product/:productId",
            element: withRouteSuspense(<ProductDetails />),
          },
          { path: "cart", element: withRouteSuspense(<Cart />) },
          { path: "checkout", element: withRouteSuspense(<Checkout />) },
          { path: "login", element: withRouteSuspense(<Login />) },
          { path: "register", element: withRouteSuspense(<Register />) },
          { path: "verify-email", element: withRouteSuspense(<VerifyEmail />) },
        ],
      },
    ],
  },
]);

export default router;
