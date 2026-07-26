"use client";

import { useId, useState } from "react";

// Turns questions.js's generated questions into checkable checklist cards
// (spec's "QUESTIONS TO ASK" section). Check state is local/ephemeral —
// this is a reading aid for the conversation with the restaurant, not
// stored data.
export default function QuestionChecklist({ questions = [] }) {
  const [checked, setChecked] = useState(() => new Set());
  const baseId = useId();

  if (questions.length === 0) return null;

  function toggle(index) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <ul className="flex flex-col gap-2">
      {questions.map((question, i) => {
        const id = `${baseId}-${i}`;
        return (
          <li key={id}>
            <label
              htmlFor={id}
              className="flex min-h-11 items-start gap-3 rounded-2xl border border-border bg-card p-3 text-sm text-text"
            >
              <input
                id={id}
                type="checkbox"
                checked={checked.has(i)}
                onChange={() => toggle(i)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              {question}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
