import { api } from "./client";

export const authApi = {
  register: (username, email, password) =>
    api.post("/auth/register/", { username, email, password }),

  login: (username, password) =>
    api.post("/auth/login/", { username, password }),

  logout: (refreshToken) =>
    api.post("/auth/logout/", refreshToken ? { refresh: refreshToken } : {}),

  refreshToken: (refreshToken) =>
    api.post("/auth/token/refresh/", { refresh: refreshToken }),

  getMe: () => api.get("/auth/me/"),
};
