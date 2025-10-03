import { Logger } from './Logger';

/**
 * Standardized error handling utility
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Get the singleton instance of the ErrorHandler
   * @returns The ErrorHandler instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with standardized logging
   * @param source - The source of the error
   * @param message - The error message
   * @param error - The error object
   * @param data - Optional additional data
   */
  public handleError(
    source: string,
    message: string,
    error?: any,
    data?: any
  ): void {
    this.logger.error(source, message, { error, ...data });
  }

  /**
   * Handle a warning with standardized logging
   * @param source - The source of the warning
   * @param message - The warning message
   * @param data - Optional additional data
   */
  public handleWarning(source: string, message: string, data?: any): void {
    this.logger.warn(source, message, data);
  }

  /**
   * Handle an info message with standardized logging
   * @param source - The source of the info message
   * @param message - The info message
   * @param data - Optional additional data
   */
  public handleInfo(source: string, message: string, data?: any): void {
    this.logger.info(source, message, data);
  }

  /**
   * Handle a debug message with standardized logging
   * @param source - The source of the debug message
   * @param message - The debug message
   * @param data - Optional additional data
   */
  public handleDebug(source: string, message: string, data?: any): void {
    this.logger.debug(source, message, data);
  }

  /**
   * Execute a function with error handling
   * @param source - The source of the operation
   * @param operation - The operation to execute
   * @param onError - Optional error handler
   * @returns The result of the operation or null if an error occurred
   */
  public async executeWithHandling<T>(
    source: string,
    operation: () => Promise<T>,
    onError?: (error: any) => void
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(source, 'Operation failed', error);
      if (onError) {
        onError(error);
      }
      return null;
    }
  }

  /**
   * Execute a synchronous function with error handling
   * @param source - The source of the operation
   * @param operation - The operation to execute
   * @param onError - Optional error handler
   * @returns The result of the operation or null if an error occurred
   */
  public executeSyncWithHandling<T>(
    source: string,
    operation: () => T,
    onError?: (error: any) => void
  ): T | null {
    try {
      return operation();
    } catch (error) {
      this.handleError(source, 'Operation failed', error);
      if (onError) {
        onError(error);
      }
      return null;
    }
  }

  /**
   * Wrap a function with error handling
   * @param source - The source of the operation
   * @param fn - The function to wrap
   * @returns A wrapped function that handles errors
   */
  public wrapFunction<T extends (...args: any[]) => any>(
    source: string,
    fn: T
  ): (...args: Parameters<T>) => ReturnType<T> | null {
    return (...args: Parameters<T>): ReturnType<T> | null => {
      try {
        return fn(...args);
      } catch (error) {
        this.handleError(source, 'Function execution failed', error);
        return null;
      }
    };
  }
}
