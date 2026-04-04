import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const superAdminDashboardApi = {
  getSummary: () => axiosInstance.get(endpoints.superAdminDashboard.summary),
  getOwners: () => axiosInstance.get(endpoints.superAdminDashboard.owners),
  getOwnerDetails: (ownerId) =>
    axiosInstance.get(endpoints.superAdminDashboard.ownerDetail(ownerId)),
  setOwnerStatus: (ownerId, payload) =>
    axiosInstance.put(endpoints.superAdminDashboard.ownerStatus(ownerId), payload),
  getStores: () => axiosInstance.get(endpoints.superAdminDashboard.stores),
  getStoreDetails: (storeId) =>
    axiosInstance.get(endpoints.superAdminDashboard.storeDetail(storeId)),
  setStoreStatus: (storeId, payload) =>
    axiosInstance.put(endpoints.superAdminDashboard.storeStatus(storeId), payload),
  getStoreCustomers: (storeId) =>
    axiosInstance.get(endpoints.superAdminDashboard.storeCustomers(storeId)),
};

export default superAdminDashboardApi;
