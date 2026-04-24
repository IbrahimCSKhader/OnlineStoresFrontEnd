import useAuth from "../auth/useAuth.js";

export default function useProductPricingScope() {
  const { storeCustomer } = useAuth();
  return storeCustomer?.id ? `store-customer:${storeCustomer.id}` : undefined;
}
