import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const storeCustomerAuthApi = {
  register: (payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.register, payload),
  registerByStore: (storeId, payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.register, {
      ...payload,
      storeId,
    }),
  login: (payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.login, payload),
  loginByStore: (storeId, payload) =>
    axiosInstance.post(
      endpoints.storeCustomerAuth.storeLogin(storeId),
      payload,
    ),
  forgotPassword: (payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.forgotPassword, payload),
  forgotPasswordByStore: (storeId, payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.forgotPassword, {
      ...payload,
      storeId,
    }),
  resetPassword: (payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.resetPassword, payload),
  resetPasswordByStore: (storeId, payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.resetPassword, {
      ...payload,
      storeId,
    }),
  setPassword: (payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.setPassword, payload),
  setPasswordFromAuthUser: (storeId, payload, token) =>
    axiosInstance.post(
      endpoints.storeCustomerAuth.setPasswordFromAuthUser(storeId),
      payload,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    ),
  verifyEmail: (payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.verifyEmail, payload),
  verifyEmailByStore: (storeId, payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.verifyEmail, {
      ...payload,
      storeId,
    }),
  resendVerificationCode: (payload) =>
    axiosInstance.post(
      endpoints.storeCustomerAuth.resendVerificationCode,
      payload,
    ),
  resendVerificationCodeByStore: (storeId, payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.resendVerificationCode, {
      ...payload,
      storeId,
    }),
};

export default storeCustomerAuthApi;
