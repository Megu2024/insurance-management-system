import api from "./api";

export const getAgents = async (params = {}) => {
  const response = await api.get("/agents", { params });
  return response.data;
};

export const getAgentById = async (id) => {
  const response = await api.get(`/agents/${id}`);
  return response.data;
};

export const getAgentPolicies = async (id) => {
  const response = await api.get(`/agents/${id}/policies`);
  return response.data;
};

export const getAgentCustomers = async (id) => {
  const response = await api.get(`/agents/${id}/customers`);
  return response.data;
};

export const createAgent = async (data) => {
  const response = await api.post("/agents", data);
  return response.data;
};

export const updateAgent = async (id, data) => {
  const response = await api.put(`/agents/${id}`, data);
  return response.data;
};

export const deleteAgent = async (id) => {
  const response = await api.delete(`/agents/${id}`);
  return response.data;
};
