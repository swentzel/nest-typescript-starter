import { Logger } from '@nestjs/common';
import { format, transports, createLogger } from 'winston';
import axios from 'axios';
import { AxiosRequestConfig } from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const os = require('os');

interface LogData {
  appName?: string;
  env?: string;
  hostname?: string;
  level?: string;
  message?: string;
  context?: string;
  handler?: string;
  runtime?: number;
}

const customFormat = format.combine(
  // format.colorize(),
  format.timestamp({
    format: 'YY-MM-DD HH:MM:SS',
  }),
  format.printf((entry) => {
    return (
      format
        .colorize()
        .colorize(
          entry.level.toString(),
          `[${entry.level}] ${entry.timestamp} `,
        ) + entry.message
    );
  }),
);

const consoleLogger = createLogger({
  level: 'debug',
  format: customFormat,
  transports: [new transports.Console()],
});

// export class AppLogger implements LoggerService {
export class AppLogger extends Logger {
  constructor(context?: string) {
    super(context);
  }

  public async log(message: string) {
    const coloredContext = format
      .colorize()
      .colorize('info', `[${this.context}]`);

    if (typeof message === 'string') {
      consoleLogger.info(`${coloredContext} ${message}`);
    } else {
      consoleLogger.verbose(`${coloredContext}:`);
      console.log(message);
    }

    // Loggly
    await this.sendToLoggly('info', message);
  }

  public async error(message: string | any, trace?: string) {
    const coloredContext = format
      .colorize()
      .colorize('error', `[${this.context}]`);

    if (typeof message === 'string') {
      consoleLogger.error(`${coloredContext} ${message}`);
      consoleLogger.error(trace);
    } else {
      consoleLogger.error(`${coloredContext}:`);
      console.log(message);
      console.log(trace);
    }

    // Loggly
    await this.sendToLoggly('error', message);
  }

  public async warn(message: string | any) {
    const coloredContext = format
      .colorize()
      .colorize('warn', `[${this.context}]`);

    if (typeof message === 'string') {
      consoleLogger.warn(`${coloredContext} ${message}`);
    } else {
      consoleLogger.verbose(`${coloredContext}:`);
      console.log(message);
    }

    // Loggly
    await this.sendToLoggly('warn', message);
  }

  public async debug(message: string | any) {
    const coloredContext = format
      .colorize()
      .colorize('debug', `[${this.context}]`);

    if (typeof message === 'string') {
      consoleLogger.debug(`${coloredContext} ${message}`);
    } else {
      consoleLogger.verbose(`${coloredContext}:`);
      console.log(message);
    }

    // Loggly
    await this.sendToLoggly('debug', message);
  }

  public async verbose(message: string | any) {
    const coloredContext = format
      .colorize()
      .colorize('verbose', `[${this.context}]`);

    if (typeof message === 'string') {
      consoleLogger.verbose(`${coloredContext} ${message}`);
    } else {
      consoleLogger.verbose(`${coloredContext}:`);
      console.log(message);
    }

    // Loggly
    await this.sendToLoggly('verbose', message);
  }

  public printLine() {
    const line = format
      .colorize()
      .colorize(
        'debug',
        `***************************************************************************`,
      );
    console.log(line);
  }

  public async logRequest(request: Request, method?: string) {
    await this.log(`${request.method} ${request.url} | ${method} | start`);
  }

  public async traceRequest(
    request: Request,
    handler?: string,
    runtime?: number,
  ) {
    const message = `${request.method} ${request.url} | ${handler} | done in ${runtime}ms`;
    await this.log(message);

    const logData: LogData = {
      context: this.context,
      handler,
      message,
      runtime,
    };
    await this.sendToLoggly('info', message, logData);
  }

  private async sendToLoggly(
    level: string,
    message: string,
    logData?: LogData,
  ): Promise<void> {
    try {
      const url = `https://logs-01.loggly.com/inputs/${process.env.LOGGLY_TOKEN}/tag/http/`;

      if (typeof logData === 'undefined') {
        logData = {};
      }
      logData.appName = process.env.APP_NAME;
      logData.env = process.env.ENV;
      logData.hostname = os.hostname();
      logData.level = level;
      logData.message = message;

      const config: AxiosRequestConfig = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        proxy: false,
        url,
      };
      await axios.post(url, logData, config);
    } catch (err) {
      if (err instanceof Error) {
        console.log(
          `[INFO] Log could not be sent to loggly. Message: ${err.message}`,
        );
      } else {
        console.error(err);
      }
    }
  }
}
