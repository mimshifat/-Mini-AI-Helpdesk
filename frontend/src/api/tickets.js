import { api } from "./client";

export const ticketsApi = {
  getTickets: (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.search?.trim()) cleanParams.search = params.search.trim();
    if (params.status && params.status !== "All")
      cleanParams.status = params.status;
    if (params.priority && params.priority !== "All")
      cleanParams.priority = params.priority;
    if (params.category && params.category !== "All")
      cleanParams.category = params.category;

    return api.get("/tickets/", { params: cleanParams });
  },

  getTicket: (id) => api.get(`/tickets/${id}/`),

  createTicket: (data) => api.post("/tickets/", data),

  updateTicket: (id, data) => api.patch(`/tickets/${id}/`, data),

  deleteTicket: (id) => api.delete(`/tickets/${id}/`),
};
