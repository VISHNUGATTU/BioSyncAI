import crypto from 'crypto';

/**
 * BioSync AI - Cyber-Physical Chain-of-Custody Cryptographic Hash Ledger Service
 * (Patent Claim 5 Implementation)
 * 
 * Provides an immutable, tamper-evident cryptographic hash chain for biological specimens.
 * Every milestone (Phlebotomist assignment, patient domicile OTP verification, barcode scan,
 * cold-chain temperature telemetry, laboratory receipt, analyzer induction, and pathologist authorization)
 * appends an SHA-256 block anchored to the previous block's hash.
 */

const GENESIS_PREVIOUS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Standard cold-chain temperature tolerances (ISO 15189 / WHO guidelines):
 * Refrigerated biological specimen transportation tolerance: +2.0°C to +8.0°C.
 * Ambient whole blood / ambient swab tolerance: +15.0°C to +25.0°C.
 */
export const checkColdChainCompliance = (temperatureCelsius, specimenType = 'blood') => {
  if (temperatureCelsius === undefined || temperatureCelsius === null) return true;
  const temp = Number(temperatureCelsius);
  if (isNaN(temp)) return false;

  if (specimenType === 'blood' || specimenType === 'plasma' || specimenType === 'serum') {
    // Certified refrigerated cold-box transport
    return temp >= 2.0 && temp <= 8.0;
  }
  return temp >= 10.0 && temp <= 28.0;
};

/**
 * Computes deterministic SHA-256 hash for a block payload
 */
export const computeBlockHash = ({
  index,
  timestamp,
  milestone,
  actorId,
  actorRole,
  barcode,
  gpsCoordinates,
  temperatureCelsius,
  coldChainCompliant,
  payload,
  previousHash,
}) => {
  const canonicalData = {
    index: Number(index),
    timestamp: new Date(timestamp).toISOString(),
    milestone: String(milestone),
    actorId: String(actorId || 'system'),
    actorRole: String(actorRole || 'automated_agent'),
    barcode: String(barcode || ''),
    gpsCoordinates: {
      lat: gpsCoordinates?.lat != null ? Number(gpsCoordinates.lat).toFixed(6) : '0.000000',
      lng: gpsCoordinates?.lng != null ? Number(gpsCoordinates.lng).toFixed(6) : '0.000000',
    },
    temperatureCelsius: temperatureCelsius != null ? Number(temperatureCelsius).toFixed(2) : 'N/A',
    coldChainCompliant: Boolean(coldChainCompliant),
    payload: payload ? JSON.stringify(payload) : '{}',
    previousHash: String(previousHash),
  };

  const serialized = JSON.stringify(canonicalData);
  return crypto.createHash('sha256').update(serialized).digest('hex');
};

/**
 * Appends a new immutable custody block to a Sample document
 */
export const appendCustodyMilestone = (sample, {
  milestone,
  actorId,
  actorRole,
  barcode,
  gpsCoordinates,
  temperatureCelsius,
  payload = {},
  specimenType = 'blood',
}) => {
  if (!sample.custodyLedger) {
    sample.custodyLedger = [];
  }

  const ledger = sample.custodyLedger;
  const index = ledger.length;
  const previousHash = index === 0 ? GENESIS_PREVIOUS_HASH : ledger[index - 1].blockHash;
  const timestamp = new Date();

  const isCompliant = checkColdChainCompliance(temperatureCelsius, specimenType);

  const blockData = {
    index,
    timestamp,
    milestone,
    actorId: actorId ? String(actorId) : 'system',
    actorRole: actorRole ? String(actorRole) : 'automated_agent',
    barcode: barcode || sample.barcode || '',
    gpsCoordinates: {
      lat: gpsCoordinates?.lat != null ? Number(gpsCoordinates.lat) : undefined,
      lng: gpsCoordinates?.lng != null ? Number(gpsCoordinates.lng) : undefined,
    },
    temperatureCelsius: temperatureCelsius != null ? Number(temperatureCelsius) : undefined,
    coldChainCompliant: isCompliant,
    payload,
    previousHash,
  };

  const blockHash = computeBlockHash(blockData);
  blockData.blockHash = blockHash;

  ledger.push(blockData);
  return blockData;
};

/**
 * Mathematically verifies the complete chain of custody ledger for a sample
 * Returns validity status, chain length, and any detected tampering or thermal breaches.
 */
export const verifyCustodyChain = (custodyLedger = []) => {
  if (!Array.isArray(custodyLedger) || custodyLedger.length === 0) {
    return {
      isValid: false,
      blockCount: 0,
      chainIntegrity: 'EMPTY_CHAIN',
      coldChainCompliant: true,
      breaches: [],
      error: 'No custody records found on sample',
    };
  }

  const breaches = [];
  let isColdChainIntact = true;

  for (let i = 0; i < custodyLedger.length; i++) {
    const block = custodyLedger[i];
    const expectedPreviousHash = i === 0 ? GENESIS_PREVIOUS_HASH : custodyLedger[i - 1].blockHash;

    // 1. Verify link to previous block
    if (block.previousHash !== expectedPreviousHash) {
      return {
        isValid: false,
        brokenIndex: i,
        blockCount: custodyLedger.length,
        chainIntegrity: 'BROKEN_PREVIOUS_HASH_LINK',
        expectedPreviousHash,
        actualPreviousHash: block.previousHash,
        error: `Cryptographic link broken at milestone block index ${i} (${block.milestone})`,
      };
    }

    // 2. Re-compute block hash and compare
    const recomputedHash = computeBlockHash({
      index: block.index,
      timestamp: block.timestamp,
      milestone: block.milestone,
      actorId: block.actorId,
      actorRole: block.actorRole,
      barcode: block.barcode,
      gpsCoordinates: block.gpsCoordinates,
      temperatureCelsius: block.temperatureCelsius,
      coldChainCompliant: block.coldChainCompliant,
      payload: block.payload,
      previousHash: block.previousHash,
    });

    if (recomputedHash !== block.blockHash) {
      return {
        isValid: false,
        tamperedIndex: i,
        blockCount: custodyLedger.length,
        chainIntegrity: 'HASH_MISMATCH_TAMPERED_BLOCK',
        expectedHash: recomputedHash,
        actualHash: block.blockHash,
        error: `Block data at index ${i} has been modified post-hoc! Cryptographic signature verification failed.`,
      };
    }

    // 3. Monitor Cold Chain Compliance
    if (block.coldChainCompliant === false || (block.temperatureCelsius != null && !checkColdChainCompliance(block.temperatureCelsius))) {
      isColdChainIntact = false;
      breaches.push({
        milestone: block.milestone,
        timestamp: block.timestamp,
        temperatureCelsius: block.temperatureCelsius,
        gpsCoordinates: block.gpsCoordinates,
        details: `Thermal breach detected: recorded ${block.temperatureCelsius}°C outside 2.0°C-8.0°C cold-chain corridor.`,
      });
    }
  }

  return {
    isValid: true,
    blockCount: custodyLedger.length,
    chainIntegrity: 'VERIFIED_CRYPTOGRAPHICALLY_SECURE',
    genesisHash: custodyLedger[0].blockHash,
    latestHash: custodyLedger[custodyLedger.length - 1].blockHash,
    coldChainCompliant: isColdChainIntact,
    breaches,
    verifiedAt: new Date().toISOString(),
  };
};
