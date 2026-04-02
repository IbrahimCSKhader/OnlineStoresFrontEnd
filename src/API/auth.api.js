import axiosInstance from "./axiosInstance.js";
import endpoints from "./endpoints.js";

export const authApi = {
  register: (payload) => axiosInstance.post(endpoints.auth.register, payload),
  login: (payload) => axiosInstance.post(endpoints.auth.login, payload),
  verifyEmail: (payload) => axiosInstance.post(endpoints.auth.verifyEmail, payload),
  resendVerificationCode: (payload) =>
    axiosInstance.post(endpoints.auth.resendVerificationCode, payload),
  forgotPassword: (payload) => axiosInstance.post(endpoints.auth.forgotPassword, payload),
  resetPassword: (payload) => axiosInstance.post(endpoints.auth.resetPassword, payload),
  logout: () => axiosInstance.post(endpoints.auth.logout),
  createOwner: (payload) => axiosInstance.post(endpoints.auth.createOwner, payload),
  getGoogleAuthUrl: () => endpoints.auth.google,
  getGoogleCallbackUrl: () => endpoints.auth.googleCallback,
};

export default authApi;
