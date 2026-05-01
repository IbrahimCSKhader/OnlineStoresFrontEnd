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

export const productApi = {
  getProductsByStore: (storeId, params) =>
    axiosInstance.get(endpoints.products.byStore(storeId), params ? { params } : undefined),
  getManagedProductsByStore: (storeId, params) =>
    axiosInstance.get(
      endpoints.products.manageByStore(storeId),
      params ? { params } : undefined,
    ),
  getFeaturedProducts: (storeId) =>
    axiosInstance.get(endpoints.products.featured(storeId)),
  getProductById: (id) => axiosInstance.get(endpoints.products.detail(id)),
  getProductBySlug: (slug) => axiosInstance.get(endpoints.products.slug(slug)),
  getProductsByCategory: (categoryId) =>
    axiosInstance.get(endpoints.products.byCategory(categoryId)),
  getProductsBySection: (sectionId) =>
    axiosInstance.get(endpoints.products.bySection(sectionId)),
  createProduct: (payload) =>
    axiosInstance.post(
      endpoints.products.create,
      createMultipartFormData(payload),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    ),
  updateProduct: (id, payload) =>
    axiosInstance.put(
      endpoints.products.detail(id),
      createMultipartFormData(payload),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    ),
  deleteProduct: (id) => axiosInstance.delete(endpoints.products.detail(id)),
  visitProduct: (id) => axiosInstance.post(endpoints.products.visit(id)),
  getProductVisitCount: (id) =>
    axiosInstance.get(endpoints.products.visitCount(id)),
  createVariant: (productId, payload) =>
    axiosInstance.post(endpoints.products.createVariant(productId), payload),
  deleteVariant: (variantId) =>
    axiosInstance.delete(endpoints.products.deleteVariant(variantId)),
  uploadProductImage: (payload) =>
    axiosInstance.post(
      endpoints.products.uploadImage,
      createMultipartFormData(payload),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    ),
  deleteProductImage: (imageId) =>
    axiosInstance.delete(endpoints.products.deleteImage(imageId)),
};

export default productApi;
