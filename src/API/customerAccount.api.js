import api from "./axiosInstance.js";
const base = store => `/api/CustomerStore/store/${store}/accounts`;
export const customerAccountApi = {
  list: (store, search = "", page = 1) => api.get(base(store), { params: { search, page } }),
  account: (store, id) => api.get(`${base(store)}/${id}`),
  save: (store, id, profile) => id ? api.put(`${base(store)}/${id}`, profile) : api.post(base(store), profile),
  payment: (store, id, payload) => api.post(`${base(store)}/${id}/payments`, payload),
  allocate: (store, id, payload) => api.post(`${base(store)}/${id}/allocate-credit`, payload),
  reverse: (store, id, entry, reason) => api.post(`${base(store)}/${id}/entries/${entry}/reverse`, { reason }),
  merge: (store, id, targetCustomerId, reason) => api.post(`${base(store)}/${id}/merge`, { targetCustomerId, reason }),
  reassign: (store, order, customerId, reason) => api.put(`${base(store)}/orders/${order}/customer`, { customerId, reason }),
  backfill: store => api.post(`${base(store)}/backfill`),
};
