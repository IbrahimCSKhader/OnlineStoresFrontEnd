/**
 * أمثلة عملية لاستخدام Store Context والثيم
 * Examples for using Store Context and Theme properly
 */

// ============================================
// ❌ الطريقة القديمة (والخاطئة):
// ============================================

import { useMemo } from "react";
import useAuth from "../../hooks/auth/useAuth.js";

export function OldWayExample() {
  const { user } = useAuth();

  // ❌ مشاكل:
  // 1. storeId مأخوذ من user state (قد يكون غير صحيح)
  // 2. لا يوجد ضمان أن storeId متسق
  // 3. قد يحدث IDOR vulnerability

  const storeId = user?.storeId; // ❌ غير موثوق

  return <div>Store ID: {storeId}</div>;
}

// ============================================
// ✅ الطريقة الصحيحة #1 (بسيطة):
// ============================================

import useOwnerStore from "../../hooks/stores/useOwnerStore.js";
import useStoreBranding from "../../theme/useStoreBranding.js";

export function CorrectWayExample1() {
  const { ownerStore, isLoading, error } = useOwnerStore();
  const storeId = ownerStore?.id;

  // ✅ تطبيق الثيم
  useStoreBranding(ownerStore);

  // ✅ الآن storeId موثوق:
  // - مأخوذ من store owner relationship
  // - Backend verification guaranteed
  // - Consistent across app

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!storeId) return <div>No store found</div>;

  return (
    <div>
      <h1>Store: {ownerStore?.name}</h1>
      <p>Store ID: {storeId}</p>
      {/* Theme تطبق تلقائياً في هذه الصفحة ✅ */}
    </div>
  );
}

// ============================================
// ✅ الطريقة الصحيحة #2 (With Context):
// ============================================

import { useStoreContext } from "../../context/StoreContext.jsx";

export function CorrectWayExample2_WithContext() {
  const { store, storeId, isLoading, isOwner } = useStoreContext();

  // ✅ مميزات:
  // - Centralized context
  // - Consistent across nested components
  // - Easy to pass to API calls
  // - Built-in ownership check

  if (!isOwner) return <div>Not authorized</div>;
  if (!storeId) return <div>No store</div>;

  return <StoreContent storeId={storeId} storeName={store?.name} />;
}

function StoreContent({ storeId, storeName }) {
  // storeId مضمون أنه صحيح هنا ✅
  return <div>Manage store: {storeName}</div>;
}

// ============================================
// ✅ الطريقة الصحيحة #3 (Strict Safety):
// ============================================

import { useRequireStoreId } from "../../context/StoreContext.jsx";

export function CorrectWayExample3_StrictSafety() {
  // ✅ هذا سيرمي error إذا كان storeId غير موجود
  // يضمن أن الـ sensitive operations لا تحدث بدون store
  const storeId = useRequireStoreId();

  return <SensitiveOperation storeId={storeId} />;
}

function SensitiveOperation({ storeId }) {
  // storeId guaranteed to exist ✅

  const handleDeleteProduct = async (productId) => {
    // ✅ صحيح: storeId في الـ URL
    const response = await fetch(
      `/api/Product/${productId}?storeId=${storeId}`,
      { method: "DELETE" },
    );

    // Backend will verify:
    // 1. User authenticated?
    // 2. User owns this store?
    // 3. Product belongs to this store?
    // If any check fails → 403 Forbidden
  };

  return <div>Product management for store: {storeId}</div>;
}

// ============================================
// ✅ استخدام في Page Component:
// ============================================

// src/pages/owner/Dashboard.jsx

import { useEffect, useMemo, useState } from "react";
import useProducts from "../../hooks/products/useProducts.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import useOwnerStore from "../../hooks/stores/useOwnerStore.js";

export default function Dashboard() {
  const ownerStoreQuery = useOwnerStore({ refetchOnWindowFocus: false });
  const store = ownerStoreQuery.ownerStore;
  const storeId = store?.id;

  // ✅ الخط المهم:
  useStoreBranding(store); // Apply theme ✅

  // الآن يمكن استخدام storeId بثقة:
  const productsQuery = useProducts(storeId, undefined, {
    enabled: Boolean(storeId),
    staleTime: 30000,
  });

  if (!storeId) return <LoadingState />;
  if (ownerStoreQuery.isLoading) return <LoadingState />;

  return (
    <div>
      {/* هنا سيطبق الثيم الصحيح 🎨 */}
      <h1>{store?.name}</h1>
      <ProductsList data={productsQuery.data} />
    </div>
  );
}

