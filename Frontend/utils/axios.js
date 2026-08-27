import Axios from "axios";
import config from "./config";

const axios = Axios.create({
  baseURL: config.BASE_URL + "/api",
  withCredentials: true,
});

// Attach token automatically
axios.interceptors.request.use(
  (configuration) => {
    const token = localStorage.getItem("@token");
    if (token) {
      configuration.headers["Authorization"] = `Bearer ${token}`;
    }
    return configuration;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isTokenExpired =
      error.response?.status === 401 ||
      error.response?.data?.error === "jwt expired"; // 👈 sahi check

    if (isTokenExpired && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post("/auth/refresh");
        console.log(res.data  )
        if (res.data.status && res.data.token) {   // 👈 res.data use karo
          localStorage.setItem("@token", res.data.token);
          axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
          return axios(originalRequest); // retry original request
        }
      } catch (refreshError) {
        localStorage.removeItem("@token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);


const requests = {
  get: async (route, params = {}, controller = new AbortController()) => {
    try {
      const res = await axios.get(route, { params, signal: controller.signal });
      return res.data;
    } catch (err) {
      return err.response?.data ?? { status: false, message: "Something went wrong!" };
    }
  },

  post: async (route, data) => {
    try {
      const res = await axios.post(route, data);
      return res.data;
    } catch (err) {
      return err.response?.data ?? { status: false, message: "Something went wrong!" };
    }
  },

  put: async (route, data) => {
    try {
      const res = await axios.put(route, data);
      return res.data;
    } catch (err) {
      return err.response?.data ?? { status: false, message: "Something went wrong!" };
    }
  },

  patch: async (route, data) => {
    try {
      const res = await axios.patch(route, data);
      return res.data;
    } catch (err) {
      return err.response?.data ?? { status: false, message: "Something went wrong!" };
    }
  },

  delete: async (route, data) => {
    try {
      const res = await axios.delete(route, { data });
      return res.data;
    } catch (err) {
      return err.response?.data ?? { status: false, message: "Something went wrong!" };
    }
  },
};

export default requests;
