/** Lightweight client-side take analysis (Web Audio). */

export type AudioFeatures = {
  durationSec: number
  rmsMean: number
  rmsPeak: number
  silenceRatio: number
  attackCount: number
  dynamicRange: number
  /** Attacks per second while “playing” (non-silent frames). */
  attacksPerSec: number
  /** Mean energy in first / middle / last third of the take (0–1 relative). */
  openingEnergy: number
  middleEnergy: number
  endingEnergy: number
  /** How steady the energy envelope is (lower = more even). */
  energyVariance: number
  /** True when decode failed or blob was empty. */
  weakSignal: boolean
}

const EMPTY: AudioFeatures = {
  durationSec: 0,
  rmsMean: 0,
  rmsPeak: 0,
  silenceRatio: 1,
  attackCount: 0,
  dynamicRange: 0,
  attacksPerSec: 0,
  openingEnergy: 0,
  middleEnergy: 0,
  endingEnergy: 0,
  energyVariance: 0,
  weakSignal: true,
}

function mean(xs: number[]): number {
  if (!xs.length) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function variance(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return mean(xs.map((x) => (x - m) * (x - m)))
}

/**
 * Decode a recording / demo blob and extract coarse musical signals
 * used to personalize Aria’s report (tempo feel, density, silence).
 */
export async function extractAudioFeatures(blob: Blob | null): Promise<AudioFeatures> {
  if (!blob || blob.size < 64) return EMPTY

  try {
    const ctx = new AudioContext()
    const raw = await blob.arrayBuffer()
    const buffer = await ctx.decodeAudioData(raw.slice(0))
    await ctx.close()

    const channel = buffer.getChannelData(0)
    const durationSec = buffer.duration
    if (!channel.length || durationSec <= 0) return EMPTY

    const hop = Math.max(1, Math.floor(buffer.sampleRate * 0.05)) // 50ms
    const frame = Math.max(hop, Math.floor(buffer.sampleRate * 0.05))
    const energies: number[] = []

    for (let i = 0; i + frame < channel.length; i += hop) {
      let sum = 0
      for (let j = 0; j < frame; j++) {
        const v = channel[i + j]
        sum += v * v
      }
      energies.push(Math.sqrt(sum / frame))
    }

    if (energies.length === 0) return { ...EMPTY, durationSec }

    const rmsMean = mean(energies)
    const rmsPeak = Math.max(...energies)
    const silenceThreshold = Math.max(0.008, rmsMean * 0.28)
    const silent = energies.filter((e) => e < silenceThreshold).length
    const silenceRatio = silent / energies.length

    let attackCount = 0
    for (let i = 1; i < energies.length; i++) {
      if (energies[i] > silenceThreshold * 2.2 && energies[i - 1] < silenceThreshold * 1.2) {
        attackCount += 1
      }
    }

    const sorted = [...energies].sort((a, b) => a - b)
    const p10 = sorted[Math.floor(sorted.length * 0.1)] ?? 0
    const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0
    const dynamicRange = Math.max(0, p90 - p10)

    const activeSec = Math.max(0.25, durationSec * (1 - silenceRatio))
    const attacksPerSec = attackCount / activeSec

    const third = Math.max(1, Math.floor(energies.length / 3))
    const openingEnergy = mean(energies.slice(0, third))
    const middleEnergy = mean(energies.slice(third, third * 2))
    const endingEnergy = mean(energies.slice(third * 2))
    const energyVariance = variance(energies)

    const weakSignal = rmsPeak < 0.015 || durationSec < 1.2

    return {
      durationSec,
      rmsMean,
      rmsPeak,
      silenceRatio,
      attackCount,
      dynamicRange,
      attacksPerSec,
      openingEnergy,
      middleEnergy,
      endingEnergy,
      energyVariance,
      weakSignal,
    }
  } catch {
    return EMPTY
  }
}

export type ScrollKeyframe = { t: number; p: number }

/** Map normalized audio time (0–1) through easing keyframes → scroll progress 0–1. */
export function mapScrollProgress(
  tNorm: number,
  keyframes?: ScrollKeyframe[],
  /** Advance slightly so upcoming measures stay visible (anticipation). */
  lookahead = 0,
): number {
  const t = Math.min(1, Math.max(0, tNorm + Math.max(0, lookahead)))
  if (!keyframes || keyframes.length < 2) return t

  const kfs = [...keyframes].sort((a, b) => a.t - b.t)
  if (t <= kfs[0].t) return kfs[0].p
  if (t >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1].p

  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]
    const b = kfs[i + 1]
    if (t >= a.t && t <= b.t) {
      const u = (t - a.t) / Math.max(1e-6, b.t - a.t)
      const s = u * u * u * (u * (u * 6 - 15) + 10)
      return a.p + (b.p - a.p) * s
    }
  }
  return t
}
