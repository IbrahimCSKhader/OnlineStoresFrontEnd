# تكامل Google Login - توثيق شامل

## الملفات المُنشأة والمُعدّلة

### 1. صفحات Google Callback الجديدة

#### `src/pages/auth/GoogleSuccessCallback.jsx`
- **الغرض**: معالجة الRedirect الناجح من Google Login
- **الآلية**:
  - قراءة بيانات الجلسة من URL fragment (#token=..., #email=..., #firstName=..., #lastName=...)
  - التحقق من وجود token (مصدر الحقيقة الوحيد)
  - حفظ token والبيانات في localStorage بنفس آلية التخزين الحالية
  - تحديث Zustand auth store (authStore)
  - استخراج role من token إذا كان موجود
  - إعادة التوجيه للصفحة الرئيسية المناسبة (getLandingPath)
  - عرض رسالة خطأ واضحة إذا فشل parsing أو token مفقود

#### `src/pages/auth/GoogleFailureCallback.jsx`
- **الغرض**: معالجة فشل Google Login
- **الآلية**:
  - قراءة query param `error` و `message`
  - عرض رسالة خطأ صديقة للمستخدم
  - توفير خيارات واضحة (إعادة محاولة, إنشاء حساب جديد, العودة للسوق)
  - عدم إظهار تفاصيل تقنية حساسة

### 2. التعديلات على الملفات الموجودة

#### `src/routes.jsx`
**التعديلات**:
- استيراد المكونات الجديدة:
  ```javascript
  const GoogleSuccessCallback = lazyWithRetry(...);
  const GoogleFailureCallback = lazyWithRetry(...);
  ```
- إضافة routes جديدة:
  ```javascript
  { path: "auth/google/success", element: withRouteSuspense(<GoogleSuccessCallback />) },
  { path: "auth/google/failure", element: withRouteSuspense(<GoogleFailureCallback />) },
  ```

#### `src/pages/auth/Login.jsx`
**التعديلات**:
- **إضافة State جديد**:
  ```javascript
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  ```

- **إضافة دالة `handleGoogleLogin()`**:
  ```javascript
  function handleGoogleLogin() {
    try {
      setIsLoadingGoogle(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://mawja.premiumasp.net";
      const frontendBaseUrl = window.location.origin;
      const successCallback = `${frontendBaseUrl}/auth/google/success`;
      const failureCallback = `${frontendBaseUrl}/auth/google/failure`;
      
      const googleAuthUrl = `${apiBaseUrl}/api/Auth/google?successRedirect=${encodeURIComponent(successCallback)}&failureRedirect=${encodeURIComponent(failureCallback)}`;
      window.location.href = googleAuthUrl;
    } catch (error) {
      setLocalError("فشل الاتصال بخادم Google. حاول مرة أخرى.");
      setIsLoadingGoogle(false);
    }
  }
  ```

- **إضافة زر Google في فورم Login**:
  - يظهر بعد حقول البريد وكلمة المرور
  - يحتوي على Loading state واضح
  - معطل أثناء العمليات الأخرى

#### `src/pages/customer/Checkout.jsx`
**التعديلات**:
1. **حماية المصادقة**:
   ```javascript
   import useAuth from "../../hooks/auth/useAuth.js";
   const { isStoreCustomer } = useAuth();
   
   // في بداية الـ JSX:
   if (!isStoreCustomer) {
     return <EmptyState title="يجب تسجيل الدخول أولاً" ... />
   }
   ```
   - يوجه غير المسجلين لصفحة login

2. **مسح السلة عند نجاح الطلب**:
   ```javascript
   const clearCartMutation = useMutation({
     mutationFn: () => cartApi.clearCart(store?.id),
     onError: (error) => {
       console.error("[Checkout] Failed to clear cart:", error);
     },
   });
   ```
   - في `handleSubmitOrder()`:
     - بعد بناء رابط WhatsApp
     - قبل التوجيه إلى WhatsApp
     - مع عرض رسالة نجاح واضحة
     - استمرار التوجيه حتى لو فشل مسح السلة

3. **تحديث الـ UI**:
   - إضافة "تم مسح السلة تلقائيًا" في رسالة النجاح
   - إضافة `isSubmitting` state للـ form

## الآلية الشاملة

### مسار Google Login:

```
1. المستخدم ينقر على زر "الدخول عبر Google" في صفحة Login
2. يتم استدعاء handleGoogleLogin()
3. تحويل المتصفح إلى: GET /api/Auth/google?successRedirect=...&failureRedirect=...
4. Backend يوجه المستخدم لـ Google OAuth
5. بعد الموافقة، Google يوجه إلى failureRedirect أو يرسل البيانات للـ Backend
6. Backend يوجه إلى successRedirect مع البيانات في URL fragment
7. GoogleSuccessCallback يقرأ البيانات من fragment
8. إذا كان token موجود:
   - حفظ token في localStorage (authToken)
   - حفظ user data (email, firstName, lastName)
   - تحديث Zustand store
   - اشتقاق role من token
   - إعادة توجيه للصفحة الرئيسية
9. إذا فشل:
   - عرض رسالة خطأ
```

### مسار Checkout:

```
1. المستخدم يدخل صفحة checkout
2. يتم التحقق من isStoreCustomer:
   - إذا كان false → إعادة توجيه لـ login
   - إذا كان true → المتابعة
3. المستخدم يملأ البيانات ويضغط "إرسال الطلب"
4. التحقق من صحة البيانات (اسم، عنوان)
5. بناء رسالة WhatsApp
6. استدعاء clearCartMutation.mutateAsync()
7. إذا نجح المسح:
   - عرض "تم مسح السلة بنجاح"
8. في كلا الحالتين:
   - بعد 1.5 ثانية، التوجيه إلى WhatsApp
```

## الحماية والأمان

### منع الطلبات بدون تسجيل:
- ✅ `isStoreCustomer` check في Checkout
- ✅ المكونات المحمية تطلب إعادة توجيه للـ login
- ✅ API interceptors تتحقق من token

### مصدر الحقيقة:
- ✅ Token الصادر من Backend هو المصدر الوحيد للحقيقة
- ✅ لا نعتمد على email من الـ URL (قد يكون مزيف)
- ✅ جميع البيانات تأتي من Backend

### عدم طباعة البيانات الحساسة:
- ✅ لا يتم طباعة token في console (إلا في DEV والرسائل الجديدة)
- ✅ رسائل الخطأ واضحة بدون details تقنية

## الاختبارات الأساسية المطلوبة

### 1. حالة النجاح:
```
✓ انقر على زر Google Login
✓ أكمل المصادقة مع Google
✓ تحقق من أن token محفوظ في localStorage
✓ تحقق من أن auth state محدّث
✓ تحقق من إعادة التوجيه للصفحة الصحيحة
✓ جرب الملاحة محمية (checkout) → يجب أن تعمل
```

### 2. حالة الفشل:
```
✓ رفض الوصول في Google → يجب عرض error page
✓ انقر على "إعادة المحاولة" → عودة لـ login
✓ لا توجد تفاصيل تقنية للمستخدم
```

### 3. حالة Token ناقص:
```
✓ عدّل URL يدويًا بدون token في fragment
✓ يجب عرض رسالة "فشل... الرجاء محاولة مرة أخرى"
✓ يجب إعادة التوجيه لـ login
```

### 4. حماية Checkout:
```
✓ حاول الدخول لـ /market/:slug/checkout بدون تسجيل
✓ يجب عرض "يجب تسجيل الدخول أولاً"
✓ انقر على زر Login → اذهب لـ login
✓ بعد Login → عودة للـ checkout
```

### 5. مسح السلة:
```
✓ أضف منتجات للسلة
✓ انصل للـ checkout
✓ أكمل النموذج وأرسل الطلب
✓ تحقق في Network tab → DELETE /api/Cart/... (clearCart)
✓ تحقق في LocalStorage → guestCart يجب أن يكون فارغ
```

## ملاحظات مهمة

1. **Fragment vs Query**:
   - Success: يستخدم fragment (#token=...)
   - Failure: يستخدم query params (?error=..., ?message=...)
   - السبب: Fragment لا يُرسل للـ server، أكثر أماناً

2. **localStorage vs sessionStorage**:
   - نستخدم localStorage كما هو الحال في المشروع
   - Token يبقى حتى logout صريح

3. **تسلسل Checkout**:
   - المسح يحدث قبل WhatsApp redirect
   - إذا فشل المسح، نستمر على كل حال
   - المستخدم يمكنه رؤية الرسالة قبل التوجيه

4. **Interceptors**:
   - interceptors موجودة بالفعل
   - تتعامل مع 401/403 تلقائiًا
   - لا حاجة لتعديلات إضافية

## التكامل مع المعمارية الحالية

- ✅ نفس آلية تخزين التوكن (localStorage)
- ✅ نفس auth store (Zustand)
- ✅ نفس role extraction (من token)
- ✅ نفس cart API (clearCart)
- ✅ نفس routing (React Router)
- ✅ نفس UI framework (Material-UI)
