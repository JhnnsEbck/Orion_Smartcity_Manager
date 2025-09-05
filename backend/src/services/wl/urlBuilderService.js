export function buildApiUrl(divaNumber) {
  const baseUrl = 'https://www.wienerlinien.at/ogd_realtime/monitor';
  const params = new URLSearchParams({
    diva: String(divaNumber),
    activateTrafficInfo: 'stoerunglang'
  });
  const url = `${baseUrl}?${params.toString()}`;
  return url;
}
