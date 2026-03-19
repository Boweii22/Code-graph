import axios from 'axios';
import type { Job, QueryResponse } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min — large repos can take a while to clone
});

export async function createJob(repoUrl: string): Promise<Job> {
  const { data } = await api.post<Job>('/jobs', { repo_url: repoUrl });
  return data;
}

export async function getJob(jobId: string): Promise<Job> {
  const { data } = await api.get<Job>(`/jobs/${jobId}`);
  return data;
}

export async function getGraph(jobId: string) {
  const { data } = await api.get(`/graph/${jobId}`);
  return data;
}

export async function queryGraph(
  question: string,
  jobId: string,
  contextNodeIds?: string[]
): Promise<QueryResponse> {
  const { data } = await api.post<QueryResponse>('/query', {
    question,
    job_id: jobId,
    context_node_ids: contextNodeIds,
  });
  return data;
}
