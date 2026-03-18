/**
 * CLI SDK service - wraps the existing evoSdkService for CLI usage
 */
import { evoSdkService } from '../../../lib/services/evo-sdk-service.js';
import { YAPPR_CONTRACT_ID, DEFAULT_NETWORK } from '../../../lib/constants.js';

export interface CliSdkConfig {
  network?: 'testnet' | 'mainnet';
  contractId?: string;
  quiet?: boolean;
}

class CliSdkService {
  private initialized = false;
  private quiet = false;

  async initialize(config: CliSdkConfig = {}): Promise<void> {
    if (this.initialized) return;

    this.quiet = config.quiet ?? false;
    const network = config.network ?? (process.env.YAPPR_NETWORK as 'testnet' | 'mainnet') ?? DEFAULT_NETWORK;
    const contractId = config.contractId ?? process.env.YAPPR_CONTRACT_ID ?? YAPPR_CONTRACT_ID;

    if (!this.quiet) {
      console.log(`Connecting to Dash Platform (${network})...`);
    }

    await evoSdkService.initialize({ network, contractId });

    this.initialized = true;
    if (!this.quiet) {
      console.log('Connected.');
    }
  }

  isReady(): boolean {
    return this.initialized && evoSdkService.isReady();
  }

  async cleanup(): Promise<void> {
    await evoSdkService.cleanup();
    this.initialized = false;
  }
}

export const cliSdkService = new CliSdkService();
