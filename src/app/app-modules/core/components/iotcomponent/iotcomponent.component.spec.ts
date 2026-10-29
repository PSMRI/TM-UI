/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { IotcomponentComponent } from './iotcomponent.component';
import { CalibrationComponent } from '../calibration/calibration.component';
import { IotService } from '../../services/iot.service';
import { ConfirmationService } from '../../services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

describe('IotcomponentComponent', () => {
  let fixture: ComponentFixture<IotcomponentComponent>;
  let component: IotcomponentComponent;
  let iot: any;
  let dialog: any;
  let dialogRef: any;
  let confirmation: any;

  const ok = (status: number, msg: any = { message: 'm' + status }) => ({
    status,
    _body: JSON.stringify(msg),
  });
  const calibProcedure = {
    value: {
      calibrationStartAPI: '/calib/start',
      calibrationStatusAPI: '/calib/{cs_code}/status',
      calibrationEndAPI: '/calib/end',
    },
  };

  function setup(input: any) {
    iot = autoSpy(IotService);
    iot.startAPI.and.returnValue(of(ok(202)));
    iot.statusAPI.and.returnValue(of(ok(200, { temp: 98, pulse: 70 })));
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [IotcomponentComponent],
      providers: [
        ...commonTestProviders({
          dialogData: input,
          session: { providerServiceID: '42' },
        }),
        { provide: IotService, useValue: iot },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(IotcomponentComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    dialogRef = TestBed.inject(MatDialogRef);
    confirmation = TestBed.inject(ConfirmationService);
    component.assignSelectedLanguage();
  }

  describe('without calibration', () => {
    beforeEach(() => setup({ startAPI: '/temp', output: ['temp'] }));




    it('shows the status message for other status codes', () => {
      iot.statusAPI.and.returnValue(of({ status: 500, message: 'bad' }));
      component.ngOnInit();
      expect(component.errorMsg).toBe('bad');
    });



    it('start reports non-functional services when the call throws', () => {
      iot.startAPI.and.throwError('down');
      component.start();
      expect(component.errorMsg).toBe(
        LANGUAGE_EN.alerts.info.servicesNotFunctional,
      );
    });


    it('stop records the error message when ending fails', () => {
      component.statuscall = 1;
      iot.endAPI.and.returnValue(of({ status: 500, message: 'end failed' }));
      component.stop();
      expect(component.errorMsg).toBe('end failed');
    });

    it('stop only closes when nothing is running', () => {
      component.stop();
      expect(iot.endAPI).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalled();
    });

  });

  describe('with calibration', () => {
    beforeEach(() =>
      setup({
        startAPI: '/gluco',
        output: ['temp'],
        procedure: calibProcedure,
      }),
    );


    it('closes when calibration is cancelled', () => {
      dialog.open.and.returnValue(createDialogRefMock(null));
      component.ngOnInit();
      expect(dialogRef.close).toHaveBeenCalled();
      expect(iot.startAPI).not.toHaveBeenCalled();
    });


    describe('getCalibStatus', () => {
      beforeEach(() => {
        component.procedure = calibProcedure;
        component.stripCode = 'S9';
        component.startAPI = '/gluco';
        component.output = ['temp'];
      });


      it('closes when the success confirmation is declined', () => {
        confirmation.confirmCalibration.and.returnValue(of(false));
        iot.statusAPI.and.returnValue(of(ok(202)));
        component.getCalibStatus();
        expect(dialogRef.close).toHaveBeenCalled();
      });


    });

    describe('calibStop', () => {
      beforeEach(() => {
        component.procedure = calibProcedure;
        component.msgCalibration = true;
      });

      [undefined, 123].forEach((statuscall) => {
        describe(`with statuscall=${statuscall}`, () => {
          beforeEach(() => (component.statuscall = statuscall));

          it('closes after a successful end call', () => {
            iot.endCalibrationAPI.and.returnValue(of({ status: 200 }));
            component.stop();
            expect(iot.endCalibrationAPI).toHaveBeenCalledWith('/calib/end');
            expect(component.stoppedCalibration).toBeTrue();
            expect(dialogRef.close).toHaveBeenCalled();
          });

          it('closes with the error message on failure status', () => {
            iot.endCalibrationAPI.and.returnValue(
              of({ status: 500, message: 'x' }),
            );
            component.calibStop();
            expect(dialogRef.close).toHaveBeenCalledWith('x');
          });

        });
      });
    });
  });
});
