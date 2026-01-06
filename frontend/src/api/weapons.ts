import axios from 'axios';
import { SearchResponse } from '../types/weapon';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function searchWeapons(query: string): Promise<SearchResponse> {
  const response = await axios.get<SearchResponse>(`${API_BASE}/search`, {
    params: { q: query },
  });
  return response.data;
}
