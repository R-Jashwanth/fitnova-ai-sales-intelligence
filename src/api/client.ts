import axios from 'axios';
import { Organization, Team, Advisor, Call } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const getOrganizations = async (): Promise<Organization[]> => {
  const { data } = await api.get('/organizations');
  return data;
};

export const getTeams = async (): Promise<Team[]> => {
  const { data } = await api.get('/teams');
  return data;
};

export const getAdvisors = async (): Promise<Advisor[]> => {
  const { data } = await api.get('/advisors');
  return data;
};

export const getCalls = async (): Promise<Call[]> => {
  const { data } = await api.get('/calls');
  return data;
};

export const getCallDetails = async (id: number): Promise<Call> => {
  // Assuming there's a GET /calls/:id endpoint that includes related data
  // Or we might need to fetch them if the backend doesn't provide them, but we'll try /calls first
  // The python code for read_calls gets multi. We might not have a /calls/:id endpoint, wait, let me check backend endpoints.
  const { data } = await api.get(`/calls/${id}`);
  return data;
};

export const uploadCall = async (advisorId: number, clientName: string, file: File): Promise<Call> => {
  const formData = new FormData();
  formData.append('advisor_id', String(advisorId));
  if (clientName) {
    formData.append('client_name', clientName);
  }
  formData.append('file', file);

  const { data } = await api.post('/calls/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
