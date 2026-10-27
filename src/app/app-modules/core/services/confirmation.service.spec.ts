import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfirmationService } from './confirmation.service';
import { CommonDialogComponent } from '../components/common-dialog/common-dialog.component';

describe('ConfirmationService', () => {
  let service: ConfirmationService;
  let dialog: jasmine.SpyObj<MatDialog>;
  let instance: any;
  let dialogRef: any;

  beforeEach(() => {
    instance = { updateTimer: jasmine.createSpy('updateTimer') };
    dialogRef = { componentInstance: instance, afterClosed: () => of(true) };
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialog.open.and.returnValue(dialogRef);
    TestBed.configureTestingModule({
      providers: [ConfirmationService, { provide: MatDialog, useValue: dialog }],
    });
    service = TestBed.inject(ConfirmationService);
  });

  it('confirm should configure a confirm dialog with default buttons', () => {
    let result: any;
    service.confirm('Title', 'Msg').subscribe((r) => (result = r));
    expect(dialog.open).toHaveBeenCalledWith(CommonDialogComponent, {
      width: '420px',
      disableClose: false,
    });
    expect(instance).toEqual(
      jasmine.objectContaining({
        title: 'Title',
        message: 'Msg',
        btnOkText: 'OK',
        btnCancelText: 'Cancel',
        confirmAlert: true,
        alert: false,
      }),
    );
    expect(dialogRef.disableClose).toBeTrue();
    expect(result).toBeTrue();
  });

  it('confirm should accept custom button texts', () => {
    service.confirm('T', 'M', 'Yes', 'No');
    expect(instance.btnOkText).toBe('Yes');
    expect(instance.btnCancelText).toBe('No');
  });

  it('confirmHealthId should set confirmHealthID flag', () => {
    service.confirmHealthId('T', 'M');
    expect(instance.confirmHealthID).toBeTrue();
    expect(dialogRef.disableClose).toBeTrue();
  });

  it('alert should lower-case status and return the dialog ref', () => {
    const ref = service.alert('Saved', 'SUCCESS');
    expect(ref).toBe(dialogRef);
    expect(instance.status).toBe('success');
    expect(instance.alert).toBeTrue();
    expect(instance.message).toBe('Saved');
  });

  it('alert should default status to info', () => {
    service.alert('Hi');
    expect(instance.status).toBe('info');
    expect(instance.btnOkText).toBe('OK');
  });

  it('remarks should enable remarks mode', () => {
    service.remarks('Enter remarks');
    expect(instance.remarks).toBeTrue();
    expect(instance.btnOkText).toBe('Submit');
  });

  it('editRemarks should pass existing comments and use 60% width', () => {
    service.editRemarks('Edit', 'old comment');
    expect(dialog.open).toHaveBeenCalledWith(CommonDialogComponent, {
      width: '60%',
    });
    expect(instance.editRemarks).toBeTrue();
    expect(instance.comments).toBe('old comment');
  });

  it('notify should pass mandatories', () => {
    service.notify('Missing', ['a', 'b']);
    expect(instance.notify).toBeTrue();
    expect(instance.mandatories).toEqual(['a', 'b']);
  });

  it('choice should pass values', () => {
    service.choice('Pick', [1, 2]);
    expect(instance.choice).toBeTrue();
    expect(instance.values).toEqual([1, 2]);
    expect(instance.btnOkText).toBe('Confirm');
  });

  it('choiceSelect should enable choiceSelect only', () => {
    service.choiceSelect('Pick', [1]);
    expect(instance.choiceSelect).toBeTrue();
    expect(instance.choice).toBeFalse();
    expect(instance.btnOkText).toBe('Proceed');
  });

  it('startTimer should open a non-closable dialog and start the timer', () => {
    service.startTimer('T', 'M', 60);
    expect(dialog.open).toHaveBeenCalledWith(CommonDialogComponent, {
      width: '420px',
      disableClose: true,
    });
    expect(instance.sessionTimeout).toBeTrue();
    expect(instance.updateTimer).toHaveBeenCalledWith(60);
  });

  it('alertFetsenseMessage should set fetosense flags and default status', () => {
    service.alertFetsenseMessage('Test done');
    expect(instance.alertFetsenseMessage).toBeTrue();
    expect(instance.status).toBe('Fetosense Device');
  });

  it('confirmCalibration should use Yes/No defaults', () => {
    service.confirmCalibration('T', 'M');
    expect(instance.confirmcalibration).toBeTrue();
    expect(instance.btnOkText).toBe('Yes');
    expect(instance.btnCancelText).toBe('No');
  });

  it('confirmCBAC should pass cbac data', () => {
    service.confirmCBAC('T', 'M', { score: 5 });
    expect(instance.confirmCBAC).toBeTrue();
    expect(instance.cbacData).toEqual({ score: 5 });
  });

  it('should propagate dialog open failures', () => {
    dialog.open.and.throwError('no overlay');
    expect(() => service.alert('x')).toThrowError('no overlay');
  });
});
