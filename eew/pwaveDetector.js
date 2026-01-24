export default class PWaveDetector {
  constructor(sta = 5, lta = 50, threshold = 3.0) {
    this.sta = sta
    this.lta = lta
    this.threshold = threshold
    this.buffer = []
  }

  addSample(v) {
    this.buffer.push(Math.abs(v))
    if (this.buffer.length > this.lta) this.buffer.shift()
  }

  isPWaveDetected() {
    if (this.buffer.length < this.lta) return false
    const sta = avg(this.buffer.slice(-this.sta))
    const lta = avg(this.buffer)
    return sta / lta > this.threshold
  }
}

function avg(a) {
  return a.reduce((x, y) => x + y, 0) / a.length
}
