import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchCandidate,
  generateSummary,
  submitScore,
  updateInternalNotes,
} from "../api/client.js";

const CATEGORIES = [
  "Technical",
  "Communication",
  "Culture",
  "Leadership",
  "Problem Solving",
];

export default function CandidateDetailPage({ user, onLogout }) {
  const { id } = useParams();
  const isAdmin = user.role === "admin";

  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [score, setScore] = useState(3);
  const [note, setNote] = useState("");
  const [scoreBusy, setScoreBusy] = useState(false);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [notesBusy, setNotesBusy] = useState(false);

  function loadCandidate() {
    setLoading(true);
    setError("");

    fetchCandidate(id)
      .then((data) => {
        setCandidate(data);
        if (data.internal_notes) {
          setInternalNotes(data.internal_notes);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCandidate();
  }, [id]);

  async function handleSubmitScore(event) {
    event.preventDefault();
    setScoreBusy(true);
    setError("");

    try {
      await submitScore(id, {
        category,
        score: Number(score),
        note: note || null,
      });
      setNote("");
      loadCandidate();
    } catch (err) {
      setError(err.message);
    } finally {
      setScoreBusy(false);
    }
  }

  async function handleGenerateSummary() {
    setSummaryLoading(true);
    setError("");

    try {
      const result = await generateSummary(id);
      setCandidate((prev) => ({ ...prev, summary: result.summary }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleSaveNotes(event) {
    event.preventDefault();
    setNotesBusy(true);
    setError("");

    try {
      const updated = await updateInternalNotes(id, internalNotes);
      setCandidate((prev) => ({
        ...prev,
        internal_notes: updated.internal_notes,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setNotesBusy(false);
    }
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand">TechKraft</span>
          <span className="navbar-text text-white-50 small">
            {user.email} ({user.role})
          </span>
          <div className="ms-auto d-flex gap-2">
            <Link to="/" className="btn btn-outline-light btn-sm">
              Back to list
            </Link>
            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container pb-4">
        <h1 className="h3 mb-3">Candidate detail</h1>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : null}

        {!loading && candidate && (
          <div className="row g-3">
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">Profile</div>
                <div className="card-body">
                  <p className="mb-1">
                    <strong>{candidate.name}</strong>
                  </p>
                  <p className="mb-1 text-muted">{candidate.email}</p>
                  <p className="mb-1">Role: {candidate.role_applied}</p>
                  <p className="mb-1">Status: {candidate.status}</p>
                  <p className="mb-0">
                    Skills: {(candidate.skills || []).join(", ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  Scores {isAdmin ? "(all reviewers)" : "(your scores)"}
                </div>
                <div className="card-body p-0">
                  {candidate.scores?.length === 0 ? (
                    <p className="text-muted p-3 mb-0">No scores yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm mb-0">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Score</th>
                            <th>Reviewer ID</th>
                            <th>Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {candidate.scores.map((row) => (
                            <tr key={row.id}>
                              <td>{row.category}</td>
                              <td>{row.score}</td>
                              <td>{row.reviewer_id}</td>
                              <td>{row.note || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">Submit score</div>
                <div className="card-body">
                  <form onSubmit={handleSubmitScore}>
                    <div className="mb-3">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {CATEGORIES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Score (1–5)</label>
                      <select
                        className="form-select"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Note (optional)</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={scoreBusy}
                    >
                      {scoreBusy ? "Saving..." : "Save score"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">AI summary</div>
                <div className="card-body">
                  {summaryLoading ? (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Generating summary...
                    </div>
                  ) : (
                    <p className="mb-3">
                      {candidate.summary || "No summary yet."}
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    disabled={summaryLoading}
                    onClick={handleGenerateSummary}
                  >
                    {summaryLoading ? "Generating..." : "Generate AI summary"}
                  </button>
                </div>
              </div>
            </div>

            {isAdmin ? (
              <div className="col-12">
                <div className="card border-warning">
                  <div className="card-header bg-warning-subtle">
                    Internal notes
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSaveNotes}>
                      <textarea
                        className="form-control mb-3"
                        rows={4}
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn btn-warning"
                        disabled={notesBusy}
                      >
                        {notesBusy ? "Saving..." : "Save internal notes"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