// ============================================
// ✅ استخدام Correct API Endpoints:
// ============================================

export function APIExamplesCorrect() {
  const { storeId } = useStoreContext();

  // ✅ صحيح: storeId في الـ URL
  const getProducts = () => {
    fetch(`/api/Product/store/${storeId}`);
  };

  // ✅ صحيح: storeId في الـ body
  const addProduct = (data) => {
    fetch(`/api/Product`, {
      method: "POST",
      body: JSON.stringify({ ...data, storeId }),
    });
  };

  // ✅ صحيح: storeId في الـ URL
  const getOrders = () => {
    fetch(`/api/Order/store/${storeId}`);
  };

  // ✅ صحيح: storeId في الـ URL للـ detail
  const updateOrder = (orderId, status) => {
    fetch(`/api/Order/store/${storeId}/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  };
}

// ============================================
// ❌ API Examples الخاطئة:
// ============================================

export function APIExamplesWrong() {
  // ❌ غلط: storeId مأخوذ من user state
  const { user } = useAuth();
  const storeId = user?.storeId; // ❌ قد تكون مختلفة

  // ❌ غلط: storeId غير موجود في الـ URL
  const getProducts = () => {
    fetch(`/api/Product`); // ❌ API لا يعرف أي store
  };

  // ❌ غلط: storeId من localStorage بدل من component state
  const storeId2 = localStorage.getItem("currentStoreId"); // ❌ قد تكون قديمة

  // ❌ غلط: hardcoded storeId
  const storeId3 = "123"; // ❌ لا تسحب من الـ runtime data
}

// ============================================
// ✅ كيفية استدعاء jooks صحيح:
// ============================================

export function HooksExamples() {
  const { storeId } = useStoreContext();

  // ✅ صحيح: pass storeId من context
  const productsQuery = useProducts(storeId, undefined, {
    enabled: Boolean(storeId),
  });

  // ✅ صحيح: pass storeId للـ mutation
  const createProductMutation = useCreateProduct(storeId);
  const { mutate: addProduct } = createProductMutation;

  const handleAddProduct = (data) => {
    addProduct(data); // ✅ storeId already included
  };

  return (
    <div>
      <button onClick={() => handleAddProduct({ name: "Test" })}>
        Add Product
      </button>
    </div>
  );
}

// ============================================
// 📋 Checklist للاستخدام الصحيح:
// ============================================

/**
 * ✅ قبل كتابة owner page جديدة:
 *
 * 1. [ ] Import useOwnerStore
 *        import useOwnerStore from "../../hooks/stores/useOwnerStore.js";
 *
 * 2. [ ] Import useStoreBranding
 *        import useStoreBranding from "../../theme/useStoreBranding.js";
 *
 * 3. [ ] في الـ component:
 *        const { ownerStore } = useOwnerStore();
 *        useStoreBranding(ownerStore); // ✅ تطبيق الثيم
 *
 * 4. [ ] احصل على storeId:
 *        const storeId = ownerStore?.id;
 *
 * 5. [ ] استخدم storeId في الـ hooks:
 *        const dataQuery = useHook(storeId, ...);
 *
 * 6. [ ] في الـ API calls تأكد من:
 *        - storeId في الـ URL path
 *        - أو storeId في الـ request body
 *        - أو storeId في الـ query parameters
 */

export const CHECKLIST = {
  imports: [
    "useOwnerStore",
    "useStoreBranding",
    "useStoreContext (optional but recommended)",
  ],
  setup: [
    "Get store from useOwnerStore",
    "Call useStoreBranding(store)",
    "Extract storeId from store",
  ],
  apiCalls: [
    "Always include storeId in endpoint",
    "Use provided hooks (they handle storeId for you)",
    "Never hardcode storeId",
  ],
  security: [
    "Backend verifies ownership",
    "If storeId mismatched → 403",
    "No frontend-only checks",
  ],
};
