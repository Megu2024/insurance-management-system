import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import FormInput from "../components/FormInput";
import ErrorMessage from "../components/ErrorMessage";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      const role = res.user?.role;

      // Role-specific navigation
      if (role === "ADMIN") {
        navigate("/dashboard");
      } else if (role === "CUSTOMER") {
        navigate("/customer/dashboard");
      } else if (role === "AGENT") {
        navigate("/agent/dashboard");
      } else if (role === "SURVEYOR") {
        navigate("/surveyor/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || "Login failed. Please check your credentials.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <ShieldCheck size={32} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your Insurance Management account</p>
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

        <form onSubmit={handleSubmit}>
          <FormInput
            label="Email Address or Username"
            name="email"
            type="text"
            placeholder="e.g. admin@insurance.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FormInput
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "8px", padding: "10px" }}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? "Signing In..." : "Sign In"}</span>
          </button>
        </form>


        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
