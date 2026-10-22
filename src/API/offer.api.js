import api from "./axiosInstance.js";
export const offerApi = {
  active: storeId => api.get(`/api/offer/store/${storeId}/active`),
  managed: storeId => api.get(`/api/offer/store/${storeId}`),
  create: payload => api.post("/api/offer", payload),
  update: (id, payload) => api.put(`/api/offer/${id}`, payload),
  remove: id => api.delete(`/api/offer/${id}`),
  addBundle: payload => api.post("/api/cart/bundle", payload),
};
