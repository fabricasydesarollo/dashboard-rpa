export function calculateTrendProcesosHoy(hoy, ayer) {
  if (ayer === 0) return 0

  const trend = ((hoy - ayer) / ayer) * 100
  return Number(trend.toFixed(2))
}
