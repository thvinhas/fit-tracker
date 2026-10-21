export const formatVolume = (volumeKg) => {
  const volume = Number(volumeKg) || 0;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return String(volume);
};
