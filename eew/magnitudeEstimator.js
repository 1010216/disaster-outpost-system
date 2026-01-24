export default function estimateMagnitude(amplitude, distanceKm) {
  return Math.log10(amplitude) + Math.log10(distanceKm) + 1.0
}
