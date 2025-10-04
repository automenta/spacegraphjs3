import { ErrorHandler } from './ErrorHandler';
import { Logger } from './Logger';

/**
 * Error boundary configuration options
 */
export interface ErrorBoundaryOptions {
  /** Component/plugin name for error context */
  component: string;
  /** Whether to rethrow errors after handling */
  rethrow?: boolean;
  /** Custom error handler function */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Maximum number of errors to handle before disabling */
  maxErrors?: number;
  /** Time window for error rate limiting (ms) */
  rateLimitWindow?: number;
}

/**
 * Error information for error boundaries
 */
export interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
  timestamp: number;
  context?: Record<string, any>;
}

/**
 * Unified error boundary system for handling errors consistently across plugins
 */
export class ErrorBoundary {
  private static instance: ErrorBoundary;
  private errorHandler: ErrorHandler;
  private logger: Logger;
  private errorCounts: Map<string, { count: number; windowStart: number }> = new Map();
  private disposed: boolean = false;

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.logger = Logger.getInstance();
  }

  public static getInstance(): ErrorBoundary {
    if (!ErrorBoundary.instance) {
      ErrorBoundary.instance = new ErrorBoundary();
    }
    return ErrorBoundary.instance;
  }

  /**
   * Execute a function within an error boundary
   */
  public execute<T>(
    fn: () => T,
    options: ErrorBoundaryOptions,
    context?: Record<string, any>
  ): T | null {
    if (this.disposed) {
      this.logger.warn('ErrorBoundary', 'Cannot execute - ErrorBoundary is disposed');
      return null;
    }

    const errorKey = `${options.component}:${this.getErrorBoundaryId()}`;

    // Check rate limiting
    if (this.isRateLimited(errorKey, options)) {
      this.logger.warn('ErrorBoundary', `Rate limit exceeded for ${options.component}`);
      return null;
    }

    try {
      const result = fn();

      // Reset error count on successful execution
      this.resetErrorCount(errorKey);

      return result;
    } catch (error) {
      this.handleError(error as Error, options, context);

      if (options.rethrow) {
        throw error;
      }

      return null;
    }
  }

  /**
   * Execute an async function within an error boundary
   */
  public async executeAsync<T>(
    fn: () => Promise<T>,
    options: ErrorBoundaryOptions,
    context?: Record<string, any>
  ): Promise<T | null> {
    if (this.disposed) {
      this.logger.warn('ErrorBoundary', 'Cannot execute - ErrorBoundary is disposed');
      return null;
    }

    const errorKey = `${options.component}:${this.getErrorBoundaryId()}`;

    // Check rate limiting
    if (this.isRateLimited(errorKey, options)) {
      this.logger.warn('ErrorBoundary', `Rate limit exceeded for ${options.component}`);
      return null;
    }

    try {
      const result = await fn();

      // Reset error count on successful execution
      this.resetErrorCount(errorKey);

      return result;
    } catch (error) {
      this.handleError(error as Error, options, context);

      if (options.rethrow) {
        throw error;
      }

      return null;
    }
  }

  /**
   * Handle errors with comprehensive logging and reporting
   */
  private handleError(
    error: Error,
    options: ErrorBoundaryOptions,
    context?: Record<string, any>
  ): void {
    const errorKey = `${options.component}:${this.getErrorBoundaryId()}`;
    const errorInfo: ErrorInfo = {
      timestamp: Date.now(),
      context,
      componentStack: error.stack,
    };

    // Increment error count
    this.incrementErrorCount(errorKey, options);

    // Log the error with full context
    this.logger.error(options.component, 'ErrorBoundary caught error:', {
      error: error.message,
      stack: error.stack,
      context,
      errorInfo,
    });

    // Handle with ErrorHandler
    this.errorHandler.handleError(options.component, 'ErrorBoundary caught error', error, {
      context,
      errorBoundary: true,
      errorInfo,
    });

    // Call custom error handler if provided
    if (options.onError) {
      try {
        options.onError(error, errorInfo);
      } catch (handlerError) {
        this.logger.error('ErrorBoundary', 'Custom error handler failed:', handlerError);
      }
    }

    // Emit error event for monitoring
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('spacegraph:error', {
        detail: { error, errorInfo, component: options.component }
      }));
    }
  }

  /**
   * Check if error rate limit is exceeded
   */
  private isRateLimited(errorKey: string, options: ErrorBoundaryOptions): boolean {
    const maxErrors = options.maxErrors || 10;
    const rateLimitWindow = options.rateLimitWindow || 60000; // 1 minute default

    const errorData = this.errorCounts.get(errorKey);
    if (!errorData) return false;

    const now = Date.now();
    if (now - errorData.windowStart > rateLimitWindow) {
      // Reset window
      this.errorCounts.set(errorKey, { count: 0, windowStart: now });
      return false;
    }

    return errorData.count >= maxErrors;
  }

  /**
   * Increment error count for rate limiting
   */
  private incrementErrorCount(errorKey: string, options: ErrorBoundaryOptions): void {
    const rateLimitWindow = options.rateLimitWindow || 60000;
    const now = Date.now();

    const existing = this.errorCounts.get(errorKey);
    if (existing && now - existing.windowStart <= rateLimitWindow) {
      existing.count++;
    } else {
      this.errorCounts.set(errorKey, { count: 1, windowStart: now });
    }
  }

  /**
   * Reset error count after successful execution
   */
  private resetErrorCount(errorKey: string): void {
    this.errorCounts.delete(errorKey);
  }

  /**
   * Generate unique error boundary ID for this instance
   */
  private getErrorBoundaryId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get current error statistics
   */
  public getErrorStats(): Map<string, { count: number; windowStart: number }> {
    return new Map(this.errorCounts);
  }

  /**
   * Clear error statistics
   */
  public clearErrorStats(): void {
    this.errorCounts.clear();
  }

  /**
   * Dispose of the error boundary
   */
  public dispose(): void {
    this.disposed = true;
    this.errorCounts.clear();
  }
}

/**
 * Decorator for wrapping class methods with error boundaries
 */
export function WithErrorBoundary(options: ErrorBoundaryOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const errorBoundary = ErrorBoundary.getInstance();

    descriptor.value = function (...args: any[]) {
      return errorBoundary.execute(
        () => originalMethod.apply(this, args),
        options,
        { method: propertyKey, class: target.constructor.name }
      );
    };

    return descriptor;
  };
}

/**
 * Decorator for wrapping async class methods with error boundaries
 */
export function WithAsyncErrorBoundary(options: ErrorBoundaryOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const errorBoundary = ErrorBoundary.getInstance();

    descriptor.value = async function (...args: any[]) {
      return errorBoundary.executeAsync(
        () => originalMethod.apply(this, args),
        options,
        { method: propertyKey, class: target.constructor.name }
      );
    };

    return descriptor;
  };
}