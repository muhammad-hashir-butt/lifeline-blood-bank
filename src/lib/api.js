const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("lifeline_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("lifeline_token", token);
  else localStorage.removeItem("lifeline_token");
}

export async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

export const authApi = {
  register: (body) => api("/auth/register", { method: "POST", body }),
  login: (body) => api("/auth/login", { method: "POST", body }),
  me: () => api("/auth/me"),
};

export const dashboardApi = {
  get: () => api("/dashboard"),
};

export const inventoryApi = {
  list: () => api("/inventory"),
  create: (body) => api("/inventory", { method: "POST", body }),
  update: (id, body) => api(`/inventory/${id}`, { method: "PATCH", body }),
  remove: (id) => api(`/inventory/${id}`, { method: "DELETE" }),
};

export const donorsApi = {
  list: () => api("/donors"),
  count: () => api("/donors/count"),
  create: (body) => api("/donors", { method: "POST", body }),
  update: (id, body) => api(`/donors/${id}`, { method: "PATCH", body }),
  remove: (id) => api(`/donors/${id}`, { method: "DELETE" }),
  donate: (id, body) => api(`/donors/${id}/donate`, { method: "POST", body }),
  history: (id) => api(`/donors/${id}/history`),
};

export const requestsApi = {
  list: (limit) => api(`/requests${limit ? `?limit=${limit}` : ""}`),
  create: (body) => api("/requests", { method: "POST", body }),
  match: (id) => api(`/requests/${id}/match`),
  allocate: (id, inventory_id) =>
    api(`/requests/${id}/allocate`, { method: "POST", body: { inventory_id } }),
  alertDonors: (id) => api(`/requests/${id}/alert-donors`, { method: "POST" }),
  update: (id, body) => api(`/requests/${id}`, { method: "PATCH", body }),
  remove: (id) => api(`/requests/${id}`, { method: "DELETE" }),
};

export const alertsApi = {
  list: () => api("/alerts"),
  broadcast: (body) => api("/alerts/broadcast", { method: "POST", body }),
};

export const predictionApi = {
  get: () => api("/prediction"),
  addMonth: (body) => api("/prediction/months", { method: "POST", body }),
};
