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
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import {
  GenerateAbhaComponent,
  authMethodComponent,
} from './generate-abha.component';
import { RegistrarService } from '../shared/services/registrar.service';
import { HealthIdOtpGenerationComponent } from '../health-id-otp-generation/health-id-otp-generation.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
} from 'src/testing/test-utils';

describe('GenerateAbhaComponent', () => {
  let component: GenerateAbhaComponent;
  let fixture: ComponentFixture<GenerateAbhaComponent>;
  let registrar: any;
  let dialog: any;
  let dialogRef: any;

  beforeEach(async () => {
    registrar = autoSpy(RegistrarService);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GenerateAbhaComponent],
      providers: [
        ...commonTestProviders(),
        { provide: RegistrarService, useValue: registrar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(GenerateAbhaComponent, '')
      .compileComponents();

    dialog = TestBed.inject(MatDialog);
    dialogRef = TestBed.inject(MatDialogRef);
    fixture = TestBed.createComponent(GenerateAbhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the form and sets the language on init', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.abhaGenerateForm.value).toEqual({
      modeofAbhaHealthID: null,
      aadharNumber: null,
    });
    expect(component.abhaGenerateForm.valid).toBeFalse();
  });

  it('closeDialog closes and clears the selected values', () => {
    component.modeofAbhaHealthID = 'AADHAR';
    component.aadharNumber = '1234';
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(component.modeofAbhaHealthID).toBeNull();
    expect(component.aadharNumber).toBeNull();
  });

  it('resetAbhaValidateForm clears both fields', () => {
    component.abhaGenerateForm.setValue({
      modeofAbhaHealthID: 'AADHAR',
      aadharNumber: '1234',
    });
    component.resetAbhaValidateForm();
    expect(component.abhaGenerateForm.value).toEqual({
      modeofAbhaHealthID: null,
      aadharNumber: null,
    });
  });

  it('getAbhaValues copies form values to the component', () => {
    component.abhaGenerateForm.setValue({
      modeofAbhaHealthID: 'BIOMETRIC',
      aadharNumber: '999',
    });
    component.getAbhaValues();
    expect(component.modeofAbhaHealthID).toBe('BIOMETRIC');
    expect(component.aadharNumber).toBe('999');
  });

  describe('generateABHACard', () => {
    it('passes IDs and opens the OTP dialog for AADHAR mode', () => {
      component.abhaGenerateForm.setValue({
        modeofAbhaHealthID: 'AADHAR',
        aadharNumber: '1234',
      });
      component.generateABHACard();

      expect(dialogRef.close).toHaveBeenCalled();
      expect(registrar.passIDsToFetchOtp).toHaveBeenCalledWith({
        aadharNumber: '1234',
        modeofAbhaHealthID: 'AADHAR',
      });
      expect(dialog.open).toHaveBeenCalledWith(
        HealthIdOtpGenerationComponent,
        jasmine.objectContaining({
          data: { aadharNumber: '1234', healthIdMode: 'AADHAR' },
        }),
      );
    });

    it('only closes the dialog for other modes', () => {
      component.abhaGenerateForm.setValue({
        modeofAbhaHealthID: 'BIOMETRIC',
        aadharNumber: '1234',
      });
      component.generateABHACard();
      expect(dialogRef.close).toHaveBeenCalled();
      expect(registrar.passIDsToFetchOtp).not.toHaveBeenCalled();
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  describe('getOTP', () => {
    beforeEach(() => {
      component.abhaGenerateForm.addControl(
        'otherDetailsForm',
        new FormGroup({
          healthId: new FormControl(null),
          healthIdNumber: new FormControl(null),
        }),
      );
    });

    it('patches and locks the health ID when the dialog returns a result', () => {
      dialog.open.and.returnValue(
        createDialogRefMock({ healthId: 'abc@abdm', healthIdNumber: '91-1' }),
      );
      component.getOTP();

      const other = component.abhaGenerateForm.get(
        'otherDetailsForm',
      ) as FormGroup;
      expect(other.getRawValue()).toEqual({
        healthId: 'abc@abdm',
        healthIdNumber: '91-1',
      });
      expect(other.controls['healthId'].disabled).toBeTrue();
      expect(component.disableGenerateOTP).toBeTrue();
    });

    it('does nothing when the dialog is dismissed', () => {
      dialog.open.and.returnValue(createDialogRefMock(undefined));
      component.getOTP();
      expect(component.disableGenerateOTP).toBeUndefined();
    });
  });
});

describe('authMethodComponent', () => {
  let component: authMethodComponent;
  let fixture: ComponentFixture<authMethodComponent>;
  let dialogRef: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [authMethodComponent],
      providers: [
        ...commonTestProviders(),
        { provide: RegistrarService, useValue: autoSpy(RegistrarService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(authMethodComponent, '')
      .compileComponents();

    dialogRef = TestBed.inject(MatDialogRef);
    fixture = TestBed.createComponent(authMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the auth method form on init', () => {
    expect(component.abhaAuthMethodForm.value).toEqual({
      modeofAuthMethod: null,
    });
  });

  it('closeDialogAuth closes without a result', () => {
    component.modeofAuthMethod = 'OTP';
    component.closeDialogAuth();
    expect(dialogRef.close).toHaveBeenCalledWith();
    expect(component.modeofAuthMethod).toBeNull();
  });

  it('getAbhaAuthMethod closes with the selected method', () => {
    component.abhaAuthMethodForm.setValue({ modeofAuthMethod: 'OTP' });
    component.getAbhaAuthMethod();
    expect(component.modeofAuthMethod).toBe('OTP');
    expect(dialogRef.close).toHaveBeenCalledWith('OTP');
  });
});
