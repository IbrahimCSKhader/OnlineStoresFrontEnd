import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const customerStoreApi = {
  getStoreCustomers: (storeId) => axiosInstance.get(endpoints.customerStores.byStore(storeId)),
  getAvailableCustomers: () => axiosInstance.get(endpoints.customerStores.availableCustomers),
  createCustomerStore: (payload) =>
    axiosInstance.post(endpoints.customerStores.create, payload),
  updateCustomerStore: (id, payload) =>
    axiosInstance.put(endpoints.customerStores.detail(id), payload),
  deleteCustomerStore: (id) =>
    axiosInstance.delete(endpoints.customerStores.detail(id)),
};

export default customerStoreApi;
