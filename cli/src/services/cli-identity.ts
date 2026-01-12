/**
 * CLI Identity service - manages user identity for personalized views
 * Note: Only stores identity ID, never private keys (read-only mode)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { dpnsService } from '../../../lib/services/dpns-service.js';
import { identityService } from '../../../lib/services/identity-service.js';

export interface CliIdentity {
  identityId: string;
  username?: string;
  displayName?: string;
  balance?: number;
}

const CONFIG_DIR = path.join(os.homedir(), '.yappr');
const IDENTITY_FILE = path.join(CONFIG_DIR, 'identity.json');

class CliIdentityService {
  private identity: CliIdentity | null = null;
  private loaded = false;

  /**
   * Load identity from disk
   */
  loadFromDisk(): CliIdentity | null {
    if (this.loaded) return this.identity;

    try {
      if (fs.existsSync(IDENTITY_FILE)) {
        const data = fs.readFileSync(IDENTITY_FILE, 'utf-8');
        this.identity = JSON.parse(data);
        this.loaded = true;
        return this.identity;
      }
    } catch (e) {
      // Ignore errors, just return null
    }

    this.loaded = true;
    return null;
  }

  /**
   * Get current identity (loads from disk if not loaded)
   */
  getIdentity(): CliIdentity | null {
    if (!this.loaded) {
      return this.loadFromDisk();
    }
    return this.identity;
  }

  /**
   * Get identity ID or null
   */
  getIdentityId(): string | null {
    return this.getIdentity()?.identityId ?? null;
  }

  /**
   * Check if identity is set
   */
  hasIdentity(): boolean {
    return this.getIdentityId() !== null;
  }

  /**
   * Set identity by ID - validates on network and resolves username
   */
  async setIdentity(identityId: string): Promise<CliIdentity> {
    // Validate identity exists on network
    const identityInfo = await identityService.getIdentity(identityId);
    if (!identityInfo) {
      throw new Error(`Identity not found: ${identityId}`);
    }

    // Resolve DPNS username
    const username = await dpnsService.resolveUsername(identityId);

    const identity: CliIdentity = {
      identityId,
      username: username ?? undefined,
      balance: identityInfo.balance,
    };

    // Save to disk
    this.saveToDisk(identity);
    this.identity = identity;

    return identity;
  }

  /**
   * Clear identity
   */
  clearIdentity(): void {
    this.identity = null;
    try {
      if (fs.existsSync(IDENTITY_FILE)) {
        fs.unlinkSync(IDENTITY_FILE);
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Refresh identity info (username, balance)
   */
  async refreshIdentity(): Promise<CliIdentity | null> {
    if (!this.identity) return null;

    const identityInfo = await identityService.getIdentity(this.identity.identityId);
    const username = await dpnsService.resolveUsername(this.identity.identityId);

    this.identity = {
      ...this.identity,
      username: username ?? undefined,
      balance: identityInfo?.balance,
    };

    this.saveToDisk(this.identity);
    return this.identity;
  }

  private saveToDisk(identity: CliIdentity): void {
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2), { mode: 0o600 });
    } catch (e) {
      // Ignore errors
    }
  }
}

export const cliIdentityService = new CliIdentityService();
