import api from "./api";

export const getPolicyTypes = async (params = {}) => {
  const response = await api.get("/policy-types", { params });
  return response.data;
};

export const getPolicyTypeById = async (id) => {
  const response = await api.get(`/policy-types/${id}`);
  return response.data;
};

export const createPolicyType = async (data) => {
  const response = await api.post("/policy-types", data);
  return response.data;
};

export const updatePolicyType = async (id, data) => {
  const response = await api.put(`/policy-types/${id}`, data);
  return response.data;
};

export const deletePolicyType = async (id) => {
  const response = await api.delete(`/policy-types/${id}`);
  return response.data;
};
