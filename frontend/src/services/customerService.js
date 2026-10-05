import api from "./api";

export const getCustomers = async (params = {}) => {
  const response = await api.get("/customers", { params });
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

export const getCustomerPolicies = async (id) => {
  const response = await api.get(`/customers/${id}/policies`);
  return response.data;
};

export const getCustomerDocuments = async (id) => {
  const response = await api.get(`/customers/${id}/documents`);
  return response.data;
};

export const createCustomer = async (data) => {
  const response = await api.post("/customers", data);
  return response.data;
};

export const updateCustomer = async (id, data) => {
  const response = await api.put(`/customers/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id, options = {}) => {
  const params = {};
  if (options.force) params.force = true;
  if (options.preserveLogin !== undefined) params.preserveLogin = options.preserveLogin;
  const response = await api.delete(`/customers/${id}`, { params });
  return response.data;
};