import api from "./api";

export const getHospitals = async (params = {}) => {
  const response = await api.get("/hospitals", { params });
  return response.data;
};

export const getHospitalById = async (id) => {
  const response = await api.get(`/hospitals/${id}`);
  return response.data;
};

export const createHospital = async (data) => {
  const response = await api.post("/hospitals", data);
  return response.data;
};

export const updateHospital = async (id, data) => {
  const response = await api.put(`/hospitals/${id}`, data);
  return response.data;
};

export const deleteHospital = async (id) => {
  const response = await api.delete(`/hospitals/${id}`);
  return response.data;
};
