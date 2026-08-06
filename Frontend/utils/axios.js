import Axios from "axios";
import config from "./config"; // config.BASE_URL = "http://localhost:5000"

const axios = Axios.create({
  baseURL: config.BASE_URL + "/api",
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
      // ✅ Always return backend JSON if available
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
