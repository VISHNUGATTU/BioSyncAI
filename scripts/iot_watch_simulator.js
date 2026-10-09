#!/usr/bin/env node
/**
 * BioSync AI - Standalone Real-Time IoT Watch / Wearable Device Simulator
 * 
 * Simulates a continuous 1-second (1Hz) high-precision medical telemetry stream
 * modeling Respiratory Sinus Arrhythmia, Interstitial CGM Glucose Diffusion,
 * Arterial Pulse Pressure Waveforms, and Autonomic Stress Indexes.
 * 
 * Usage:
 *   node scripts/iot_watch_simulator.js
 *   node scripts/iot_watch_simulator.js --push
 *   node scripts/iot_watch_simulator.js --push --mode=walking
 *   node scripts/iot_watch_simulator.js --push --mode=exercise --url=http://localhost:6446
 */

import http from 'http';
import https from 'https';

const args = process.argv.slice(2);
const modeArg = args.find((a) => a.startsWith('--mode='));
const activityMode = modeArg ? modeArg.split('=')[1].toLowerCase() : 'resting';

const shouldPush = args.includes('--push') || args.includes('--live') || args.some((a) => a.startsWith('--url='));
const urlArg = args.find((a) => a.startsWith('--url='));
const targetServerUrl = urlArg ? urlArg.split('=')[1] : 'http://localhost:6446';

const userArg = args.find((a) => a.startsWith('--userId='));
const targetUserId = userArg ? userArg.split('=')[1] : 'default';

// ANSI terminal colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const GRAY = '\x1b[90m';

console.clear();
console.log(`${BOLD}${CYAN}======================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   BIOSYNC AI - REAL-TIME 1-SECOND BIOMETRIC IOT WATCH SIMULATOR      ${RESET}`);
console.log(`${BOLD}${CYAN}   Continuous 1Hz Telemetry Streaming • Mode: [ ${activityMode.toUpperCase()} ]          ${RESET}`);
if (shouldPush) {
  console.log(`${BOLD}${GREEN}   Live Cloud Sync: [ ENABLED ] -> ${targetServerUrl}/api/vitals/iot-telemetry${RESET}`);
} else {
  console.log(`${BOLD}${YELLOW}   Live Cloud Sync: [ STANDALONE ] (Add --push to stream to BioSync Server)${RESET}`);
}
console.log(`${BOLD}${CYAN}======================================================================${RESET}\n`);

const modeMultiplier = activityMode === 'exercise' ? 1.45 : activityMode === 'walking' ? 1.15 : 1.0;
const baseHR = 72 * modeMultiplier;
const baseSpO2 = 98;
const baseGlucose = 93.5;
const baseSystolic = 120 * (activityMode === 'exercise' ? 1.2 : 1.0);
const baseDiastolic = 80;
const baseHRV = activityMode === 'exercise' ? 30 : 54;

let step = 0;

function generate1SecTelemetry(t) {
  // Respiratory Sinus Arrhythmia modulation (~14-16 breaths/min)
  const respiratoryModulation = Math.sin(t * 0.35) * 3.2;
  const hrRandomDrift = (Math.random() - 0.5) * 2.2;
  const currentHeartRate = Math.round(
    Math.max(48, Math.min(175, baseHR + respiratoryModulation + hrRandomDrift))
  );

  // Heart Rate Variability (ms)
  const hrvDrift = (Math.random() - 0.5) * 3.5;
  const currentHRV = Math.round(
    Math.max(18, Math.min(95, baseHRV - (respiratoryModulation * 0.7) + hrvDrift))
  );

  // Pulse Oximetry SpO2 (%)
  const spO2Jitter = Math.random() > 0.88 ? -1 : 0;
  const currentSpO2 = Math.max(93, Math.min(100, baseSpO2 + spO2Jitter));

  // Continuous Interstitial Glucose (CGM in mg/dL)
  const glucoseSlowWave = Math.sin(t * 0.04) * 4.8 + Math.cos(t * 0.015) * 2.2;
  const glucoseJitter = (Math.random() - 0.5) * 0.7;
  const currentGlucose = Number(
    Math.max(65, Math.min(230, baseGlucose + glucoseSlowWave + glucoseJitter)).toFixed(1)
  );

  // Arterial Blood Pressure Pulse Waveform (mmHg)
  const bpMod = Math.sin(t * 0.22) * 2.4;
  const currentSystolic = Math.round(
    Math.max(90, Math.min(175, baseSystolic + bpMod + (Math.random() - 0.5) * 1.5))
  );
  const currentDiastolic = Math.round(
    Math.max(55, Math.min(105, baseDiastolic + (bpMod * 0.4) + (Math.random() - 0.5) * 1.0))
  );

  // Autonomic Stress Index
  const stressRaw = Math.round(100 - (currentHRV * 1.15) + (activityMode === 'exercise' ? 30 : 0));
  const currentStress = Math.max(10, Math.min(92, stressRaw));

  const respirationRate = Number((14.5 + Math.sin(t * 0.12) * 1.8 + (activityMode === 'exercise' ? 8 : 0)).toFixed(1));
  const skinTemp = Number((36.5 + Math.sin(t * 0.02) * 0.25).toFixed(2));
  const perfusionIndex = Number((5.4 + Math.sin(t * 0.09) * 0.6).toFixed(2));

  return {
    t,
    timestamp: new Date().toLocaleTimeString(),
    isoTimestamp: new Date().toISOString(),
    heartRate: currentHeartRate,
    hrv: currentHRV,
    glucose: currentGlucose,
    glucoseTrend: glucoseSlowWave > 0.6 ? '▲ RISING' : glucoseSlowWave < -0.6 ? '▼ FALLING' : '■ STABLE',
    systolic: currentSystolic,
    diastolic: currentDiastolic,
    map: Math.round((currentSystolic + 2 * currentDiastolic) / 3),
    spO2: currentSpO2,
    stress: currentStress,
    respiration: respirationRate,
    skinTemp,
    perfusionIndex,
  };
}

