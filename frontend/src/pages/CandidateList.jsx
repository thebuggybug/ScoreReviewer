import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCandidates } from "../api/client.js";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ["", "new", "reviewed", "hired", "rejected"];

function statusBadge(status) {
  const map = {
    new: "primary",
    reviewed: "info",
    hired: "success",
    rejected: "danger",
  };
  return (
    <span className={`badge text-bg-${map[status] || "secondary"}`}>
      {status}
    </span>
  );
}

export default function CandidateListPage({ user, onLogout }) {
  const [status, setStatus] = useState("");
  const [roleApplied, setRoleApplied] = useState("");
  const [skill, setSkill] = useState("");
  const [keyword, setKeyword] = useState("");
  const [offset, setOffset] = useState(0);

  const [data, setData] = useState({ items: [], total: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");

    fetchCandidates({
      status: status || undefined,
      role_applied: roleApplied || undefined,
      skill: skill || undefined,
      keyword: keyword || undefined,
      offset,
      limit: PAGE_SIZE,
    })
      .then((result) => setData(result))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, roleApplied, skill, keyword, offset]);

  function applyFilters(event) {
    event.preventDefault();
    setOffset(0);
  }

  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < data.total;
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand">TechKraft</span>
          <span className="navbar-text text-white-50 small">
            {user.email} ({user.role})
          </span>
          <button
            type="button"
            className="btn btn-outline-light btn-sm ms-auto"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container pb-4">
        <h1 className="h3 mb-3">Candidates</h1>

        <div className="card mb-3">
          <div className="card-body">
            <form onSubmit={applyFilters}>
              <div className="row g-2">
                <div className="col-md-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setOffset(0);
                    }}
                  >
                    {STATUS_OPTIONS.map((value) => (
                      <option key={value || "all"} value={value}>
                        {value || "All"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Role</label>
                  <input
                    className="form-control"
                    value={roleApplied}
                    onChange={(e) => {
                      setRoleApplied(e.target.value);
                      setOffset(0);
                    }}
                    placeholder="e.g. Backend Engineer"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Skill</label>
                  <input
                    className="form-control"
                    value={skill}
                    onChange={(e) => {
                      setSkill(e.target.value);
                      setOffset(0);
                    }}
                    placeholder="e.g. Python"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Keyword</label>
                  <input
                    className="form-control"
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setOffset(0);
                    }}
                    placeholder="name or email"
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary btn-sm">
                    Apply filters
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-striped table-hover bg-white">
                <thead className="table-dark">
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((candidate) => (
                    <tr key={candidate.id}>
                      <td>{candidate.name}</td>
                      <td>{candidate.role_applied}</td>
                      <td>{statusBadge(candidate.status)}</td>
                      <td>
                        <Link
                          className="btn btn-sm btn-outline-primary"
                          to={`/candidates/${candidate.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.items.length === 0 ? (
              <p className="text-muted">No candidates found.</p>
            ) : null}

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={!canPrev}
                onClick={() => setOffset(offset - PAGE_SIZE)}
              >
                Previous
              </button>
              <span className="text-muted small">
                Page {pageNumber} of {totalPages} ({data.total} total)
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={!canNext}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
