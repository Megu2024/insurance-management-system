import api from "./api";

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const registerCustomer = async (data) => {
  const response = await api.post("/auth/register-customer", data);
  return response.data;
};

export const registerAgent = async (data) => {
  const response = await api.post("/auth/register-agent", data);
  return response.data;
};

export const registerSurveyor = async (data) => {
  const response = await api.post("/auth/register-surveyor", data);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const changeUserPassword = async (data) => {
  const response = await api.post("/auth/change-password", data);
  return response.data;
};
