import api from "./api";

export const getSurveyors = async (params = {}) => {
  const response = await api.get("/surveyors", { params });
  return response.data;
};

export const getSurveyorById = async (id) => {
  const response = await api.get(`/surveyors/${id}`);
  return response.data;
};

export const getSurveyorClaims = async (id) => {
  const response = await api.get(`/surveyors/${id}/claims`);
  return response.data;
};

export const createSurveyor = async (data) => {
  const response = await api.post("/surveyors", data);
  return response.data;
};

export const updateSurveyor = async (id, data) => {
  const response = await api.put(`/surveyors/${id}`, data);
  return response.data;
};

export const deleteSurveyor = async (id) => {
  const response = await api.delete(`/surveyors/${id}`);
  return response.data;
};