function pushTelemetryToServer(data) {
  if (!shouldPush) return;

  const payload = JSON.stringify({
    userId: targetUserId,
    timestamp: data.isoTimestamp,
    device: {
      deviceName: 'BioSync Medical Smartwatch Ultra',
      cgmSensor: 'Dexcom G7 Continuous Subcutaneous Sensor',
      batteryLevel: Math.max(50, 99 - Math.floor(data.t / 120)),
      connectionStatus: 'ACTIVE_HARDWARE_STREAMING',
      activityMode,
    },
    metrics: {
      heartRate: data.heartRate,
      hrvMs: data.hrv,
      spO2Percent: data.spO2,
      glucoseCgm: data.glucose,
      glucoseTrend: data.glucoseTrend.includes('RISING') ? 'RISING_STEADY' : data.glucoseTrend.includes('FALLING') ? 'FALLING_STEADY' : 'STABLE',
      systolicBP: data.systolic,
      diastolicBP: data.diastolic,
      meanArterialPressure: data.map,
      stressIndex: data.stress,
      respirationRate: data.respiration,
      skinTemperatureCelsius: data.skinTemp,
      perfusionIndexPercent: data.perfusionIndex,
    },
  });

  try {
    const parsedUrl = new URL(`${targetServerUrl}/api/vitals/iot-telemetry`);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(
      parsedUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 900,
      },
      (res) => {
        res.resume(); // Consume stream
      }
    );

    req.on('error', () => {
      // Graceful silence on network drop
    });

    req.write(payload);
    req.end();
  } catch (err) {
    // Graceful error recovery
  }
}

// 1-Second Interval (1000ms Real-Time Clock)
setInterval(() => {
  step += 1;
  const data = generate1SecTelemetry(step);

  if (shouldPush) {
    pushTelemetryToServer(data);
  }

  const heartIcon = data.heartRate > 100 ? `${RED}♥${RESET}` : `${RED}❤${RESET}`;
  const hrColor = data.heartRate > 100 ? RED : data.heartRate < 60 ? YELLOW : GREEN;
  const gluColor = data.glucose > 140 ? RED : data.glucose < 70 ? YELLOW : GREEN;
  const spColor = data.spO2 < 95 ? RED : GREEN;
  const syncBadge = shouldPush ? `${GREEN}[SYNC ON]${RESET} ` : '';

  process.stdout.write(
    `${syncBadge}[${GRAY}${data.timestamp}${RESET}] ` +
    `Step: ${BOLD}${data.t}s${RESET} | ` +
    `${heartIcon} HR: ${hrColor}${BOLD}${data.heartRate} bpm${RESET} | ` +
    `CGM: ${gluColor}${BOLD}${data.glucose} mg/dL${RESET} (${data.glucoseTrend}) | ` +
    `BP: ${BOLD}${data.systolic}/${data.diastolic} mmHg${RESET} | ` +
    `SpO2: ${spColor}${data.spO2}%${RESET} | ` +
    `HRV: ${CYAN}${data.hrv}ms${RESET} | ` +
    `Stress: ${data.stress > 60 ? RED : GREEN}${data.stress}/100${RESET} | ` +
    `Resp: ${data.respiration} rpm\n`
  );
}, 1000);
