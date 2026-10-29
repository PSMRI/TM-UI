import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { CameraService } from './camera.service';
import { CameraDialogComponent } from '../components/camera-dialog/camera-dialog.component';

describe('CameraService', () => {
  let service: CameraService;
  let dialog: jasmine.SpyObj<MatDialog>;
  let instance: any;

  beforeEach(() => {
    instance = {};
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialog.open.and.returnValue({
      componentInstance: instance,
      afterClosed: () => of('closed-value'),
    } as any);
    TestBed.configureTestingModule({
      providers: [CameraService, { provide: MatDialog, useValue: dialog }],
    });
    service = TestBed.inject(CameraService);
  });

  it('capture should open camera dialog in capture mode', () => {
    let result: any;
    service.capture().subscribe((r) => (result = r));
    expect(dialog.open).toHaveBeenCalledWith(
      CameraDialogComponent,
      jasmine.anything(),
    );
    expect(instance.capture).toBeTrue();
    expect(instance.imageCode).toBeFalse();
    expect(result).toBe('closed-value');
  });

  it('viewImage should open dialog with the image code', () => {
    service.viewImage('base64img');
    expect(instance.capture).toBeFalse();
    expect(instance.imageCode).toBe('base64img');
  });

  it('annotate should pass image, points and language', () => {
    const points = [{ x: 1 }];
    let result: any;
    service
      .annotate('img', points, { a: 1 })
      .subscribe((r) => (result = r));
    expect(dialog.open).toHaveBeenCalledWith(CameraDialogComponent, {
      width: '80%',
    });
    expect(instance.annotate).toBe('img');
    expect(instance.availablePoints).toBe(points);
    expect(instance.current_language_set).toEqual({ a: 1 });
    expect(result).toBe('closed-value');
  });

  it('ViewGraph should open dialog with only graph enabled', () => {
    service.ViewGraph({ g: 1 });
    expect(instance.graph).toEqual({ g: 1 });
    expect(instance.annotate).toBeFalse();
    expect(instance.availablePoints).toBeFalse();
    expect(instance.capture).toBeFalse();
  });
});
