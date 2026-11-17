import axios from "./axiosInstance.js";
import endpoints from "./endpoints.js";

function authorization(token, signal) {
  return { headers: { Authorization: `Bearer ${token}` }, signal };
}

export default {
  get: (storeId, token, signal) => axios.get(endpoints.favorites.list(storeId), authorization(token, signal)),
  merge: (storeId, productIds, token, signal) =>
    axios.post(endpoints.favorites.merge(storeId), { productIds }, authorization(token, signal)),
  add: (storeId, productId, token) =>
    axios.put(endpoints.favorites.product(storeId, productId), null, authorization(token)),
  remove: (storeId, productId, token) =>
    axios.delete(endpoints.favorites.product(storeId, productId), authorization(token)),
};
