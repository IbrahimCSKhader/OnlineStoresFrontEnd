import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const orderApi = {
  createGuestOrder: (payload) => axiosInstance.post("/api/Order/guest", payload),
  createOrder: (payload) => axiosInstance.post(endpoints.orders.create, payload),
  getMyOrders: () => axiosInstance.get(endpoints.orders.mine),
  getMyOrderById: (orderId) => axiosInstance.get(endpoints.orders.myDetail(orderId)),
  getStoreOrders: (storeId) => axiosInstance.get(endpoints.orders.byStore(storeId)),
  getStoreOrderById: (storeId, orderId) =>
    axiosInstance.get(endpoints.orders.storeDetail(storeId, orderId)),
  updateOrderStatus: (orderId, payload) =>
    axiosInstance.put(endpoints.orders.updateStatus(orderId), payload),
  updateReceivedAmount: (orderId, payload) =>
    axiosInstance.put(endpoints.orders.updateReceivedAmount(orderId), payload),
};

export default orderApi;
