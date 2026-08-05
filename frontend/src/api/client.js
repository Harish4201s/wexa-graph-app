const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (networkErr) {
    // Backend/CognoDB completely unreachable (server down, no network, etc.)
    throw new ApiError(
      'Could not reach the server. Is the backend running and reachable?',
      0
    );
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse errors, keep default message
    }
    throw new ApiError(message, res.status);
  }

  return res.json();
}

export const api = {
  health: () => request('/health'),
  listDevelopers: () => request('/developers'),
  getDeveloper: (id) => request(`/developers/${id}`),
  getRecommendations: (id) => request(`/developers/${id}/recommendations`),
  getShortestPath: (fromId, toId) => request(`/developers/path/${fromId}/${toId}`),
  listProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  listSkills: () => request('/skills'),
  topEndorsedForSkill: (name) => request(`/skills/${encodeURIComponent(name)}/top-endorsed`),
  getGraph: () => request('/graph'),
  connectedViaTwoProjects: () => request('/graph/connected-via-two-projects'),
};

export { ApiError };
