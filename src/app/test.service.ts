import { inject, Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class TestService {
  private logger = inject(LoggerService);

  add(a: number, b: number) {
    this.logger.log(`Adding ${a} and ${b}`);
    return a + b;
  }

  subtract(a: number, b: number) {
    this.logger.log(`Subtracting ${a} and ${b}`);
    return a - b;
  }
}
