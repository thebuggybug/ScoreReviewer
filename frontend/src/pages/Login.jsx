import { useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchMe, login, register, setToken } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { user, loginSuccess } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const tokenData = await login(email, password);
      setToken(tokenData.access_token);
      const me = await fetchMe();
      loginSuccess(tokenData.access_token, me);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await register(email, password);
      const tokenData = await login(email, password);
      setToken(tokenData.access_token);
      const me = await fetchMe();
      loginSuccess(tokenData.access_token, me);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="h3 mb-3">TechKraft Login</h1>
              <p className="text-muted small">
                Demo credentials are in README / .env.example
              </p>

              {error ? (
                <div className="alert alert-danger py-2">{error}</div>
              ) : null}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={busy}
                    onClick={handleRegister}
                  >
                    Register (as reviewer)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
