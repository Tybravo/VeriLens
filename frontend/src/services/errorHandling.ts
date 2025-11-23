'use client';

import { toast } from 'sonner';

export interface ErrorDetails {
  message: string;
  code?: string;
  context?: string;
  stack?: string;
  timestamp: number;
  userAgent?: string;
  walletAddress?: string;
  transactionHash?: string;
}

export interface TransactionLog {
  type: 'verification' | 'attestation' | 'sealing' | 'minting';
  stage: string;
  transactionHash: string;
  gasUsed: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  error?: string;
  walletAddress?: string;
}

/**
 * Comprehensive error handling and transaction monitoring service
 * Provides detailed logging, error tracking, and user notifications
 */
export class ErrorHandlingService {
  private errorLog: ErrorDetails[] = [];
  private transactionLog: TransactionLog[] = [];
  private maxLogSize = 100;

  constructor() {
    // Initialize error boundary
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  /**
   * Handle global JavaScript errors
   */
  private handleGlobalError(event: ErrorEvent) {
    this.logError({
      message: event.message,
      context: 'Global Error',
      stack: event.error?.stack,
      userAgent: navigator.userAgent,
    });
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    
    this.logError({
      message,
      context: 'Unhandled Promise Rejection',
      stack: reason instanceof Error ? reason.stack : undefined,
      userAgent: navigator.userAgent,
    });
  }

  /**
   * Log error details
   */
  logError(error: Omit<ErrorDetails, 'timestamp'>): void {
    const errorDetails: ErrorDetails = {
      ...error,
      timestamp: Date.now(),
    };

    this.errorLog.push(errorDetails);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Show user-friendly notification
    this.notifyUser(errorDetails);
  }

  /**
   * Log transaction details
   */
  logTransaction(transaction: Omit<TransactionLog, 'timestamp'>): void {
    const transactionDetails: TransactionLog = {
      ...transaction,
      timestamp: Date.now(),
    };

    this.transactionLog.push(transactionDetails);
    
    // Maintain log size limit
    if (this.transactionLog.length > this.maxLogSize) {
      this.transactionLog = this.transactionLog.slice(-this.maxLogSize);
    }

    // Show transaction notification
    this.notifyTransaction(transactionDetails);
  }

  /**
   * Notify user about errors with appropriate messaging
   */
  private notifyUser(error: ErrorDetails): void {
    let userMessage = 'An unexpected error occurred';
    let type: 'error' | 'warning' = 'error';

    // Categorize and customize error messages
    if (error.message.includes('wallet')) {
      userMessage = 'Wallet connection failed. Please check your wallet and try again.';
    } else if (error.message.includes('transaction')) {
      userMessage = 'Transaction failed. This might be due to insufficient gas or network issues.';
    } else if (error.message.includes('upload')) {
      userMessage = 'File upload failed. Please check your file format and size.';
    } else if (error.message.includes('network')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('insufficient')) {
      userMessage = 'Insufficient balance. Please ensure you have enough SUI for gas fees.';
      type = 'warning';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Operation timed out. Please try again.';
      type = 'warning';
    } else if (error.message.includes('cancelled')) {
      userMessage = 'Operation was cancelled.';
      type = 'warning';
    }

    if (type === 'error') {
      toast.error(userMessage, {
        duration: 5000,
        description: error.context || 'Check console for details',
      });
    } else {
      toast.warning(userMessage, {
        duration: 5000,
        description: error.context || 'Check console for details',
      });
    }

    // Log to console for debugging
    console.error('VeriLens Error:', error);
  }

  /**
   * Notify user about transaction status
   */
  private notifyTransaction(transaction: TransactionLog): void {
    const { type, status, gasUsed, transactionHash } = transaction;

    let message = '';
    let typeIcon: 'success' | 'error' | 'loading' = 'success';

    switch (status) {
      case 'success':
        message = `${this.formatTransactionType(type)} completed successfully`;
        if (gasUsed) {
          message += ` (Gas: ${gasUsed})`;
        }
        break;
      case 'failed':
        message = `${this.formatTransactionType(type)} failed`;
        typeIcon = 'error';
        break;
      case 'pending':
        message = `${this.formatTransactionType(type)} submitted`;
        typeIcon = 'loading';
        break;
    }

    if (typeIcon === 'success') {
      toast.success(message, {
        duration: 4000,
        action: transactionHash ? {
          label: 'View',
          onClick: () => window.open(`https://suiexplorer.com/txblock/${transactionHash}?network=testnet`, '_blank')
        } : undefined,
      });
    } else if (typeIcon === 'error') {
      toast.error(message, {
        duration: 5000,
      });
    } else {
      toast.loading(message, {
        duration: 3000,
      });
    }
  }

  /**
   * Format transaction type for display
   */
  private formatTransactionType(type: TransactionLog['type']): string {
    const typeMap = {
      verification: 'Verification request',
      attestation: 'Attestation submission',
      sealing: 'Certificate sealing',
      minting: 'Certificate minting',
    };
    return typeMap[type];
  }

  /**
   * Handle blockchain-specific errors
   */
  handleBlockchainError(error: any, context: string): void {
    let errorMessage = 'Blockchain operation failed';
    let errorCode: string | undefined;

    if (error.message) {
      errorMessage = error.message;
      
      // Extract specific blockchain error codes
      if (error.message.includes('INSUFFICIENT_BALANCE')) {
        errorCode = 'INSUFFICIENT_BALANCE';
        errorMessage = 'Insufficient SUI balance for transaction';
      } else if (error.message.includes('INVALID_TRANSACTION')) {
        errorCode = 'INVALID_TRANSACTION';
        errorMessage = 'Invalid transaction format';
      } else if (error.message.includes('TRANSACTION_EXPIRED')) {
        errorCode = 'TRANSACTION_EXPIRED';
        errorMessage = 'Transaction expired';
      } else if (error.message.includes('REVERTED')) {
        errorCode = 'TRANSACTION_REVERTED';
        errorMessage = 'Transaction was reverted';
      } else if (error.message.includes('NETWORK_ERROR')) {
        errorCode = 'NETWORK_ERROR';
        errorMessage = 'Network connection error';
      }
    }

    this.logError({
      message: errorMessage,
      code: errorCode,
      context,
      stack: error.stack,
    });
  }

  /**
   * Handle wallet-specific errors
   */
  handleWalletError(error: any, context: string): void {
    let errorMessage = 'Wallet operation failed';
    let errorCode: string | undefined;

    if (error.message) {
      errorMessage = error.message;
      
      if (error.message.includes('rejected')) {
        errorCode = 'USER_REJECTED';
        errorMessage = 'User rejected the transaction';
      } else if (error.message.includes('timeout')) {
        errorCode = 'WALLET_TIMEOUT';
        errorMessage = 'Wallet connection timeout';
      } else if (error.message.includes('not found')) {
        errorCode = 'WALLET_NOT_FOUND';
        errorMessage = 'Wallet not found';
      } else if (error.message.includes('locked')) {
        errorCode = 'WALLET_LOCKED';
        errorMessage = 'Wallet is locked';
      }
    }

    this.logError({
      message: errorMessage,
      code: errorCode,
      context,
      stack: error.stack,
    });
  }

  /**
   * Handle file upload errors
   */
  handleFileError(error: any, context: string): void {
    let errorMessage = 'File operation failed';
    let errorCode: string | undefined;

    if (error.message) {
      errorMessage = error.message;
      
      if (error.message.includes('size')) {
        errorCode = 'FILE_TOO_LARGE';
        errorMessage = 'File size exceeds limit';
      } else if (error.message.includes('type')) {
        errorCode = 'INVALID_FILE_TYPE';
        errorMessage = 'Invalid file type';
      } else if (error.message.includes('upload')) {
        errorCode = 'UPLOAD_FAILED';
        errorMessage = 'File upload failed';
      }
    }

    this.logError({
      message: errorMessage,
      code: errorCode,
      context,
      stack: error.stack,
    });
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ErrorDetails[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(limit: number = 10): TransactionLog[] {
    return this.transactionLog.slice(-limit);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    recentErrors: number;
    errorTypes: Record<string, number>;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    const recentErrors = this.errorLog.filter(e => e.timestamp > oneHourAgo).length;
    
    const errorTypes: Record<string, number> = {};
    this.errorLog.forEach(error => {
      const type = error.code || 'UNKNOWN';
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      recentErrors,
      errorTypes,
    };
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.errorLog = [];
    this.transactionLog = [];
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    const logs = {
      errors: this.errorLog,
      transactions: this.transactionLog,
      exportTime: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    };

    return JSON.stringify(logs, null, 2);
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();