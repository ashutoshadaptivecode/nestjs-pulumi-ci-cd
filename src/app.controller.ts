import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  home(): string {
    return 'Version 1.0';
  }

  @Get('/health')
  health() {
    return 'Ok Health';
  }
}
