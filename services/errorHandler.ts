// Offline-first error handling service
import { Platform } from 'react-native';

const TAG = '[ErrorHandler]';

export type ErrorType = 
  | 'network'
  | 'authentication' 
  | 'sync'
  | 'local_storage'
  | 'validation'
  | 'conflict'
  | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface OfflineError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  technicalMessage: string;
  timestamp: string;
  context?: Record<string, any>;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
  recoveryAction?: () => Promise<void>;
}

export interface ErrorResponse {
  userMessage: string;
  technicalMessage: string;
  recoveryAction?: () => Promise<void>;
  retryable: boolean;
  shouldShowToUser: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class OfflineFirstErrorHandler {
  private errorQueue: OfflineError[] = [];
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  };

  /**
   * Handle local storage errors - these should never block the user
   */
  handleLocalError(error: Error, context?: Record<string, any>): ErrorResponse {
    console.warn(`${TAG} Local storage error (non-blocking):`, error.message, context);
    
    return {
      userMessage: 'Data saved locally. Some features may be limited.',
      technicalMessage: error.message,
      retryable: false,
      shouldShowToUser: false, // Don't show to user - local operations should be transparent
    };
  }

  /**
   * Handle network errors - graceful degradation without blocking
   */
  handleNetworkError(error: Error, context?: Record<string, any>): ErrorResponse {
    console.log(`${TAG} Network error (offline mode):`, error.message, context);
    
    // Check if it's a connection error vs server error
    const isConnectionError = this.isConnectionError(error);
    
    if (isConnectionError) {
      return {
        userMessage: 'Working offline. Changes will sync when connection is restored.',
        technicalMessage: error.message,
        retryable: true,
        shouldShowToUser: false, // Don't show - offline mode is expected
      };
    } else {
      return {
        userMessage: 'Server temporarily unavailable. Working offline.',
        technicalMessage: error.message,
        retryable: true,
        shouldShowToUser: false,
      };
    }
  }

  /**
   * Handle sync errors with intelligent retry
   */
  handleSyncError(error: Error, context?: Record<string, any>): ErrorResponse {
    const errorId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineError: OfflineError = {
      id: errorId,
      type: 'sync',
      severity: 'medium',
      message: 'Sync operation failed',
      technicalMessage: error.message,
      timestamp: new Date().toISOString(),
      context,
      retryable: true,
      retryCount: 0,
      maxRetries: this.defaultRetryConfig.maxRetries,
    };

    this.queueErrorForRetry(offlineError);

    return {
      userMessage: 'Sync will retry automatically. Your data is safe locally.',
      technicalMessage: error.message,
      retryable: true,
      shouldShowToUser: false, // Background sync failures shouldn't interrupt user
    };
  }

  /**
   * Handle authentication errors - only show when user tries to access online features
   */
  handleAuthError(error: Error, context?: Record<string, any>): ErrorResponse {
    console.log(`${TAG} Auth error:`, error.message, context);
    
    const isTokenExpired = error.message.includes('expired') || error.message.includes('invalid');
    
    if (isTokenExpired) {
      return {
        userMessage: 'Please sign in again to access online features.',
        technicalMessage: error.message,
        retryable: false,
        shouldShowToUser: true, // Show when user tries to access auth-required features
        recoveryAction: async () => {
          // Clear auth state and prompt for re-authentication
          console.log(`${TAG} Clearing expired auth state`);
        },
      };
    }

    return {
      userMessage: 'Authentication failed. You can continue working offline.',
      technicalMessage: error.message,
      retryable: true,
      shouldShowToUser: true,
    };
  }

  /**
   * Handle validation errors - these should be shown to user
   */
  handleValidationError(error: Error, context?: Record<string, any>): ErrorResponse {
    console.log(`${TAG} Validation error:`, error.message, context);
    
    return {
      userMessage: error.message || 'Please check your input and try again.',
      technicalMessage: error.message,
      retryable: false,
      shouldShowToUser: true,
    };
  }

  /**
   * Handle conflict errors - these need user resolution
   */
  handleConflictError(error: Error, context?: Record<string, any>): ErrorResponse {
    console.log(`${TAG} Conflict error:`, error.message, context);
    
    return {
      userMessage: 'Data conflict detected. Please review and resolve.',
      technicalMessage: error.message,
      retryable: false,
      shouldShowToUser: true,
      recoveryAction: async () => {
        // Open conflict resolution UI
        console.log(`${TAG} Opening conflict resolution`);
      },
    };
  }

  /**
   * Generic error handler that routes to specific handlers
   */
  handleError(error: Error, type?: ErrorType, context?: Record<string, any>): ErrorResponse {
    const errorType = type || this.classifyError(error);
    
    switch (errorType) {
      case 'local_storage':
        return this.handleLocalError(error, context);
      case 'network':
        return this.handleNetworkError(error, context);
      case 'sync':
        return this.handleSyncError(error, context);
      case 'authentication':
        return this.handleAuthError(error, context);
      case 'validation':
        return this.handleValidationError(error, context);
      case 'conflict':
        return this.handleConflictError(error, context);
      default:
        return this.handleUnknownError(error, context);
    }
  }

