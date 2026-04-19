import axios from "axios";

const normalizeApiBaseUrl = (rawUrl) => {
  const fallback = "http://localhost:5000/api";
  const source = (rawUrl || fallback).trim();
  const clean = source.replace(/\/+$/, "");
  return clean.endsWith("/api") ? clean : `${clean}/api`;
};

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
