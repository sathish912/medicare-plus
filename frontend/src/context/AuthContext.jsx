import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerPatient, registerDoctor, registerAdmin, getCurrentUser } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("mcp_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mcp_token");
    if (token) {
      getCurrentUser()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("mcp_user", JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem("mcp_token");
          localStorage.removeItem("mcp_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const { access_token, role, user_id, full_name } = res.data;
    localStorage.setItem("mcp_token", access_token);
    const basicUser = { id: user_id, role, full_name };
    localStorage.setItem("mcp_user", JSON.stringify(basicUser));
    setUser(basicUser);
    return basicUser;
  };

  const register = async (payload, adminSecret = null) => {
    let res;
    if (payload.role === "doctor") {
      res = await registerDoctor(payload);
    } else if (payload.role === "admin") {
      res = await registerAdmin(payload, adminSecret);
    } else {
      res = await registerPatient(payload);
    }
    const { access_token, role, user_id, full_name } = res.data;
    localStorage.setItem("mcp_token", access_token);
    const basicUser = { id: user_id, role, full_name };
    localStorage.setItem("mcp_user", JSON.stringify(basicUser));
    setUser(basicUser);
    return basicUser;
  };

  const logout = () => {
    localStorage.removeItem("mcp_token");
    localStorage.removeItem("mcp_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
