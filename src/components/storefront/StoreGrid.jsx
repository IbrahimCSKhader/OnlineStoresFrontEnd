import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";
import EmptyState from "../common/feedback/EmptyState.jsx";
import LoadingState from "../common/loaders/LoadingState.jsx";
import StoreCard from "./StoreCard.jsx";
import "./StoreGrid.css";

export default function StoreGrid({ stores, loading, error, onRetry }) {
  if (loading) {
    return <LoadingState label="جارٍ تحميل المتاجر..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="تعذر تحميل المتاجر"
        description="حدث خلل أثناء جلب بيانات السوق. حاول مرة أخرى بعد لحظات."
        action={
          onRetry ? (
            <AppButton variant="contained" onClick={onRetry}>
              إعادة المحاولة
            </AppButton>
          ) : null
        }
      />
    );
  }

  if (!stores.length) {
    return (
      <EmptyState
        title="لا توجد متاجر متاحة الآن"
        description="عند تفعيل أول متجر سيظهر هنا مباشرة ضمن دليل السوق."
      />
    );
  }

  return (
    <Box className="store-grid">
      {stores.map((store) => (
        <StoreCard key={store.id ?? store.slug ?? store.name} store={store} />
      ))}
    </Box>
  );
}
