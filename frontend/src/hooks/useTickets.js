import { useState, useEffect, useCallback } from "react";
import { ticketsApi } from "../api/tickets";
import { useDebounce } from "./useDebounce";

/**
 * useTickets
 * Manages ticket listing, search, multi-field filtering, and server-side pagination.
 */
export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, status, priority, category]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ticketsApi.getTickets({
        page: currentPage,
        search: debouncedSearch,
        status,
        priority,
        category,
      });

      setTickets(data.results || []);
      setCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 10) || 1);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError(err.message || "Failed to fetch tickets from server.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, status, priority, category]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatus("All");
    setPriority("All");
    setCategory("All");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters =
    search || status !== "All" || priority !== "All" || category !== "All";

  return {
    tickets,
    count,
    totalPages,
    currentPage,
    setCurrentPage,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    priority,
    setPriority,
    category,
    setCategory,
    hasActiveFilters,
    resetFilters,
    refresh: fetchTickets,
  };
}
