import api from "./api";

export const getUsers = async (params = {}) => {
  const response = await api.get("/users", { params });
  return response.data;
};

export const getPendingApprovals = async () => {
  const response = await api.get("/users/pending");
  return response.data;
};

export const approveUser = async (id) => {
  const response = await api.put(`/users/${id}/approve`);
  return response.data;
};

export const rejectUser = async (id) => {
  const response = await api.put(`/users/${id}/reject`);
  return response.data;
};

export const updateUserStatus = async (id, status) => {
  const response = await api.put(`/users/${id}/status`, { status });
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
