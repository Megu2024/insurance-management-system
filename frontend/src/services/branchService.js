import api from "./api";

export const getBranches = async (params = {}) => {
  const response = await api.get("/branches", { params });
  return response.data;
};

export const getBranchById = async (id) => {
  const response = await api.get(`/branches/${id}`);
  return response.data;
};

export const getBranchAgents = async (id) => {
  const response = await api.get(`/branches/${id}/agents`);
  return response.data;
};

export const createBranch = async (data) => {
  const response = await api.post("/branches", data);
  return response.data;
};

export const updateBranch = async (id, data) => {
  const response = await api.put(`/branches/${id}`, data);
  return response.data;
};

export const deleteBranch = async (id) => {
  const response = await api.delete(`/branches/${id}`);
  return response.data;
};
