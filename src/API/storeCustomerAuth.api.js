import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const storeCustomerAuthApi = {
  register: (payload) => axiosInstance.post(endpoints.storeCustomerAuth.register, payload),
  login: (payload) => axiosInstance.post(endpoints.storeCustomerAuth.login, payload),
  guest: (payload) => axiosInstance.post(endpoints.storeCustomerAuth.guest, payload),
  verifyEmail: (payload) => axiosInstance.post(endpoints.storeCustomerAuth.verifyEmail, payload),
  resendVerificationCode: (payload) =>
    axiosInstance.post(endpoints.storeCustomerAuth.resendVerificationCode, payload),
};

export default storeCustomerAuthApi;
