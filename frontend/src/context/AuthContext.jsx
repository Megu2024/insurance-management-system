import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, getCurrentUser, registerCustomer as apiRegCustomer, registerAgent as apiRegAgent, registerSurveyor as apiRegSurveyor } from "../services/authService";

const AuthContext = createContext(null);

const resolveDisplayName = (userData, detailsData) => {
  if (userData?.role === "ADMIN") return "System Administrator";
  if (detailsData) {
    if (detailsData.first_name || detailsData.last_name) {
      return `${detailsData.first_name || ""} ${detailsData.last_name || ""}`.trim();
    }
    if (detailsData.agent_name) return detailsData.agent_name;
    if (detailsData.surveyor_name) return detailsData.surveyor_name;
  }
  if (userData?.name && !userData.name.includes("@")) return userData.name;
  if (userData?.username && !userData.username.includes("@")) return userData.username;
  return userData?.name || userData?.username || "User";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("ims_user");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed) {
        parsed.name = resolveDisplayName(parsed, parsed.details);
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("ims_token"));
  const [loading, setLoading] = useState(true);

  // Sync / verify token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("ims_token");
      if (storedToken) {
        try {
          const profile = await getCurrentUser();
          const resolvedName = resolveDisplayName(profile.user, profile.details);
          const fullUser = {
            ...profile.user,
            name: resolvedName,
            details: profile.details
          };
          setUser(fullUser);
          localStorage.setItem("ims_user", JSON.stringify(fullUser));
        } catch (err) {
          console.warn("Session verification failed:", err.message);
          localStorage.removeItem("ims_token");
          localStorage.removeItem("ims_user");
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    localStorage.setItem("ims_token", data.token);
    const resolvedName = resolveDisplayName(data.user, null);
    const fullUser = {
      ...data.user,
      name: resolvedName
    };
    localStorage.setItem("ims_user", JSON.stringify(fullUser));
    setToken(data.token);
    setUser(fullUser);
    return data;
  };

  const registerCustomer = async (formData) => {
    const data = await apiRegCustomer(formData);
    if (data.token) {
      localStorage.setItem("ims_token", data.token);
      const resolvedName = `${formData.first_name || ""} ${formData.last_name || ""}`.trim() || data.user.name;
      const fullUser = {
        ...data.user,
        name: resolvedName,
        details: data.customer
      };
      localStorage.setItem("ims_user", JSON.stringify(fullUser));
      setToken(data.token);
      setUser(fullUser);
    }
    return data;
  };

  const registerAgent = async (formData) => {
    return await apiRegAgent(formData);
  };

  const registerSurveyor = async (formData) => {
    return await apiRegSurveyor(formData);
  };

  const logout = () => {
    localStorage.removeItem("ims_token");
    localStorage.removeItem("ims_user");
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = !!token && !!user;
  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        isAuthenticated,
        login,
        logout,
        registerCustomer,
        registerAgent,
        registerSurveyor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
