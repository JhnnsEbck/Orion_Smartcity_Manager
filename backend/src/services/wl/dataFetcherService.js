import axios from 'axios';
import { buildApiUrl } from './urlBuilderService.js';

export async function fetchData(divaNumber) {
  const apiUrl = buildApiUrl(divaNumber);
  const { data } = await axios.get(apiUrl, { timeout: 15000 });
  return data; // WL returns {message, data:{monitors:[...]}}
}
