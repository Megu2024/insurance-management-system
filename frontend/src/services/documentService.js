import api from "./api";

export const getDocuments = async (params = {}) => {
  const response = await api.get("/documents", { params });
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const createDocument = async (data) => {
  const response = await api.post("/documents", data);
  return response.data;
};

export const updateDocument = async (id, data) => {
  const response = await api.put(`/documents/${id}`, data);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};
