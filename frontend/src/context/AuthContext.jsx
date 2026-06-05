import { createContext, useContext, useEffect, useState } from "react";
import { fetchMe, setToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMe()
      .then((data) => setUser(data))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function loginSuccess(token, userData) {
    setToken(token);
    setUser(userData);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAdmin: user?.role === "admin",
    loginSuccess,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
