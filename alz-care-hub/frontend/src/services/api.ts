import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const getApiClient = () =>
  axios.create({
    baseURL: `${BASE_URL}/api`,
    timeout: 8000,
  });

export const getPatientId = () => 1;
export const getCaregiverId = () => 2;
export const getHcpId = () => 4;
export const getAdminId = () => 5;
