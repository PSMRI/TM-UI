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
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { BiometricAuthenticationComponent } from './biometric-authentication.component';
import { RegistrarService } from '../shared/services/registrar.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('BiometricAuthenticationComponent', () => {
  let component: BiometricAuthenticationComponent;
  let fixture: ComponentFixture<BiometricAuthenticationComponent>;
  let registrar: any;
  let confirmation: any;
  let dialogRef: any;

  beforeEach(async () => {
    registrar = autoSpy(RegistrarService);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [BiometricAuthenticationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: RegistrarService, useValue: registrar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(BiometricAuthenticationComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    confirmation = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    fixture = TestBed.createComponent(BiometricAuthenticationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with the image hidden', () => {
    expect(component.enableImage).toBeFalse();
  });

  describe('connectDevice', () => {
    it('requests PID data and reports a successful capture', () => {
      registrar.getBiometricData.and.returnValue(of({ statusCode: 200 }));
      component.connectDevice();
      expect(registrar.getBiometricData).toHaveBeenCalledWith('P');
      expect(component.enableImage).toBeTrue();
      expect(component.messageInfo).toBe('Fingerprint captured successfully');
    });

    it('reports a failed capture', () => {
      registrar.getBiometricData.and.returnValue(of({ statusCode: 5000 }));
      component.connectDevice();
      expect(component.messageInfo).toBe('Issue in capturing fingerprint');
    });

    it('hides the image and alerts on timeout', () => {
      registrar.getBiometricData.and.returnValue(
        throwingObs({ error: 'timeout' }),
      );
      component.connectDevice();
      expect(component.enableImage).toBeFalse();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Capture timed out',
        'timeout',
      );
    });
  });

  it('closeDialog closes and hides the image', () => {
    component.enableImage = true;
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(component.enableImage).toBeFalse();
  });
});
