import axios from "axios";
import { getSession } from "next-auth/react";
import { axiosPath, getApiBase } from "@/shared/lib/api-base";

const api = axios.create({
  baseURL: getApiBase(),
});

api.interceptors.request.use(async (config) => {
  config.url = axiosPath(config.url);
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

export default api;
