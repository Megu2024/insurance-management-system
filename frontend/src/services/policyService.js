import api from "./api";

export const getPolicies = async (params = {}) => {
  const response = await api.get("/policies", { params });
  return response.data;
};

export const getPolicyById = async (id) => {
  const response = await api.get(`/policies/${id}`);
  return response.data;
};

export const getPolicyPayments = async (id) => {
  const response = await api.get(`/policies/${id}/payments`);
  return response.data;
};

export const getPolicyClaims = async (id) => {
  const response = await api.get(`/policies/${id}/claims`);
  return response.data;
};

export const getPolicyVehicle = async (id) => {
  const response = await api.get(`/policies/${id}/vehicle`);
  return response.data;
};

export const getPolicyProperty = async (id) => {
  const response = await api.get(`/policies/${id}/property`);
  return response.data;
};

export const getPolicyBusiness = async (id) => {
  const response = await api.get(`/policies/${id}/business`);
  return response.data;
};

export const getPolicyNominees = async (id) => {
  const response = await api.get(`/policies/${id}/nominees`);
  return response.data;
};

export const createPolicy = async (data) => {
  const response = await api.post("/policies", data);
  return response.data;
};

export const updatePolicy = async (id, data) => {
  const response = await api.put(`/policies/${id}`, data);
  return response.data;
};

export const updatePolicyStatus = async (id, status) => {
  const response = await api.put(`/policies/${id}/status`, { policy_status: status });
  return response.data;
};

export const deletePolicy = async (id) => {
  const response = await api.delete(`/policies/${id}`);
  return response.data;
};
