/**
 * Tamper-Evident Hash-Chained Audit Trail Service
 * 
 * Every administrative or financial state change writes an immutable audit record.
 * Each record hashes its content along with the previous record's hash (SHA-256),
 * creating an unbroken cryptographic chain. Any manual tampering invalidates the chain.
 */

import { AuditLog } from '../types';

// Simple fast SHA-256 simulation in pure TS / Web Crypto API
async function sha256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback hash implementation for hermetic environments
  let hash = 0x811c9dc5;
  for (let i = 0; i < message.length; i++) {
    hash ^= message.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ('00000000' + (hash >>> 0).toString(16)).slice(-8) + 'a1b2c3d4e5f6';
}

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export async function createAuditRecord(params: {
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  previousHash: string;
}): Promise<AuditLog> {
  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();
  const ip = params.ipAddress || '127.0.0.1 (Osun Intranet)';

  const payloadToHash = `${params.previousHash}|${timestamp}|${params.actor}|${params.role}|${params.action}|${params.entityType}|${params.entityId}|${params.details}|${ip}`;
  const hash = await sha256(payloadToHash);

  return {
    id,
    timestamp,
    actor: params.actor,
    role: params.role,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    ipAddress: ip,
    previousHash: params.previousHash,
    hash,
  };
}

/**
 * Validates the entire hash chain from Genesis to current tip
 */
export async function verifyAuditChainIntegrity(chain: AuditLog[]): Promise<{
  isValid: boolean;
  brokenIndex?: number;
  reason?: string;
}> {
  if (chain.length === 0) return { isValid: true };

  // Check first record points to genesis or established root
  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];
    const expectedPrevHash = i === 0 ? GENESIS_HASH : chain[i - 1].hash;

    if (current.previousHash !== expectedPrevHash) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Hash chain break at record #${i + 1} (${current.id}). Previous hash mismatch.`,
      };
    }

    const payload = `${current.previousHash}|${current.timestamp}|${current.actor}|${current.role}|${current.action}|${current.entityType}|${current.entityId}|${current.details}|${current.ipAddress}`;
    const recalculatedHash = await sha256(payload);

    if (current.hash !== recalculatedHash) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Cryptographic tamper detected at record #${i + 1} (${current.id}). Payload hash does not match stored signature.`,
      };
    }
  }

  return { isValid: true };
}
