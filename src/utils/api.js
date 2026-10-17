const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.detail || payload?.error || "ToxiGuard API request failed.");
  }

  return payload;
}

export function analyzeMoleculeWithBackend(input) {
  return request("/api/analyze/molecule", {
    method: "POST",
    body: JSON.stringify({ input }),
  });
}

export function analyzePeptideWithBackend(sequence) {
  return request("/api/analyze/peptide", {
    method: "POST",
    body: JSON.stringify({ sequence }),
  });
}

export function analyzeMoleculeBatch(items) {
  return request("/api/analyze/molecule/batch", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export function checkBackend() {
  return request("/api/health");
}

export async function analyzeFileWithBackend(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/analyze/file`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.detail || payload?.error || "Could not analyze the uploaded file.");
  }
  return payload;
}
