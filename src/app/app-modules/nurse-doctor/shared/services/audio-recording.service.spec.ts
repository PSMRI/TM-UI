import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { AudioRecordingService } from './audio-recording.service';

describe('AudioRecordingService', () => {
  let service: AudioRecordingService;
  let httpMock: HttpTestingController;
  let track: jasmine.SpyObj<any>;

  const fakeRecorder = (succeed: boolean) => ({
    stop: (ok: (b: any) => void, fail: () => void) =>
      succeed ? ok(new Blob(['x'])) : fail(),
  });

  const primeRecording = (succeed = true) => {
    track = jasmine.createSpyObj('track', ['stop']);
    (service as any).recorder = fakeRecorder(succeed);
    (service as any).startTime = Date.now();
    (service as any).stream = { getAudioTracks: () => [track] };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AudioRecordingService],
    });
    service = TestBed.inject(AudioRecordingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('startRecording', () => {
    it('should emit 00:00 and request microphone access', () => {
      const times: string[] = [];
      service.getRecordedTime().subscribe((t) => times.push(t));
      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(
        new Promise(() => undefined),
      );
      service.startRecording();
      expect(times).toEqual(['00:00']);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
      });
    });

    it('should report failure when microphone access is denied', async () => {
      const failures: string[] = [];
      service.recordingFailed().subscribe((f) => failures.push(f));
      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(
        Promise.reject(new Error('denied')),
      );
      service.startRecording();
      await new Promise((r) => setTimeout(r));
      expect(failures).toEqual(['Error in recording']);
    });

    it('should do nothing when already recording', () => {
      (service as any).recorder = {};
      const spy = spyOn(navigator.mediaDevices, 'getUserMedia');
      service.startRecording();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('stopRecording', () => {
    it('should emit the recorded blob with a .wav title and release media', () => {
      let output: any;
      service.getRecordedBlob().subscribe((o) => (output = o));
      primeRecording(true);
      service.stopRecording();
      expect(output.blob).toEqual(jasmine.any(Blob));
      expect(output.title).toMatch(/^audio_\d+\.wav$/);
      expect(track.stop).toHaveBeenCalled();
      expect((service as any).recorder).toBeNull();
    });

    it('should not emit when there is no start time', () => {
      const spy = jasmine.createSpy('blob');
      service.getRecordedBlob().subscribe(spy);
      primeRecording(true);
      (service as any).startTime = null;
      service.stopRecording();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should report failure when recorder fails to stop', () => {
      const failures: string[] = [];
      service.recordingFailed().subscribe((f) => failures.push(f));
      primeRecording(false);
      service.stopRecording();
      expect(failures).toEqual(['Recording Failed']);
      expect(track.stop).toHaveBeenCalled();
    });

    it('should be a no-op when not recording', () => {
      expect(() => service.stopRecording()).not.toThrow();
    });
  });

  it('abortRecording should stop tracks and reset state', () => {
    primeRecording();
    service.abortRecording();
    expect(track.stop).toHaveBeenCalled();
    expect((service as any).stream).toBeNull();
    expect((service as any).startTime).toBeNull();
  });

  it('toString should zero-pad single digits', () => {
    const fmt = (v: number) => (service as any).toString(v);
    expect(fmt(0)).toBe('00');
    expect(fmt(5)).toBe('05');
    expect(fmt(42)).toBe(42);
  });

  it('getResultStatus should POST the form data', () => {
    const fd = new FormData();
    fd.append('file', 'x');
    service.getResultStatus(fd).subscribe();
    const req = httpMock.expectOne(environment.getResultStatusURL);
    expect(req.request.body).toBe(fd);
    req.flush({});
  });
});
