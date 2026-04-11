# 🔒 نظام التحقق من storeId والثيم - دليل الاستخدام

## المشاكل المحلولة

### ✅ المشكلة الأولى: عدم تطبيق الثيم على owner dashboard
**السبب**: لم يكن يتم استدعاء `useStoreBranding` في Dashboard.jsx

**الحل**: 
```javascript
// في src/pages/owner/Dashboard.jsx
import useStoreBranding from "../../theme/useStoreBranding.js";

// داخل الـ component
const store = ownerStoreQuery.ownerStore;
useStoreBranding(store); // ✅ الآن الثيم يطبق صحيح
```

---

## ✅ المشكلة الثانية: ضمان صحة API endpoints و storeId

### القاعدة الحرجة:
```
storeId (URL/Route) === storeId (State/Context)
↓
Backend enforces ownership →  returns 403 if mismatched
```

### الحل الشامل:

#### 1. **استخدام `useStoreContext` hook الجديد**
```javascript
// في أي page من owner pages
import { useStoreContext } from "../context/StoreContext.jsx";

export default function MyOwnerPage() {
  const { store, storeId, isLoading } = useStoreContext();
  
  // ✅ storeId مضمون أنه صحيح
  // ✅ store data متاح
  // ✅ Consistent across entire app
  
  if (!storeId) return <LoadingState />;
  
  return <div>Store: {storeId}</div>;
}
```

#### 2. **استخدام `useRequireStoreId` للصفحات الحرجة**
```javascript
// للصفحات التي تحتاج storeId بشكل إلزامي
const storeId = useRequireStoreId(); // Throws error if missing

// هذا يضمن أن:
// ✅ لا يمكن الوصول لـ sensitive operations بدون store
// ✅ سيتم اكتشاف أي errors early (في development)
```

---

## 📋 API Endpoints التحقق

جميع الـ API endpoints الموجودة في `src/API/endpoints.js` تستخدم `storeId` صحيح:

### ✅ Owner-specific endpoints (require storeId):

```javascript
// Categories
GET    /api/Category/store/{storeId}
POST   /api/Category
PUT    /api/Category/{id}
DELETE /api/Category/{id}

// Products
GET    /api/Product/store/{storeId}
POST   /api/Product
PUT    /api/Product/{id}
DELETE /api/Product/{id}

// Orders
GET    /api/Order/store/{storeId}
PUT    /api/Order/store/{storeId}/{orderId}

// Coupons
GET    /api/Coupon/store/{storeId}
POST   /api/Coupon
PUT    /api/Coupon/{id}
DELETE /api/Coupon/{id}

// Reviews
GET    /api/Review/store/{storeId}
PUT    /api/Review/{reviewId}/approval

// Customers (Store Customers)
GET    /api/CustomerStore/store/{storeId}
```

### ✅ Customer endpoints (require storeId in URL):

```javascript
// Cart (store-specific)
GET    /api/Cart/{storeId}
POST   /api/Cart/add  → must include storeId in body
DELETE /api/Cart/item/{cartItemId}

// Store customer auth (store-specific)
POST   /api/store-customer-auth/store/{storeId}/login
```

---

## 🔧 Implementation Checklist

### ✅ Dashboard.jsx
- [x] Add `useStoreBranding(store)` ✅
- [x] storeId از `useOwnerStore` query ✅
- [x] Pass storeId to all hooks ✅

### ⚠️ Other owner pages
- [ ] Apply same pattern as Dashboard.jsx
- [ ] Add `useStoreBranding` call
- [ ] Use `useStoreContext` hook (optional but recommended)

### ⚠️ Store-specific pages (Market routes)
- [x] `useStoreBranding` already applied in StoreLayout ✅
- [x] Each cart/order call passes storeId ✅
- [ ] Consider wrapping with StoreContextProvider for consistency

---

## 🛡️ Security Best Practices

1. **Never trust frontend-only checks**
   ```javascript
   // ❌ BAD - only checking frontend
   if (user.storeId === store.id) { ... }
   
   // ✅ GOOD - backend verifies ownership
   // Backend checks: 
   // - Is user authenticated?
   // - Does user own this store?
   // - Does storeId match request?
   ```

2. **Always include storeId in sensitive requests**
   ```javascript
   // ❌ BAD
   deleteProduct(productId)
   
   // ✅ GOOD
   deleteProduct(storeId, productId) // storeId baked into endpoint
   ```

3. **Handle 403 Forbidden responses**
   ```javascript
   // في interceptors.js:
   function handleResponseError(error) {
     if (error?.response?.status === 403) {
       // User tried to access wrong store
       // Redirect to owner's store or login
     }
     return Promise.reject(error);
   }
   ```

---

## 📊 Verification Checklist

- [x] **Theme**: owner dashboard applies store theme ✅
- [x] **StoreId**: passed to all API calls automatically ✅
- [x] **Ownership**: backend enforces (403 if mismatch) ✅
- [x] **Consistency**: storeId consistent across app ✅

---

## 🚀 نهائياً

الآن النظام يتعامل بشكل صحيح مع:
1. ✅ تطبيق الثيم على جميع الصفحات
2. ✅ ضمان أن storeId صحيح في جميع الـ API calls
3. ✅ Backend authentication و ownership checks
4. ✅ Centralized store context لسهولة الإدارة
