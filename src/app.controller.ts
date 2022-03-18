import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { AppLogger } from './logger/AppLogger';
import { LoggingInterceptor } from './logger/Logging.interceptor';

@Controller()
@UseInterceptors(LoggingInterceptor)
export class AppController {
  private readonly logger = new AppLogger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    await this.logger.debug(`Call hello World!`);
    await this.logger.debug(
      `Config is loaded: ${process.env.CONFIG_IS_LOADED}`,
    );
    return this.appService.getHello();
  }
}
