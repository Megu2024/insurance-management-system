import api from "./api";

export const getNominees = async (params = {}) => {
  const response = await api.get("/nominees", { params });
  return response.data;
};

export const getNomineeById = async (id) => {
  const response = await api.get(`/nominees/${id}`);
  return response.data;
};

export const createNominee = async (data) => {
  const response = await api.post("/nominees", data);
  return response.data;
};

export const updateNominee = async (id, data) => {
  const response = await api.put(`/nominees/${id}`, data);
  return response.data;
};

export const deleteNominee = async (id) => {
  const response = await api.delete(`/nominees/${id}`);
  return response.data;
};
