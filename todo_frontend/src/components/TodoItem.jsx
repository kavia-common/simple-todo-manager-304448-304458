import React, { useEffect, useRef, useState } from "react";

/**
 * Presentational + inline-edit todo item.
 * Kept as a controlled component with minimal internal state.
 */
// PUBLIC_INTERFACE
export default function TodoItem({
  todo,
  busy = false,
  onToggle,
  onDelete,
  onUpdateTitle,
}) {
  /** Renders a single todo row with checkbox, inline editing, and actions. */
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);
  const inputRef = useRef(null);

  useEffect(() => {
    // Keep draft in sync if parent updates title externally.
    setDraftTitle(todo.title);
  }, [todo.title]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const canInteract = !busy;

  async function commitEdit() {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) return; // disallow empty title
    if (nextTitle === todo.title) {
      setIsEditing(false);
      return;
    }
    await onUpdateTitle(todo.id, nextTitle);
    setIsEditing(false);
  }

  function cancelEdit() {
    setDraftTitle(todo.title);
    setIsEditing(false);
  }

  return (
    <li className={`todoItem ${todo.completed ? "isCompleted" : ""}`}>
      <button
        type="button"
        className="checkButton"
        onClick={() => onToggle(todo.id)}
        disabled={!canInteract}
        aria-label={todo.completed ? "Mark as not completed" : "Mark as completed"}
        title={todo.completed ? "Mark active" : "Mark completed"}
      >
        <span className={`checkCircle ${todo.completed ? "checked" : ""}`} />
      </button>

      <div className="todoMain">
        {isEditing ? (
          <input
            ref={inputRef}
            className="todoEditInput"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            disabled={!canInteract}
            aria-label="Edit todo title"
          />
        ) : (
          <div className="todoTitleRow">
            <span className="todoTitle" title={todo.title}>
              {todo.title}
            </span>
          </div>
        )}

        <div className="todoMeta">
          <span className="todoHint">
            {todo.completed ? "Completed" : "Active"}
          </span>
        </div>
      </div>

      <div className="todoActions">
        {isEditing ? (
          <>
            <button
              type="button"
              className="btn btnPrimary"
              onClick={commitEdit}
              disabled={!canInteract || !draftTitle.trim()}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btnGhost"
              onClick={cancelEdit}
              disabled={!canInteract}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btnGhost"
              onClick={() => setIsEditing(true)}
              disabled={!canInteract}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btnDanger"
              onClick={() => onDelete(todo.id)}
              disabled={!canInteract}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}
