import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedVerilensWorkflowService } from '../services/enhancedWorkflow';
import { BlockchainWorkflowService } from '../services/blockchainWorkflow';
import { errorHandlingService } from '../services/errorHandling';

// Mock the blockchain services
vi.mock('@mysten/dapp-kit', () => ({
  useSignAndExecuteTransactionBlock: () => ({
    mutate: vi.fn(),
  }),
  useCurrentAccount: () => ({
    address: '0x1234567890abcdef',
  }),
  useSuiClient: () => ({
    getOwnedObjects: vi.fn().mockResolvedValue({ data: [] }),
    dryRunTransactionBlock: vi.fn().mockResolvedValue({
      effects: {
        status: { status: 'success' },
        gasUsed: {
          computationCost: '1000000',
          storageCost: '500000',
          storageRebate: '200000'
        }
      }
    })
  })
}));

describe('Blockchain Workflow Tests', () => {
  let workflowService: EnhancedVerilensWorkflowService;
  let blockchainService: BlockchainWorkflowService;

  beforeEach(() => {
    workflowService = new EnhancedVerilensWorkflowService('testnet');
    blockchainService = new BlockchainWorkflowService('testnet');
    
    // Clear error logs before each test
    errorHandlingService.clearLogs();
  });

  describe('File Validation', () => {
    it('should validate correct media files', () => {
      const validMediaFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const validManifestFile = new File(['{"test": true}'], 'manifest.json', { type: 'application/json' });
      
      const result = workflowService.validateFiles(validMediaFile, validManifestFile);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject oversized media files', () => {
      const largeMediaFile = new File([new ArrayBuffer(60 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const validManifestFile = new File(['{"test": true}'], 'manifest.json', { type: 'application/json' });
      
      const result = workflowService.validateFiles(largeMediaFile, validManifestFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50MB');
    });

    it('should reject invalid file types', () => {
      const invalidMediaFile = new File(['test'], 'test.exe', { type: 'application/octet-stream' });
      const validManifestFile = new File(['{"test": true}'], 'manifest.json', { type: 'application/json' });
      
      const result = workflowService.validateFiles(invalidMediaFile, validManifestFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid media file type');
    });
  });

  describe('Cryptographic Operations', () => {
    it('should generate consistent verification hashes', async () => {
      const mediaBlobId = '0x1234567890abcdef';
      const manifestBlobId = '0xabcdef1234567890';
      
      const hash1 = await workflowService.generateVerificationHash(mediaBlobId, manifestBlobId);
      const hash2 = await workflowService.generateVerificationHash(mediaBlobId, manifestBlobId);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should generate different hashes for different inputs', async () => {
      const hash1 = await workflowService.generateVerificationHash('0x123', '0x456');
      const hash2 = await workflowService.generateVerificationHash('0xabc', '0xdef');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Error Handling', () => {
    it('should log blockchain errors correctly', () => {
      const mockError = new Error('Transaction failed');
      mockError.message = 'INSUFFICIENT_BALANCE';
      
      errorHandlingService.handleBlockchainError(mockError, 'Test Context');
      
      const recentErrors = errorHandlingService.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].code).toBe('INSUFFICIENT_BALANCE');
      expect(recentErrors[0].context).toBe('Test Context');
    });

    it('should log wallet errors correctly', () => {
      const mockError = new Error('User rejected');
      mockError.message = 'User rejected the transaction';
      
      errorHandlingService.handleWalletError(mockError, 'Wallet Context');
      
      const recentErrors = errorHandlingService.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].code).toBe('USER_REJECTED');
    });

    it('should provide error statistics', () => {
      // Log multiple errors
      errorHandlingService.handleBlockchainError(new Error('Network error'), 'Context 1');
      errorHandlingService.handleWalletError(new Error('User rejected'), 'Context 2');
      errorHandlingService.handleFileError(new Error('File too large'), 'Context 3');
      
      const stats = errorHandlingService.getErrorStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorTypes).toHaveProperty('NETWORK_ERROR');
      expect(stats.errorTypes).toHaveProperty('USER_REJECTED');
      expect(stats.errorTypes).toHaveProperty('FILE_TOO_LARGE');
    });
  });

  describe('Transaction Logging', () => {
    it('should log successful transactions', () => {
      const transaction = {
        type: 'verification' as const,
        stage: 'Request Verification',
        transactionHash: '0x1234567890abcdef',
        gasUsed: '0.001 SUI',
        status: 'success' as const,
        walletAddress: '0x1234567890abcdef'
      };
      
      errorHandlingService.logTransaction(transaction);
      
      const recentTransactions = errorHandlingService.getRecentTransactions(1);
      expect(recentTransactions).toHaveLength(1);
      expect(recentTransactions[0].status).toBe('success');
      expect(recentTransactions[0].gasUsed).toBe('0.001 SUI');
    });

    it('should log failed transactions', () => {
      const transaction = {
        type: 'minting' as const,
        stage: 'Mint Certificate',
        transactionHash: '0xabcdef1234567890',
        gasUsed: '0.002 SUI',
        status: 'failed' as const,
        error: 'Transaction reverted'
      };
      
      errorHandlingService.logTransaction(transaction);
      
      const recentTransactions = errorHandlingService.getRecentTransactions(1);
      expect(recentTransactions).toHaveLength(1);
      expect(recentTransactions[0].status).toBe('failed');
      expect(recentTransactions[0].error).toBe('Transaction reverted');
    });
  });

  describe('Gas Estimation', () => {
    it('should estimate gas for transactions', async () => {
      const mockTransaction = {
        effects: {
          status: { status: 'success' },
          gasUsed: {
            computationCost: '1000000',
            storageCost: '500000',
            storageRebate: '200000'
          }
        }
      };
      
      // Mock the dryRunTransactionBlock method
      vi.spyOn(blockchainService['suiClient'], 'dryRunTransactionBlock').mockResolvedValue(mockTransaction as any);
      
      const gasEstimate = await blockchainService.estimateGas({} as any);
      expect(gasEstimate).toContain('SUI');
    });
  });

  describe('Environment Configuration', () => {
    it('should load configuration from environment variables', () => {
      expect(blockchainService['packageId']).toBeDefined();
      expect(blockchainService['moduleName']).toBeDefined();
      expect(blockchainService['oracleConfigId']).toBeDefined();
      expect(blockchainService['clockObjectId']).toBeDefined();
    });

    it('should throw error if package ID is not configured', () => {
      // Temporarily remove package ID
      const originalPackageId = process.env.NEXT_PUBLIC_VERILENS_PACKAGE_ID;
      delete process.env.NEXT_PUBLIC_VERILENS_PACKAGE_ID;
      
      expect(() => new BlockchainWorkflowService('testnet')).toThrow('Verilens package ID not configured');
      
      // Restore package ID
      process.env.NEXT_PUBLIC_VERILENS_PACKAGE_ID = originalPackageId;
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete workflow with mocked blockchain responses', async () => {
    const workflowService = new EnhancedVerilensWorkflowService('testnet');
    
    // Create test files
    const mediaFile = new File(['test media content'], 'test.jpg', { type: 'image/jpeg' });
    const manifestFile = new File(['{"test": true}'], 'manifest.json', { type: 'application/json' });
    
    // Mock signer
    const mockSigner = {
      signAndExecuteTransactionBlock: vi.fn().mockResolvedValue({
        digest: '0x1234567890abcdef',
        effects: {
          status: { status: 'success' },
          gasUsed: {
            computationCost: '1000000',
            storageCost: '500000',
            storageRebate: '200000'
          }
        },
        objectChanges: []
      })
    };
    
    let stageUpdates: any[] = [];
    
    // Mock the workflow execution
    const result = await workflowService.executeCompleteWorkflow(
      mediaFile,
      manifestFile,
      '0x1234567890abcdef',
      mockSigner,
      false,
      (stage) => {
        stageUpdates.push(stage);
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.certificate).toBeDefined();
    expect(result.transactionHashes).toBeDefined();
    expect(result.transactionHashes?.length).toBeGreaterThan(0);
    expect(stageUpdates.length).toBeGreaterThan(0);
  });
});