  /**
   * Handle unknown errors with safe defaults
   */
  private handleUnknownError(error: Error, context?: Record<string, any>): ErrorResponse {
    console.error(`${TAG} Unknown error:`, error, context);
    
    return {
      userMessage: 'Something went wrong. Your data is safe locally.',
      technicalMessage: error.message,
      retryable: false,
      shouldShowToUser: true,
    };
  }

  /**
   * Classify error type based on error message and properties
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
      return 'authentication';
    }
    if (message.includes('sync') || message.includes('conflict')) {
      return 'sync';
    }
    if (message.includes('storage') || message.includes('database')) {
      return 'local_storage';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    return 'unknown';
  }

  /**
   * Check if error is a connection error vs server error
   */
  private isConnectionError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('network request failed') ||
           message.includes('connection refused') ||
           message.includes('timeout') ||
           message.includes('no internet');
  }

  /**
   * Queue error for retry with exponential backoff
   */
  private queueErrorForRetry(error: OfflineError): void {
    if (error.retryCount >= error.maxRetries) {
      console.log(`${TAG} Max retries reached for error ${error.id}`);
      return;
    }

    this.errorQueue.push(error);
    this.scheduleRetry(error);
  }

  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry(error: OfflineError): void {
    const delay = Math.min(
      this.defaultRetryConfig.baseDelay * Math.pow(this.defaultRetryConfig.backoffMultiplier, error.retryCount),
      this.defaultRetryConfig.maxDelay
    );

    console.log(`${TAG} Scheduling retry for error ${error.id} in ${delay}ms (attempt ${error.retryCount + 1})`);

    const timer = setTimeout(async () => {
      await this.retryError(error);
    }, delay);

    this.retryTimers.set(error.id, timer);
  }

  /**
   * Retry a failed operation
   */
  private async retryError(error: OfflineError): Promise<void> {
    try {
      error.retryCount++;
      
      if (error.recoveryAction) {
        await error.recoveryAction();
        console.log(`${TAG} Successfully retried error ${error.id}`);
        this.removeErrorFromQueue(error.id);
      }
    } catch (retryError) {
      console.log(`${TAG} Retry failed for error ${error.id}:`, retryError);
      
      if (error.retryCount < error.maxRetries) {
        this.scheduleRetry(error);
      } else {
        console.log(`${TAG} Giving up on error ${error.id} after ${error.retryCount} attempts`);
        this.removeErrorFromQueue(error.id);
      }
    }
  }

  /**
   * Remove error from retry queue
   */
  private removeErrorFromQueue(errorId: string): void {
    this.errorQueue = this.errorQueue.filter(e => e.id !== errorId);
    
    const timer = this.retryTimers.get(errorId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(errorId);
    }
  }

  /**
   * Get current error queue status
   */
  getErrorQueueStatus(): { pendingRetries: number; errors: OfflineError[] } {
    return {
      pendingRetries: this.errorQueue.length,
      errors: [...this.errorQueue],
    };
  }

  /**
   * Clear all pending retries
   */
  clearErrorQueue(): void {
    this.retryTimers.forEach(timer => clearTimeout(timer));
    this.retryTimers.clear();
    this.errorQueue = [];
    console.log(`${TAG} Cleared error queue`);
  }

  /**
   * Create a safe wrapper for async operations
   */
  wrapAsyncOperation<T>(
    operation: () => Promise<T>,
    errorType?: ErrorType,
    context?: Record<string, any>
  ): Promise<T | null> {
    return operation().catch(error => {
      const errorResponse = this.handleError(error, errorType, context);
      
      // Only throw if it's a validation error or other user-facing error
      if (errorResponse.shouldShowToUser && errorType === 'validation') {
        throw error;
      }
      
      // For other errors, return null and let the app continue
      return null;
    });
  }

  /**
   * Create a safe wrapper for sync operations
   */
  wrapSyncOperation<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> {
    return this.wrapAsyncOperation(operation, 'sync', context);
  }

  /**
   * Create a safe wrapper for network operations
   */
  wrapNetworkOperation<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> {
    return this.wrapAsyncOperation(operation, 'network', context);
  }
}

// Export singleton instance
export const errorHandler = new OfflineFirstErrorHandler();

// Export utility functions
export const handleError = (error: Error, type?: ErrorType, context?: Record<string, any>) => 
  errorHandler.handleError(error, type, context);

export const wrapAsyncOperation = <T>(
  operation: () => Promise<T>,
  errorType?: ErrorType,
  context?: Record<string, any>
) => errorHandler.wrapAsyncOperation(operation, errorType, context);

export const wrapSyncOperation = <T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
) => errorHandler.wrapSyncOperation(operation, context);

export const wrapNetworkOperation = <T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
) => errorHandler.wrapNetworkOperation(operation, context);

export default errorHandler;