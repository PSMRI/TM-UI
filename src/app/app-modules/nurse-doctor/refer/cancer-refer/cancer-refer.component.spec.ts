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
import { BehaviorSubject, of } from 'rxjs';

import { CancerReferComponent } from './cancer-refer.component';
import { DoctorService } from '../../shared/services/doctor.service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('CancerReferComponent', () => {
  let component: CancerReferComponent;
  let fixture: ComponentFixture<CancerReferComponent>;
  let doctorService: any;
  let masterData$: BehaviorSubject<any>;
  let storage: any;

  const MASTER = {
    higherHealthCare: [
      { institutionID: 1, institutionName: 'District Hospital' },
      { institutionID: 2, institutionName: 'Medical College' },
    ],
    additionalServices: [
      { serviceName: 'Oncology' },
      { serviceName: 'Radiology' },
    ],
    revisitDate: ['1 week'],
    referralReason: ['Suspected'],
  };

  beforeEach(async () => {
    doctorService = autoSpy(DoctorService);
    masterData$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerReferComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 22,
            visitID: 11,
            visitCategory: 'Cancer Screening',
          },
        }),
        { provide: DoctorService, useValue: doctorService },
        {
          provide: MasterdataService,
          useValue: { doctorMasterData$: masterData$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CancerReferComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    storage = TestBed.inject(SessionStorageService);
    fixture = TestBed.createComponent(CancerReferComponent);
    component = fixture.componentInstance;
    component.referForm = new FormGroup({
      referredToInstituteID: new FormControl(null),
      refrredToAdditionalServiceList: new FormControl(null),
      revisitDate: new FormControl(null),
      referralReason: new FormControl(null),
    });
  });

  describe('ngOnInit', () => {
    beforeEach(() => fixture.detectChanges());

    it('sets the language and the scheduler date limits', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(component.tomorrow.toDateString()).toBe(tomorrow.toDateString());
      expect(component.maxSchedulerDate.getTime()).toBeGreaterThan(
        component.tomorrow.getTime(),
      );
    });

    it('stores master data once it arrives', () => {
      expect(component.higherHealthcareCenter).toBeUndefined();
      masterData$.next(MASTER);
      expect(component.higherHealthcareCenter).toBe(MASTER.higherHealthCare);
      expect(component.additionalServices).toBe(MASTER.additionalServices);
      expect(component.revisitDate).toBe(MASTER.revisitDate);
      expect(component.referralReason).toBe(MASTER.referralReason);
      expect(doctorService.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('refreshes language on ngDoCheck', () => {
      component.currentLanguageSet = undefined;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('view mode', () => {
    beforeEach(() => {
      component.referMode = 'view';
      fixture.detectChanges();
    });

    it('fetches refer details when the doctor flag is 9', () => {
      storage.setItem('doctorFlag', '9');
      masterData$.next(MASTER);
      expect(doctorService.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        22,
        11,
        'Cancer Screening',
      );
    });

    it('does not fetch for other doctor flags', () => {
      storage.setItem('doctorFlag', '1');
      masterData$.next(MASTER);
      expect(doctorService.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });
  });

  describe('getReferDetails', () => {
    it('patches diagnosis details from a successful response', () => {
      spyOn(component, 'patchReferDetails');
      doctorService.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: { diagnosis: { a: 1 } } }),
      );
      component.getReferDetails(22, 11, 'X');
      expect(component.patchReferDetails).toHaveBeenCalledWith({ a: 1 });
    });

    it('ignores responses without a diagnosis', () => {
      spyOn(component, 'patchReferDetails');
      doctorService.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.getReferDetails(22, 11, 'X');
      expect(component.patchReferDetails).not.toHaveBeenCalled();
    });
  });

  describe('patchReferDetails', () => {
    beforeEach(() => {
      fixture.detectChanges();
      masterData$.next(MASTER);
    });

    it('keeps known services, resolves the institute and formats the date', () => {
      component.patchReferDetails({
        revisitDate: '2026-12-01T10:00:00',
        referralReason: 'Suspected',
        refrredToAdditionalServiceList: ['Oncology', 'Unknown'],
        referredToInstituteID: 2,
      });

      expect(component.previousServiceList).toEqual(['Oncology', 'Unknown']);
      expect(component.referForm.value).toEqual({
        referredToInstituteID: 2,
        refrredToAdditionalServiceList: ['Oncology'],
        revisitDate: '2026-12-01',
        referralReason: 'Suspected',
      });
    });

    it('handles details without services or a known institute', () => {
      component.patchReferDetails({
        revisitDate: null,
        referralReason: null,
        referredToInstituteID: 99,
      });
      expect(component.referForm.value).toEqual({
        referredToInstituteID: 99,
        refrredToAdditionalServiceList: [],
        revisitDate: null,
        referralReason: null,
      });
    });
  });

  it('exposes revisit date and referral reason controls', () => {
    expect(component.RevisitDate).toBe(component.referForm.get('revisitDate'));
    expect(component.ReferralReason).toBe(
      component.referForm.get('referralReason'),
    );
  });

  it('checkdate stores the date as local-time ISO string', () => {
    const date = new Date(2026, 11, 1, 0, 0, 0);
    component.checkdate(date);
    expect(component.referForm.value.revisitDate).toBe(
      '2026-12-01T00:00:00.000Z',
    );
    expect(component.tomorrow).toBeDefined();
  });

  describe('canDisable', () => {
    it('disables services referred previously', () => {
      component.previousServiceList = ['Oncology'];
      const oncology: any = { serviceName: 'Oncology' };
      const radiology: any = { serviceName: 'Radiology' };
      expect(component.canDisable(oncology)).toBeTrue();
      expect(oncology.disabled).toBeTrue();
      expect(component.canDisable(radiology)).toBeFalse();
      expect(radiology.disabled).toBeFalse();
    });

    it('returns false without a previous list', () => {
      component.previousServiceList = null;
      expect(component.canDisable({ serviceName: 'Oncology' })).toBeFalse();
    });
  });

  it('tracks the selected values', () => {
    component.additionalservices(['a', 'b']);
    expect(component.selectValue).toBe(2);
    component.additionalservices(null);
    expect(component.selectValue).toBe(2);
    component.higherhealthcarecenter('X');
    expect(component.selectValue).toBe('X');
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    component.getReferDetails(1, 2, 'X');
    const subs = [
      component.doctorMasterDataSubscription,
      component.referSubscription,
    ];
    component.ngOnDestroy();
    subs.forEach((s) => expect(s.closed).toBeTrue());
  });
});
