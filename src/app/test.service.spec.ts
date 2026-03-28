import { TestBed } from '@angular/core/testing';

import { TestService } from './test.service';
import { LoggerService } from './logger.service';

describe('TestService', () => {
  let service: TestService;
  let loggerService: LoggerService;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'error']);
    
    TestBed.configureTestingModule({
      providers: [
        TestService,
        { provide: LoggerService, useValue: loggerSpy }
      ],
    });
    service = TestBed.inject(TestService);
    loggerService = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add two numbers', () => {
    expect(service.add(1, 2)).toEqual(3);
    expect(loggerSpy.log).toHaveBeenCalledWith('Adding 1 and 2');
  });
});
