import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RddeviceService } from './rddevice.service';

describe('RddeviceService', () => {
  let service: RddeviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RddeviceService],
    });
    service = TestBed.inject(RddeviceService);
  });

  it('should be created with default RD settings', () => {
    expect(service.MethodInfo).toBe('/rd/info');
    expect(service.MethodCapture).toBe('/rd/capture');
    expect(service.rdURL).toBe('');
  });

  it('discoverAvdm should set the first port url on subscribe', () => {
    const next = jasmine.createSpy('next');
    service.discoverAvdm().subscribe({ next });
    expect(service.rdURL).toMatch(/^https?:\/\/127\.0\.0\.1:11101$/);
    // discovery is not implemented beyond the first port, so nothing is emitted
    expect(next).not.toHaveBeenCalled();
  });

  it('discoverRecursive should error when all ports are exhausted', () => {
    const observer = jasmine.createSpyObj('observer', ['error', 'complete']);
    (service as any).discoverRecursive(observer, 'http://127.0.0.1:', [1], 1);
    expect(observer.error).toHaveBeenCalledWith(
      'Connection failed. Please try again.',
    );
    expect(observer.complete).toHaveBeenCalled();
  });

  it('getDeviceInfo / captureAvdm currently return undefined (stubs)', () => {
    expect(service.getDeviceInfo()).toBeUndefined();
    expect(service.captureAvdm()).toBeUndefined();
    expect(service.pidDetailData.value).toBeUndefined();
  });

  it('getpidDetail should store and emit the PID', () => {
    service.getpidDetail('<pid/>');
    expect(service.pidDetail).toBe('<pid/>');
    expect(service.pidDetailData.value).toBe('<pid/>');
  });
});
