import PWaveDetector from './pwaveDetector.js'
import estimateMagnitude from './magnitudeEstimator.js'

const detector = new PWaveDetector()

function processWaveSample(sampleAmplitude, distanceKm, originTime) {
  detector.addSample(sampleAmplitude)

  if (detector.isPWaveDetected()) {
    const mag = estimateMagnitude(sampleAmplitude, distanceKm)
    const sWaveArrive = Math.round(distanceKm / 3.5)

    if (mag >= 5.5) {
      return {
        type: 'EEW',
        magnitude: mag.toFixed(1),
        distance: Math.round(distanceKm),
        sWaveArriveIn: sWaveArrive,
        originTime
      }
    }
  }

  return null
}

export default processWaveSample
