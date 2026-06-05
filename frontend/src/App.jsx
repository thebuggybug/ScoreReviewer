import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import CandidateDetailPage from "./pages/CandidateDetail.jsx";
import CandidateListPage from "./pages/CandidateList.jsx";
import LoginPage from "./pages/Login.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { user, logout } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CandidateListPage user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidates/:id"
        element={
          <ProtectedRoute>
            <CandidateDetailPage user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
