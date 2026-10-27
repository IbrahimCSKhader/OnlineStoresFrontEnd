import { useQuery } from "@tanstack/react-query";
import useStorefrontSession from "./useStorefrontSession.js";
import axiosInstance from "../../API/axiosInstance.js";

export const customerProfileKey = (storeId, customerId) => ["customer-profile", storeId, customerId];
export const customerProfileUrl = (storeId) => `/api/store-customer-auth/store/${storeId}/profile`;

export default function useCustomerProfile(storeId, enabled) {
  const session = useStorefrontSession(storeId);
  const customerId = session.storefrontCustomer?.id;
  return useQuery({ queryKey: customerProfileKey(storeId, customerId),
    queryFn: async () => (await axiosInstance.get(customerProfileUrl(storeId))).data,
    enabled: Boolean(storeId && enabled && customerId), retry: false });
}
