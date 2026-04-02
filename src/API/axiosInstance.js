import axios from "axios";
import { setupInterceptors } from "./interceptors.js";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "https://mawja.premiumasp.net";

const axiosInstance = setupInterceptors(
  axios.create({
    baseURL,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      token: localStorage.getItem("token"),
    },
    timeout: 30000,
  }),
);

export default axiosInstance;
