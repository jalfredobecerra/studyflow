"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import type {
  ApiErrorResponse,
  StudySetDetailResponse,
  StudySetListResponse,
  StudySetSummary,
} from "@/lib/study-set-api-types";

/** Demonstrates browser fetch -> App Router API handler -> PostgreSQL. */
export default function StudySetApiLibrary() {
  const [sets, setSets] = useState<StudySetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/v1/study-sets", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to load study sets.");
        const data: StudySetListResponse = await response.json();
        setSets(data.studySets);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load study sets."
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  function edit(set: StudySetSummary) {
    setEditingId(set.id);
    setTitle(set.title);
    setError("");
    setSuccess("");
  }

  async function save(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const normalized = title.trim();
    if (normalized.length < 2 || normalized.length > 120) {
      setError("Title must contain 2–120 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/v1/study-sets/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: normalized }),
      });

      if (!response.ok) {
        const data: ApiErrorResponse = await response.json();
        throw new Error(data.error || "Unable to rename study set.");
      }

      const data: StudySetDetailResponse = await response.json();
      setSets((current) =>
        current.map((set) => (set.id === id ? data.studySet : set))
      );
      setEditingId(null);
      setSuccess("Study set title saved.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to rename study set."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <p role="status" className="text-slate-700">
        Loading your study sets...
      </p>
    );

  return (
    <div className="space-y-5" data-testid="study-set-api-library">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-800"
        >
          {success}
        </p>
      )}

      {sets.length === 0 && !error && (
        <p className="text-slate-700">
          You have no study sets yet. Create your first one to get started.
        </p>
      )}

      <ul className="space-y-4">
        {sets.map((set) => (
          <li
            key={set.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            {editingId === set.id ? (
              <form
                onSubmit={(event) => void save(event, set.id)}
                className="space-y-3"
              >
                <label
                  htmlFor={`rename-${set.id}`}
                  className="block font-semibold text-slate-900"
                >
                  Rename study set
                </label>
                <input
                  id={`rename-${set.id}`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  minLength={2}
                  maxLength={120}
                  required
                  className="w-full rounded-lg border border-slate-400 px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-700"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-indigo-700 px-4 py-2 font-medium text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save title"}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-slate-400 px-4 py-2 text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {set.title}
                </h2>
                <p className="text-sm text-slate-700">
                  {set.cardCount} active cards · {set.acceptedCount} accepted
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <Link
                    href={`/studysets/${set.id}`}
                    className="font-medium text-indigo-800 underline"
                  >
                    Open cards
                  </Link>
                  <Link
                    href={`/studysets/manage/${set.id}`}
                    className="font-medium text-indigo-800 underline"
                  >
                    Manage / delete
                  </Link>
                  <button
                    type="button"
                    onClick={() => edit(set)}
                    className="font-medium text-indigo-800 underline"
                  >
                    Rename
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
