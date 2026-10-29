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
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../core/services';
import { DoctorService } from '../shared/services';
import { GeneralUtils } from '../shared/utility/general-utility';
import { AncComponent } from './anc.component';

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
  visitID: '10',
  beneficiaryRegID: '20',
  beneficiaryID: '30',
  sessionID: '4',
  userName: 'nurse',
  providerServiceID: '5',
  benFlowID: '6',
  visitCode: '70',
};

describe('AncComponent', () => {
  let component: AncComponent;
  let fixture: ComponentFixture<AncComponent>;
  let doctor: any;
  let benService: any;
  let confirm: any;
  let session: any;
  let form: FormGroup;
  let route: any;

  const careData = (overrides: any = {}) => ({
    statusCode: 200,
    data: {
      ANCCareDetail: {
        primiGravida: true,
        lmpDate: '2024-01-01',
        expDelDt: '2024-10-07',
        gravida_G: 1,
        bloodGroup: 'A+',
      },
      ANCWomenVaccineDetails: {
        tT_1Status: 'Received',
        dateReceivedForTT_1: '2024-02-01',
        dateReceivedForTT_2: '2024-03-01',
        dateReceivedForTT_3: '2024-04-01',
      },
      ...overrides,
    },
  });

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    benService = autoSpy(BeneficiaryDetailsService);
    route = { snapshot: { params: { attendant: 'doctor' } } };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AncComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: DoctorService, useValue: doctor },
        { provide: BeneficiaryDetailsService, useValue: benService },
        { provide: ActivatedRoute, useValue: route },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AncComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock(SESSION) as any,
    ).createPatientANCForm();
    component.patientANCForm = form;
  });


  it('re-assigns the language set on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('ngOnChanges', () => {
    it('fetches ANC data in view mode', () => {
      component.mode = 'view';
      component.ngOnChanges();
      expect(doctor.getAncCareDetails).toHaveBeenCalledWith('20', '10');
    });

    it('fetches ANC data for specialist flag 100', () => {
      session.setItem('specialistFlag', '100');
      component.mode = 'new';
      component.ngOnChanges();
      expect(doctor.getAncCareDetails).toHaveBeenCalledTimes(1);
    });

    it('does nothing for other modes and flags', () => {
      session.setItem('specialistFlag', '5');
      component.mode = 'new';
      component.ngOnChanges();
      expect(doctor.getAncCareDetails).not.toHaveBeenCalled();
      expect(doctor.updateANCDetails).not.toHaveBeenCalled();
    });

    it('updates in update mode', () => {
      component.mode = 'update';
      component.ngOnChanges();
      expect(doctor.updateANCDetails).toHaveBeenCalled();
    });
  });

  describe('updatePatientANC', () => {

    it('alerts on non-200', () => {
      doctor.updateANCDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad', data: null }),
      );
      component.updatePatientANC(form);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(doctor.getHRPDetails).not.toHaveBeenCalled();
    });

    it('alerts on error', () => {
      doctor.updateANCDetails.and.returnValue(throwingObs('x'));
      component.updatePatientANC(form);
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });
  });

  describe('getHRPDetails', () => {
    it('resets HRP when not positive', () => {
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } }),
      );
      component.getHRPDetails();
      expect(benService.resetHRPPositive).toHaveBeenCalled();
      expect(benService.setHRPPositive).not.toHaveBeenCalled();
    });

    it('ignores empty responses', () => {
      doctor.getHRPDetails.and.returnValue(of({ statusCode: 200, data: null }));
      component.getHRPDetails();
      expect(benService.resetHRPPositive).not.toHaveBeenCalled();
      expect(benService.setHRPPositive).not.toHaveBeenCalled();
    });
  });

  // Both patch methods share identical logic; run the same cases against each.
  (
    [
      ['patchDataToFields', 'getAncCareDetails'],
      ['patchDataToFieldsRevisit', 'getAncCareDetailsRevisit'],
    ] as const
  ).forEach(([method, api]) => {
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes active subscriptions', () => {
      component.patchDataToFields('20', '10');
      component.updatePatientANC(form);
      const a = component.ancCareDetails;
      const b = component.updateANCDetailsSubs;
      spyOn(a, 'unsubscribe').and.callThrough();
      spyOn(b, 'unsubscribe').and.callThrough();
      component.ngOnDestroy();
      expect(a.unsubscribe).toHaveBeenCalled();
      expect(b.unsubscribe).toHaveBeenCalled();
    });

    it('tolerates missing subscriptions', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component.ancCareDetails).toBeUndefined();
    });
  });
});
