import api from "./api";

export const getClaims = async (params = {}) => {
  const response = await api.get("/claims", { params });
  return response.data;
};

export const getClaimById = async (id) => {
  const response = await api.get(`/claims/${id}`);
  return response.data;
};

export const getClaimHospital = async (id) => {
  const response = await api.get(`/claims/${id}/hospital`);
  return response.data;
};

export const createClaim = async (data) => {
  const response = await api.post("/claims", data);
  return response.data;
};

export const updateClaim = async (id, data) => {
  const response = await api.put(`/claims/${id}`, data);
  return response.data;
};

export const deleteClaim = async (id) => {
  const response = await api.delete(`/claims/${id}`);
  return response.data;
};
