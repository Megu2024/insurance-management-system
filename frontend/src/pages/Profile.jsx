import { useState, useEffect } from "react";
import { UserCircle, Key, Shield, CheckCircle2, Lock, Edit2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser, changeUserPassword } from "../services/authService";
import { updateCustomer } from "../services/customerService";
import PageHeader from "../components/PageHeader";
import FormInput from "../components/FormInput";
import StatusBadge from "../components/StatusBadge";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { formatDate } from "../utils/dateUtils";

const Profile = () => {
  const { user, role } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Customer profile edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    mobile_no: "",
    city: "",
    state: "",
    pincode: "",
    occupation: "",
    annual_income: "",
    address: ""
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getCurrentUser();
      setProfileData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleOpenEditModal = () => {
    const details = profileData?.details || {};
    setEditFormData({
      first_name: details.first_name || "",
      last_name: details.last_name || "",
      mobile_no: details.mobile_no || "",
      city: details.city || "",
      state: details.state || "",
      pincode: details.pincode || "",
      occupation: details.occupation || "",
      annual_income: details.annual_income !== null && details.annual_income !== undefined ? details.annual_income : "",
      address: details.address || ""
    });
    setEditError("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);

    try {
      const customerId = profileData?.details?.customer_id;
      if (!customerId) {
        throw new Error("Customer record identifier not found.");
      }
      await updateCustomer(customerId, editFormData);
      await loadProfile();
      setIsEditModalOpen(false);
      setSuccessMsg("Your profile details have been successfully updated!");
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.error || err.message || "Failed to update profile details.");
    } finally {
      setEditLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setSuccessMsg("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters in length.");
      return;
    }

    setPasswordLoading(true);
    try {
      await changeUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccessMsg("Your password has been successfully updated!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Fetching your account profile..." />;
  }

  const userRecord = profileData?.user || user;
  const details = profileData?.details || {};

  return (
    <div className="profile-page">
      <PageHeader
        title="My Profile & Security"
        description="View your user identity, role permissions, and update login credentials"
        badge={role}
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      {successMsg && (
        <div className="status-badge badge-success" style={{ display: "flex", gap: "8px", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Account Details Card */}
        <div className="detail-card">
          <h4 className="detail-card-title">Identity & Access Credentials</h4>
          <div className="grid-2">
            <div className="detail-row"><span className="detail-label">User ID:</span><span className="detail-value font-mono">#{userRecord.user_id}</span></div>
            <div className="detail-row"><span className="detail-label">Account Role:</span><span className="detail-value font-medium" style={{ color: "#2563eb" }}>{userRecord.role}</span></div>
            <div className="detail-row"><span className="detail-label">Login Email:</span><span className="detail-value">{userRecord.email}</span></div>
            {role !== "CUSTOMER" && (
              <div className="detail-row"><span className="detail-label">Status:</span><span className="detail-value"><StatusBadge status={userRecord.status} /></span></div>
            )}
            <div className="detail-row"><span className="detail-label">Account Created:</span><span className="detail-value">{formatDate(userRecord.created_at)}</span></div>
          </div>

          {/* Role specific linked details */}
          {details && (
            <div style={{ marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h5 style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                  Linked {role} Record
                </h5>
                {role === "CUSTOMER" && details?.customer_id && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleOpenEditModal}
                    style={{ fontSize: "12px", padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Edit2 size={13} />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {role === "CUSTOMER" && (
                <div className="grid-2">
                  <div className="detail-row"><span className="detail-label">Name:</span><span className="detail-value">{details.first_name} {details.last_name}</span></div>
                  <div className="detail-row"><span className="detail-label">Mobile:</span><span className="detail-value">{details.mobile_no || "—"}</span></div>
                  <div className="detail-row">
                    <span className="detail-label">Annual Salary / Income:</span>
                    <span className="detail-value font-medium" style={{ color: "#059669" }}>
                      {details.annual_income !== null && details.annual_income !== undefined && details.annual_income !== ""
                        ? `₹${parseFloat(details.annual_income).toLocaleString("en-IN")}`
                        : "—"}
                    </span>
                  </div>
                  <div className="detail-row"><span className="detail-label">Occupation:</span><span className="detail-value">{details.occupation || "—"}</span></div>
                  <div className="detail-row"><span className="detail-label">City, State:</span><span className="detail-value">{details.city || "—"}, {details.state || "—"}{details.pincode ? ` (${details.pincode})` : ""}</span></div>
                  <div className="detail-row"><span className="detail-label">Address:</span><span className="detail-value">{details.address || "—"}</span></div>
                </div>
              )}
              {role === "AGENT" && (
                <div className="grid-2">
                  <div className="detail-row"><span className="detail-label">Agent Name:</span><span className="detail-value">{details.agent_name}</span></div>
                  <div className="detail-row"><span className="detail-label">License:</span><span className="detail-value font-mono">{details.license_no || "—"}</span></div>
                  <div className="detail-row"><span className="detail-label">Branch:</span><span className="detail-value">{details.branch_name_1 || "Unassigned"}</span></div>
                  <div className="detail-row"><span className="detail-label">Mobile:</span><span className="detail-value">{details.mobile_no || "—"}</span></div>
                </div>
              )}
              {role === "SURVEYOR" && (
                <div className="grid-2">
                  <div className="detail-row"><span className="detail-label">Surveyor:</span><span className="detail-value">{details.surveyor_name}</span></div>
                  <div className="detail-row"><span className="detail-label">License:</span><span className="detail-value font-mono">{details.license_no || "—"}</span></div>
                  <div className="detail-row"><span className="detail-label">Experience:</span><span className="detail-value">{details.experience || 0} years</span></div>
                  <div className="detail-row"><span className="detail-label">Phone:</span><span className="detail-value">{details.phone || "—"}</span></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Change Password Card */}
        <div className="detail-card">
          <h4 className="detail-card-title">Change Password</h4>
          {passwordError && <ErrorMessage message={passwordError} onDismiss={() => setPasswordError("")} />}

          <form onSubmit={handlePasswordSubmit}>
            <FormInput
              label="Current Password"
              name="currentPassword"
              type="password"
              placeholder="Enter your current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />

            <FormInput
              label="New Password"
              name="newPassword"
              type="password"
              placeholder="Minimum 6 characters"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
            />

            <FormInput
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
            />

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: "8px" }}
              disabled={passwordLoading}
            >
              <Key size={16} />
              <span>{passwordLoading ? "Updating..." : "Update Password"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Edit Customer Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer Profile"
        maxWidth="600px"
      >
        {editError && <ErrorMessage message={editError} onDismiss={() => setEditError("")} />}
        <form onSubmit={handleEditSubmit}>
          <div className="grid-2">
            <FormInput
              label="First Name"
              name="first_name"
              value={editFormData.first_name}
              onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
              required
            />
            <FormInput
              label="Last Name"
              name="last_name"
              value={editFormData.last_name}
              onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Mobile Number"
              name="mobile_no"
              value={editFormData.mobile_no}
              onChange={(e) => setEditFormData({ ...editFormData, mobile_no: e.target.value })}
            />
            <FormInput
              label="Annual Salary / Income (₹)"
              name="annual_income"
              type="number"
              min="0"
              placeholder="e.g. 750000"
              value={editFormData.annual_income}
              onChange={(e) => setEditFormData({ ...editFormData, annual_income: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Occupation"
              name="occupation"
              value={editFormData.occupation}
              onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })}
            />
            <FormInput
              label="City"
              name="city"
              value={editFormData.city}
              onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="State"
              name="state"
              value={editFormData.state}
              onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
            />
            <FormInput
              label="Pincode"
              name="pincode"
              value={editFormData.pincode}
              onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
            />
          </div>

          <FormInput
            label="Address"
            name="address"
            value={editFormData.address}
            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={editLoading}
            >
              {editLoading ? "Saving..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
