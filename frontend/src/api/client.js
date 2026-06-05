const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || response.statusText;
    const error = new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(email, password) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe() {
  return request("/auth/me");
}

export function fetchCandidates(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return request(`/candidates${query ? `?${query}` : ""}`);
}

export function fetchCandidate(id) {
  return request(`/candidates/${id}`);
}

export function submitScore(candidateId, body) {
  return request(`/candidates/${candidateId}/scores`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function generateSummary(candidateId) {
  return request(`/candidates/${candidateId}/summary`, {
    method: "POST",
  });
}

export function updateInternalNotes(candidateId, internal_notes) {
  return request(`/candidates/${candidateId}/internal-notes`, {
    method: "PATCH",
    body: JSON.stringify({ internal_notes }),
  });
}
