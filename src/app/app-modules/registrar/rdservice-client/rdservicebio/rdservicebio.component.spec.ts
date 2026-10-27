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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { RdservicebioComponent } from './rdservicebio.component';
import { RddeviceService } from '../../shared/services/rddevice.service';
import { RegistrarService } from '../../shared/services/registrar.service';
import { HealthIdOtpSuccessComponent } from '../../health-id-otp-generation/health-id-otp-generation.component';
import { GenerateMobileOtpGenerationComponent } from '../../generate-mobile-otp-generation/generate-mobile-otp-generation.component';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

describe('RdservicebioComponent', () => {
  let component: RdservicebioComponent;
  let fixture: ComponentFixture<RdservicebioComponent>;
  let rddevice: any;
  let registrar: any;
  let confirmation: any;
  let dialog: any;
  let router: Router;

  async function setup(aadharNumber: string | null) {
    rddevice = autoSpy(RddeviceService);
    registrar = autoSpy(RegistrarService);
    const params = aadharNumber ? { aadharNumber } : {};

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RdservicebioComponent],
      providers: [
        ...commonTestProviders({
          session: { userName: 'reg', providerServiceID: 7 },
        }),
        { provide: RddeviceService, useValue: rddevice },
        { provide: RegistrarService, useValue: registrar },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(params) } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(RdservicebioComponent, '')
      .compileComponents();

    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture = TestBed.createComponent(RdservicebioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('with an aadhaar number in the route', () => {
    beforeEach(() => setup('123412341234'));

    it('reads the aadhaar number and builds 101 select options', () => {
      expect(component.aadharBioNum).toBe('123412341234');
      expect(component.select.match(/<option/g)?.length).toBe(101);
      expect(component.select).toContain('<option value="100">100</option>');
    });

    it('reset clears every device field', () => {
      component.txtWadh = 'w';
      component.ddlAVDM = 'd';
      component.Ftype = 'f';
      component.reset();
      expect(component.txtWadh).toBe('');
      expect(component.ddlAVDM).toBe('');
      expect(component.Ftype).toBe('');
    });

    describe('discoverAvdm', () => {
      it('alerts success when a device is found', () => {
        rddevice.discoverAvdm.and.returnValue(of({ port: 11100 }));
        component.discoverAvdm();
        expect(confirmation.alert).toHaveBeenCalledWith(
          'RDSERVICE discovered successfully',
          'success',
        );
      });

      it('stays silent for a null result or an error', () => {
        spyOn(console, 'error');
        rddevice.discoverAvdm.and.returnValue(of(null));
        component.discoverAvdm();
        rddevice.discoverAvdm.and.returnValue(throwingObs());
        component.discoverAvdm();
        expect(confirmation.alert).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('deviceInfoAvdm queries the device', () => {
      component.deviceInfoAvdm();
      expect(rddevice.getDeviceInfo).toHaveBeenCalled();
    });

    describe('captureData', () => {
      it('navigates and generates ABHA after confirmation', () => {
        rddevice.captureAvdm.and.returnValue('<PidData/>');
        spyOn(component, 'generateAbha');
        component.captureData();
        expect(confirmation.confirmHealthId).toHaveBeenCalledWith(
          'success',
          'Fingerprint captured successfully',
        );
        expect(router.navigate).toHaveBeenCalledWith([
          '/registrar/registration/',
        ]);
        expect(component.showProgressBar).toBeTrue();
        expect(component.generateAbha).toHaveBeenCalled();
      });

      it('does nothing when the confirmation is declined', () => {
        rddevice.captureAvdm.and.returnValue('<PidData/>');
        confirmation.confirmHealthId.and.returnValue(of(false));
        component.captureData();
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('skips confirmation when capture returns null', () => {
        rddevice.captureAvdm.and.returnValue(null);
        component.captureData();
        expect(confirmation.confirmHealthId).not.toHaveBeenCalled();
      });
    });

    describe('generateAbha', () => {
      beforeEach(() => (component.captureres = '<PidData/>'));

      it('stores the transaction and asks for mobile OTP on success', () => {
        registrar.generateABHAForBiometric.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'T1' } }),
        );
        spyOn(component, 'generateMobileOTPForBio');
        component.generateAbha();
        expect(registrar.generateABHAForBiometric).toHaveBeenCalledWith({
          aadhaar: '123412341234',
          bioType: 'FMR',
          pid: '<PidData/>',
        });
        expect(component.transactionId).toBe('T1');
        expect(component.generateMobileOTPForBio).toHaveBeenCalled();
      });

      it('alerts and hides progress on an empty response', () => {
        component.showProgressBar = true;
        registrar.generateABHAForBiometric.and.returnValue(
          of({ statusCode: 200, data: {}, errorMessage: 'none' }),
        );
        component.generateAbha();
        expect(component.showProgressBar).toBeFalse();
        expect(confirmation.alert).toHaveBeenCalledWith('none', 'error');
      });
    });

    describe('generateMobileOTPForBio', () => {
      it('opens the mobile OTP dialog and continues with the returned txn', () => {
        component.transactionId = 'T1';
        dialog.open.and.returnValue(createDialogRefMock('T2'));
        spyOn(component, 'posthealthIDButtonCall');
        component.generateMobileOTPForBio();
        expect(dialog.open).toHaveBeenCalledWith(
          GenerateMobileOtpGenerationComponent,
          jasmine.objectContaining({
            data: { transactionId: 'T1', bioValue: true },
          }),
        );
        expect(component.transactionId).toBe('T2');
        expect(component.posthealthIDButtonCall).toHaveBeenCalled();
      });

      it('stops when the dialog closes without a value', () => {
        dialog.open.and.returnValue(createDialogRefMock(null));
        spyOn(component, 'posthealthIDButtonCall');
        component.generateMobileOTPForBio();
        expect(component.posthealthIDButtonCall).not.toHaveBeenCalled();
      });
    });

    describe('posthealthIDButtonCall', () => {
      beforeEach(() => (component.transactionId = 'T2'));

      it('stores ABHA data and shows the success dialog', () => {
        const res = { statusCode: 200, data: { healthIdNumber: '91-1' } };
        registrar.generateHealthIdWithUID.and.returnValue(of(res));
        component.posthealthIDButtonCall();
        expect(registrar.generateHealthIdWithUID).toHaveBeenCalledWith({
          txnId: 'T2',
          createdBy: 'reg',
          providerServiceMapID: 7,
        });
        expect(registrar.abhaGenerateData).toEqual(res.data);
        expect(registrar.aadharNumberNew).toBe('123412341234');
        expect(registrar.getabhaDetail).toHaveBeenCalledWith(true);
        expect(dialog.open).toHaveBeenCalledWith(
          HealthIdOtpSuccessComponent,
          jasmine.objectContaining({
            data: { res, generateHealthIDCardBio: true },
          }),
        );
      });

      it('alerts the error message on failure', () => {
        registrar.generateHealthIdWithUID.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'fail' }),
        );
        component.posthealthIDButtonCall();
        expect(component.showProgressBar).toBeFalse();
        expect(confirmation.alert).toHaveBeenCalledWith('fail', 'error');
      });

      it('alerts a generic message on http error', () => {
        registrar.generateHealthIdWithUID.and.returnValue(throwingObs());
        component.posthealthIDButtonCall();
        expect(confirmation.alert).toHaveBeenCalledWith(
          'Issue In Getting Beneficiary ABHA Details',
          'error',
        );
      });
    });
  });

  describe('without an aadhaar number', () => {
    beforeEach(() => setup(null));

    it('stores the captured PID on the device service instead of generating', () => {
      rddevice.captureAvdm.and.returnValue('<PidData/>');
      spyOn(component, 'generateAbha');
      component.captureData();
      expect(component.aadharBioNum).toBeNull();
      expect(rddevice.capturePID).toBe('<PidData/>');
      expect(router.navigate).toHaveBeenCalledWith([
        '/registrar/registration/',
      ]);
      expect(component.generateAbha).not.toHaveBeenCalled();
    });
  });
});
