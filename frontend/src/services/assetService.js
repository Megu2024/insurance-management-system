import api from "./api";

// Vehicles
export const getVehicles = async (params = {}) => {
  const response = await api.get("/vehicles", { params });
  return response.data;
};

export const getVehicleById = async (id) => {
  const response = await api.get(`/vehicles/${id}`);
  return response.data;
};

export const createVehicle = async (data) => {
  const response = await api.post("/vehicles", data);
  return response.data;
};

export const updateVehicle = async (id, data) => {
  const response = await api.put(`/vehicles/${id}`, data);
  return response.data;
};

export const deleteVehicle = async (id) => {
  const response = await api.delete(`/vehicles/${id}`);
  return response.data;
};

// Properties
export const getProperties = async (params = {}) => {
  const response = await api.get("/properties", { params });
  return response.data;
};

export const getPropertyById = async (id) => {
  const response = await api.get(`/properties/${id}`);
  return response.data;
};

export const createProperty = async (data) => {
  const response = await api.post("/properties", data);
  return response.data;
};

export const updateProperty = async (id, data) => {
  const response = await api.put(`/properties/${id}`, data);
  return response.data;
};

export const deleteProperty = async (id) => {
  const response = await api.delete(`/properties/${id}`);
  return response.data;
};

// Businesses
export const getBusinesses = async (params = {}) => {
  const response = await api.get("/businesses", { params });
  return response.data;
};

export const getBusinessById = async (id) => {
  const response = await api.get(`/businesses/${id}`);
  return response.data;
};

export const createBusiness = async (data) => {
  const response = await api.post("/businesses", data);
  return response.data;
};

export const updateBusiness = async (id, data) => {
  const response = await api.put(`/businesses/${id}`, data);
  return response.data;
};

export const deleteBusiness = async (id) => {
  const response = await api.delete(`/businesses/${id}`);
  return response.data;
};
