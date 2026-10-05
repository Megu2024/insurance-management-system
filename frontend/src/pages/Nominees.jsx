import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import {
  getNominees,
  createNominee,
  updateNominee,
  deleteNominee
} from "../services/nomineeService";
import { getPolicies } from "../services/policyService";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormInput from "../components/FormInput";
import SelectInput from "../components/SelectInput";
import ErrorMessage from "../components/ErrorMessage";
import { formatDate } from "../utils/dateUtils";

const Nominees = () => {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";
  const isCustomer = role === "CUSTOMER";

  const [nominees, setNominees] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedNominee, setSelectedNominee] = useState(null);

  const initialForm = {
    policy_id: "",
    nominee_name: "",
    relationship: "Spouse",
    dob: "",
    mobile_no: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchNomineesList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getNominees({ search });
      setNominees(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch nominees list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNomineesList();
  }, [search]);

  useEffect(() => {
    getPolicies()
      .then((data) => setPolicies(data))
      .catch(console.error);
  }, []);

  const handleOpenEdit = (n) => {
    setSelectedNominee(n);
    setFormData({
      policy_id: n.policy_id,
      nominee_name: n.nominee_name || "",
      relationship: n.relationship || "Spouse",
      dob: n.dob ? n.dob.split("T")[0] : "",
      mobile_no: n.mobile_no || ""
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createNominee(formData);
      setIsCreateOpen(false);
      setFormData(initialForm);
      fetchNomineesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add nominee.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateNominee(selectedNominee.nominee_id, formData);
      setIsEditOpen(false);
      fetchNomineesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update nominee.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNominee) return;
    setActionLoading(true);
    try {
      await deleteNominee(selectedNominee.nominee_id);
      setIsDeleteOpen(false);
      fetchNomineesList();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove nominee.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: "Nominee ID", accessor: "nominee_id", sortable: true, style: { width: "90px" }, render: (val) => <span className="font-mono">#{val}</span> },
    { header: "Nominee Name", accessor: "nominee_name", render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { header: "Relationship", accessor: "relationship" },
    { header: "Date of Birth", accessor: "dob", render: (val) => formatDate(val) },
    { header: "Mobile", accessor: "mobile_no" },
    { header: "Covered Policy", accessor: "policy_no", render: (val, row) => (
      <div>
        <span className="font-mono font-medium">{val}</span>
        {row.customer_name && <div style={{ fontSize: "12px", color: "#64748b" }}>({row.customer_name})</div>}
      </div>
    )}
  ];

  return (
    <div className="nominees-page">
      <PageHeader
        title={isCustomer ? "My Policy Beneficiaries" : "Policy Nominees"}
        description="Designated beneficiaries and legal claimants attached to policies"
        actions={
          (isAdmin || isCustomer || isAgent) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFormData(initialForm);
                setIsCreateOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Designate Nominee</span>
            </button>
          )
        }
      />

      {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

      <div className="toolbar-container">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by nominee name, relationship, or policy no..."
        />
      </div>

      <DataTable
        columns={columns}
        data={nominees}
        keyField="nominee_id"
        loading={loading}
        emptyMessage="No nominees registered."
        actions={(row) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Nominee"
            >
              <Edit size={15} />
            </button>
            {(isAdmin || isCustomer) && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: "#dc2626" }}
                onClick={() => {
                  setSelectedNominee(row);
                  setIsDeleteOpen(true);
                }}
                title="Delete Nominee"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      />

      {/* ================= ADD NOMINEE MODAL ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Designate Policy Nominee"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSubmit}>
          <SelectInput
            label="Designate for Policy"
            name="policy_id"
            value={formData.policy_id}
            onChange={(e) => setFormData({ ...formData, policy_id: e.target.value })}
            options={policies.map((p) => ({
              value: p.policy_id,
              label: `${p.policy_no} - ${p.customer_name} (${p.policy_name})`
            }))}
            required
          />

          <div className="grid-2">
            <FormInput
              label="Nominee Full Name"
              name="nominee_name"
              value={formData.nominee_name}
              onChange={(e) => setFormData({ ...formData, nominee_name: e.target.value })}
              required
            />
            <SelectInput
              label="Relationship with Policyholder"
              name="relationship"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              options={[
                { value: "Spouse", label: "Spouse" },
                { value: "Child (Son/Daughter)", label: "Child (Son / Daughter)" },
                { value: "Parent (Father/Mother)", label: "Parent (Father / Mother)" },
                { value: "Sibling (Brother/Sister)", label: "Sibling (Brother / Sister)" },
                { value: "Other", label: "Other Legal Representative" }
              ]}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            <FormInput
              label="Contact Mobile"
              name="mobile_no"
              value={formData.mobile_no}
              onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Add Nominee"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT NOMINEE MODAL ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Nominee Details"
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="grid-2">
            <FormInput
              label="Nominee Full Name"
              name="nominee_name"
              value={formData.nominee_name}
              onChange={(e) => setFormData({ ...formData, nominee_name: e.target.value })}
              required
            />
            <SelectInput
              label="Relationship"
              name="relationship"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              options={[
                { value: "Spouse", label: "Spouse" },
                { value: "Child (Son/Daughter)", label: "Child (Son / Daughter)" },
                { value: "Parent (Father/Mother)", label: "Parent (Father / Mother)" },
                { value: "Sibling (Brother/Sister)", label: "Sibling (Brother / Sister)" },
                { value: "Other", label: "Other Legal Representative" }
              ]}
            />
          </div>

          <div className="grid-2">
            <FormInput
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            <FormInput
              label="Contact Mobile"
              name="mobile_no"
              value={formData.mobile_no}
              onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Nominee"
        message={`Are you sure you want to remove nominee ${selectedNominee?.nominee_name}?`}
        confirmText="Confirm Removal"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Nominees;
