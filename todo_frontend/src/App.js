import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import TodoItem from "./components/TodoItem";
import {
  createTodo,
  deleteTodo,
  listTodos,
  toggleTodo,
  updateTodo,
} from "./api/client";

const FILTERS = /** @type {const} */ (["all", "active", "completed"]);

// PUBLIC_INTERFACE
function App() {
  /** Main Todo app UI that integrates with the backend API. */
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");

  const [newTitle, setNewTitle] = useState("");

  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");

  const filteredTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const counts = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }, [todos]);

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const data = await listTodos();
      setTodos(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load todos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setError("");
    setMutating(true);
    try {
      const created = await createTodo({ title });
      // Backend lists newest first; keep that behavior locally too.
      setTodos((prev) => [created, ...prev]);
      setNewTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add todo");
    } finally {
      setMutating(false);
    }
  }

  async function handleToggle(id) {
    setError("");
    // Optimistic UI for snappier feel.
    const prevTodos = todos;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

    setMutating(true);
    try {
      const updated = await toggleTodo(id);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setTodos(prevTodos);
      setError(err instanceof Error ? err.message : "Failed to toggle todo");
    } finally {
      setMutating(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    const prevTodos = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));

    setMutating(true);
    try {
      await deleteTodo(id);
    } catch (err) {
      setTodos(prevTodos);
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    } finally {
      setMutating(false);
    }
  }

  async function handleUpdateTitle(id, title) {
    setError("");
    const existing = todos.find((t) => t.id === id);
    if (!existing) return;

    const prevTodos = todos;
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));

    setMutating(true);
    try {
      const updated = await updateTodo({
        id,
        title,
        completed: existing.completed,
      });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setTodos(prevTodos);
      setError(err instanceof Error ? err.message : "Failed to update todo");
      throw err;
    } finally {
      setMutating(false);
    }
  }

  return (
    <div className="appShell">
      <main className="container">
        <header className="header">
          <div>
            <h1 className="title">Todos</h1>
            <p className="subtitle">
              Simple, fast, and synced with your backend.
            </p>
          </div>

          <div className="statusPills" aria-label="Todo counts">
            <span className="pill">
              <span className="pillLabel">Active</span>
              <span className="pillValue">{counts.active}</span>
            </span>
            <span className="pill pillSuccess">
              <span className="pillLabel">Completed</span>
              <span className="pillValue">{counts.completed}</span>
            </span>
          </div>
        </header>

        <section className="card" aria-label="Add a todo">
          <form className="addForm" onSubmit={handleAdd}>
            <input
              className="input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a task…"
              aria-label="New todo title"
              disabled={loading || mutating}
            />
            <button
              type="submit"
              className="btn btnPrimary"
              disabled={loading || mutating || !newTitle.trim()}
            >
              Add
            </button>
          </form>

          <div className="toolbar">
            <div className="filters" role="tablist" aria-label="Filters">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`filterBtn ${filter === f ? "active" : ""}`}
                  onClick={() => setFilter(f)}
                  disabled={loading}
                  role="tab"
                  aria-selected={filter === f}
                >
                  {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btnGhost"
              onClick={refresh}
              disabled={loading || mutating}
              aria-label="Refresh todos"
            >
              Refresh
            </button>
          </div>

          {error ? (
            <div className="alert" role="alert">
              <div className="alertTitle">Something went wrong</div>
              <div className="alertBody">{error}</div>
            </div>
          ) : null}

          {loading ? (
            <div className="loading" aria-live="polite">
              Loading todos…
            </div>
          ) : (
            <>
              {filteredTodos.length === 0 ? (
                <div className="emptyState">
                  <div className="emptyTitle">No todos</div>
                  <div className="emptyBody">
                    {filter === "all"
                      ? "Add your first task above."
                      : filter === "active"
                        ? "You have no active tasks."
                        : "You have no completed tasks."}
                  </div>
                </div>
              ) : (
                <ul className="todoList" aria-label="Todo list">
                  {filteredTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      busy={mutating}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onUpdateTitle={handleUpdateTitle}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <footer className="footer">
          <span className="footerText">
            Backend: <code>http://localhost:3001</code>
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
