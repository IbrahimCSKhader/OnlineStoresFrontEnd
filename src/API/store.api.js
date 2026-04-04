import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

function isFileLike(value) {
  return (
    (typeof File !== "undefined" && value instanceof File) ||
    (typeof Blob !== "undefined" && value instanceof Blob)
  );
}

function appendFormValue(formData, key, value) {
  if (value === undefined || value === null || value === "") return;

  if (value instanceof Date) {
    formData.append(key, value.toISOString());
    return;
  }

  if (isFileLike(value)) {
    formData.append(key, value);
    return;
  }

  if (Array.isArray(value)) {
    const fileArray = value.every(isFileLike);

    value.forEach((item, index) => {
      appendFormValue(formData, fileArray ? key : `${key}[${index}]`, item);
    });

    return;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      appendFormValue(formData, `${key}.${nestedKey}`, nestedValue);
    });

    return;
  }

  formData.append(key, value);
}

function createMultipartFormData(payload = {}) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    appendFormValue(formData, key, value);
  });

  return formData;
}

export const storeApi = {
  getStores: (params) => axiosInstance.get(endpoints.stores.list, { params }),
  createStore: (payload) =>
    axiosInstance.post(endpoints.stores.create, createMultipartFormData(payload), {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  getStoreById: (id) => axiosInstance.get(endpoints.stores.detail(id)),
  getStoreBySlug: (slug) => axiosInstance.get(endpoints.stores.slug(slug)),
  updateStore: (id, payload) => axiosInstance.put(endpoints.stores.detail(id), payload),
  deleteStore: (id) => axiosInstance.delete(endpoints.stores.detail(id)),
  visitStore: (id) => axiosInstance.post(endpoints.stores.visit(id)),
  getStoreVisitCount: (id) => axiosInstance.get(endpoints.stores.visitCount(id)),
};

export default storeApi;
