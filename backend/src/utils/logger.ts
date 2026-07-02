import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
}

class Logger {
  private logLevel: LogLevel;
  private logFile?: NodeJS.WritableStream;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

    // Create logs directory if it doesn't exist
    const logsDir = join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir);
    }

    // Create log file stream
    if (process.env.NODE_ENV !== 'test') {
      const logFileName = `app-${new Date().toISOString().split('T')[0]}.log`;
      this.logFile = createWriteStream(join(logsDir, logFileName), { flags: 'a' });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };

    return JSON.stringify(logEntry);
  }

  private writeLog(level: LogLevel, message: string, meta?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);

    // Console output with colors
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m', // Gray
    };
    const reset = '\x1b[0m';

    const consoleMessage = `${colors[level]}[${level.toUpperCase()}]${reset} ${new Date().toISOString()} - ${message}`;
    console.log(consoleMessage);

    if (meta) {
      console.log('Meta:', meta);
    }

    // File output
    if (this.logFile) {
      this.logFile.write(formattedMessage + '\n');
    }
  }

  error(message: string, meta?: any): void {
    this.writeLog('error', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.writeLog('warn', message, meta);
  }

  info(message: string, meta?: any): void {
    this.writeLog('info', message, meta);
  }

  debug(message: string, meta?: any): void {
    this.writeLog('debug', message, meta);
  }

  close(): void {
    if (this.logFile) {
      this.logFile.end();
    }
  }
}

export const logger = new Logger();