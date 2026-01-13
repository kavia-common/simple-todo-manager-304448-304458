const API_BASE_URL = "http://localhost:3001";

/**
 * Parse an error body safely; backend uses JSON `{"detail": ...}` in FastAPI for errors.
 */
async function parseErrorBody(response) {
  try {
    const data = await response.json();
    if (data && typeof data === "object") {
      if (typeof data.detail === "string") return data.detail;
      return JSON.stringify(data);
    }
    return String(data);
  } catch {
    return response.statusText || "Request failed";
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    throw new Error(msg);
  }

  // 204 No Content (delete)
  if (res.status === 204) return null;

  return res.json();
}

// PUBLIC_INTERFACE
export async function listTodos() {
  /** Fetch all todos. Returns {items, total}. */
  return request("/todos");
}

// PUBLIC_INTERFACE
export async function createTodo({ title }) {
  /** Create a todo with title. Returns created todo. */
  return request("/todos", {
    method: "POST",
    body: JSON.stringify({ title, completed: false }),
  });
}

// PUBLIC_INTERFACE
export async function updateTodo({ id, title, completed }) {
  /** Update a todo (full update semantics). Returns updated todo. */
  return request(`/todos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, completed }),
  });
}

// PUBLIC_INTERFACE
export async function deleteTodo(id) {
  /** Delete a todo by id. Returns null. */
  return request(`/todos/${id}`, { method: "DELETE" });
}

// PUBLIC_INTERFACE
export async function toggleTodo(id) {
  /** Toggle completion state for a todo. Returns updated todo. */
  return request(`/todos/${id}/toggle`, { method: "PATCH" });
}
