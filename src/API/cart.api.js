import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const cartApi = {
  getCart: (storeId) => axiosInstance.get(endpoints.cart.byStore(storeId)),
  addToCart: (payload) => axiosInstance.post(endpoints.cart.add, payload),
  updateCartItem: (cartItemId, payload) => axiosInstance.put(endpoints.cart.item(cartItemId), payload),
  removeCartItem: (cartItemId) => axiosInstance.delete(endpoints.cart.item(cartItemId)),
  clearCart: (storeId) => axiosInstance.delete(endpoints.cart.clear(storeId)),
};

export default cartApi;
