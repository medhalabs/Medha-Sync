import axios from "axios";
import { getSession } from "next-auth/react";
import { getApiBase } from "@/shared/lib/api-base";

const api = axios.create({
  baseURL: getApiBase(),
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

export default api;
