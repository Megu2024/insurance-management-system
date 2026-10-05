import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getBranches } from "../services/branchService";
import FormInput from "../components/FormInput";
import SelectInput from "../components/SelectInput";
import ErrorMessage from "../components/ErrorMessage";
import "./Auth.css";

const Register = () => {
  const [activeTab, setActiveTab] = useState("customer"); // 'customer' | 'agent' | 'surveyor'
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { registerCustomer, registerAgent, registerSurveyor } = useAuth();
  const navigate = useNavigate();

  // Load branches for agent dropdown
  useEffect(() => {
    getBranches()
      .then((data) => setBranches(data))
      .catch((err) => console.error("Error loading branches:", err));
  }, []);

  // Customer Form State
  const [custForm, setCustForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    mobile_no: "",
    city: "",
    state: "",
    pincode: "",
    occupation: "",
    annual_income: ""
  });

  // Agent Form State
  const [agentForm, setAgentForm] = useState({
    agent_name: "",
    email: "",
    password: "",
    mobile_no: ""
  });

  // Surveyor Form State
  const [surveyorForm, setSurveyorForm] = useState({
    surveyor_name: "",
    email: "",
    password: "",
    phone: "",
    experience: ""
  });

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await registerCustomer(custForm);
      navigate("/customer/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await registerAgent(agentForm);
      setSuccessMsg(res.message || "Agent application submitted successfully. Your account is pending admin approval.");
    } catch (err) {
      setError(err.response?.data?.error || "Application submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSurveyorSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await registerSurveyor(surveyorForm);
      setSuccessMsg(res.message || "Surveyor application submitted successfully. Your account is pending admin approval.");
    } catch (err) {
      setError(err.response?.data?.error || "Application submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <ShieldCheck size={32} />
          </div>
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">Select your account type to get started</p>
        </div>

        {/* Account Type Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === "customer" ? "active" : ""}`}
            onClick={() => { setActiveTab("customer"); setError(""); setSuccessMsg(""); }}
          >
            Customer (Instant)
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "agent" ? "active" : ""}`}
            onClick={() => { setActiveTab("agent"); setError(""); setSuccessMsg(""); }}
          >
            Agent Application
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "surveyor" ? "active" : ""}`}
            onClick={() => { setActiveTab("surveyor"); setError(""); setSuccessMsg(""); }}
          >
            Surveyor Application
          </button>
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

        {successMsg && (
          <div className="status-badge badge-warning" style={{ display: "flex", gap: "8px", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "13.5px" }}>
            <CheckCircle2 size={20} color="#b45309" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. CUSTOMER FORM */}
        {activeTab === "customer" && (
          <form onSubmit={handleCustomerSubmit}>
            <div className="grid-2">
              <FormInput
                label="First Name"
                name="first_name"
                value={custForm.first_name}
                onChange={(e) => setCustForm({ ...custForm, first_name: e.target.value })}
                required
              />
              <FormInput
                label="Last Name"
                name="last_name"
                value={custForm.last_name}
                onChange={(e) => setCustForm({ ...custForm, last_name: e.target.value })}
                required
              />
            </div>

            <div className="grid-2">
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={custForm.email}
                onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                required
              />
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={custForm.password}
                onChange={(e) => setCustForm({ ...custForm, password: e.target.value })}
                required
              />
            </div>

            <div className="grid-2">
              <FormInput
                label="Mobile Number"
                name="mobile_no"
                value={custForm.mobile_no}
                onChange={(e) => setCustForm({ ...custForm, mobile_no: e.target.value })}
              />
              <FormInput
                label="City"
                name="city"
                value={custForm.city}
                onChange={(e) => setCustForm({ ...custForm, city: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <FormInput
                label="State"
                name="state"
                value={custForm.state}
                onChange={(e) => setCustForm({ ...custForm, state: e.target.value })}
              />
              <FormInput
                label="Annual Income / Salary (₹)"
                name="annual_income"
                type="number"
                min="0"
                placeholder="e.g. 750000"
                value={custForm.annual_income}
                onChange={(e) => setCustForm({ ...custForm, annual_income: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "12px", padding: "10px" }}
              disabled={loading}
            >
              <UserCheck size={18} />
              <span>{loading ? "Registering..." : "Register as Customer"}</span>
            </button>
          </form>
        )}

        {/* 2. AGENT APPLICATION FORM */}
        {activeTab === "agent" && (
          <form onSubmit={handleAgentSubmit}>
            <div className="grid-2">
              <FormInput
                label="Agent Full Name"
                name="agent_name"
                placeholder="e.g. Rahul Sharma"
                value={agentForm.agent_name}
                onChange={(e) => setAgentForm({ ...agentForm, agent_name: e.target.value })}
                required
              />
              <FormInput
                label="Mobile Number"
                name="mobile_no"
                placeholder="e.g. 9876543210"
                value={agentForm.mobile_no}
                onChange={(e) => setAgentForm({ ...agentForm, mobile_no: e.target.value })}
                required
              />
            </div>

            <div className="grid-2">
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                placeholder="e.g. agent@insurance.com"
                value={agentForm.email}
                onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                required
              />
              <FormInput
                label="Password"
                name="password"
                type="password"
                placeholder="Enter secure password"
                value={agentForm.password}
                onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
                required
              />
            </div>

            <div style={{ padding: "12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "12.5px", color: "#1e40af", margin: "14px 0" }}>
              <strong>Notice:</strong> Agent registrations require Administrator approval. Upon approval, your official license number (LIC-AGT-XXXXXX) and assigned branch will be issued automatically.
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "6px", padding: "10px" }}
              disabled={loading}
            >
              <span>{loading ? "Submitting..." : "Submit Agent Application"}</span>
            </button>
          </form>
        )}

        {/* 3. SURVEYOR APPLICATION FORM */}
        {activeTab === "surveyor" && (
          <form onSubmit={handleSurveyorSubmit}>
            <div className="grid-2">
              <FormInput
                label="Surveyor Full Name"
                name="surveyor_name"
                placeholder="e.g. Amit Kumar"
                value={surveyorForm.surveyor_name}
                onChange={(e) => setSurveyorForm({ ...surveyorForm, surveyor_name: e.target.value })}
                required
              />
              <FormInput
                label="Phone Number"
                name="phone"
                placeholder="e.g. 9876543210"
                value={surveyorForm.phone}
                onChange={(e) => setSurveyorForm({ ...surveyorForm, phone: e.target.value })}
                required
              />
            </div>

            <div className="grid-2">
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                placeholder="e.g. surveyor@insurance.com"
                value={surveyorForm.email}
                onChange={(e) => setSurveyorForm({ ...surveyorForm, email: e.target.value })}
                required
              />
              <FormInput
                label="Password"
                name="password"
                type="password"
                placeholder="Enter secure password"
                value={surveyorForm.password}
                onChange={(e) => setSurveyorForm({ ...surveyorForm, password: e.target.value })}
                required
              />
            </div>

            <div className="grid-2">
              <FormInput
                label="Years of Experience (Optional)"
                name="experience"
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={surveyorForm.experience}
                onChange={(e) => setSurveyorForm({ ...surveyorForm, experience: e.target.value })}
              />
            </div>

            <div style={{ padding: "12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "12.5px", color: "#1e40af", margin: "14px 0" }}>
              <strong>Notice:</strong> Surveyor applications require Administrator review. Upon approval, your official surveyor license (LIC-SUR-XXXXXX) will be generated automatically.
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "6px", padding: "10px" }}
              disabled={loading}
            >
              <span>{loading ? "Submitting..." : "Submit Surveyor Application"}</span>
            </button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
