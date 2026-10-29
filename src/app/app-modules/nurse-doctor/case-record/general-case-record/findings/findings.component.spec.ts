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
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
  throwingObs,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { FindingsComponent } from './findings.component';

const SERVICE_LINE = JSON.stringify({ facilityID: 1, parkingPlaceID: 2 });

describe('FindingsComponent', () => {
  let component: FindingsComponent;
  let fixture: ComponentFixture<FindingsComponent>;
  let nurseMaster$: BehaviorSubject<any>;
  let caseRecord$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;
  let doctor: any;
  let nurse: any;
  let master: any;
  let confirm: any;
  let tracking: any;
  let session: any;
  let utils: GeneralUtils;

  const complaintsMaster = () => [
    { chiefComplaint: 'Abdominal pain', chiefComplaintID: 1 },
    { chiefComplaint: 'Cough', chiefComplaintID: 2 },
    { chiefComplaint: 'Fever', chiefComplaintID: 3 },
  ];

  async function setup(sessionValues: Record<string, any> = {}) {
    nurseMaster$ = new BehaviorSubject<any>(null);
    caseRecord$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>({ age: '30 years' });
    doctor = autoSpy(DoctorService, {
      populateCaserecordResponse$: caseRecord$.asObservable(),
    });
    nurse = autoSpy(NurseService);
    master = autoSpy(MasterdataService, {
      nurseMasterData$: nurseMaster$.asObservable(),
    });
    session = createSessionStorageMock({
      serviceLineDetails: SERVICE_LINE,
      visitCategory: 'General OPD',
      beneficiaryRegID: 'BR',
      visitID: 'V1',
      ...sessionValues,
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FindingsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: SessionStorageService, useValue: session },
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        { provide: MasterdataService, useValue: master },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: beneficiary$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(FindingsComponent, '')
      .compileComponents();
    spyOn(console, 'log');
    spyOn(console, 'error');
    fixture = TestBed.createComponent(FindingsComponent);
    component = fixture.componentInstance;
    utils = new GeneralUtils(TestBed.inject(FormBuilder), session as any);
    component.generalFindingsForm = utils.createGeneralFindingsForm();
    confirm = TestBed.inject(ConfirmationService);
    tracking = TestBed.inject(AmritTrackingService);
  }

  afterEach(() => fixture?.destroy());

  const complaints = () =>
    component.generalFindingsForm.controls['complaints'] as FormArray;
  const observations = () =>
    component.generalFindingsForm.controls[
      'clinicalObservationsList'
    ] as FormArray;
  const findings = () =>
    component.generalFindingsForm.controls[
      'significantFindingsList'
    ] as FormArray;

  describe('init', () => {
    beforeEach(async () => setup());


    it('loads chief complaint master data', () => {
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
      expect(component.chiefComplaintMaster.length).toBe(3);
      expect(component.chiefComplaintTemporarayList[0].length).toBe(3);
      expect(doctor.getMMUCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('ngOnDestroy unsubscribes', () => {
      component.caseRecordMode = 'view';
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
      const subs = [
        component.doctorMasterDataSubscription,
        component.beneficiaryDetailSubscription,
        component.findingSubscription,
      ];
      component.ngOnDestroy();
      subs.forEach((s) => expect(s.closed).toBeTrue());
    });

    it('ngOnDestroy is safe without subscriptions', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });


  });

  describe('view mode', () => {
    const findingsData = () => ({
      complaints: [
        {
          chiefComplaint: 'Cough',
          duration: 2,
          unitOfDuration: 'Days',
        },
      ],
      clinicalObservationsList: [
        { term: 'Pallor', conceptID: 'C1' },
        { term: 'Icterus', conceptID: 'C2' },
      ],
      significantFindingsList: [{ term: 'Rales', conceptID: 'S1' }],
      otherSymptoms: 'none',
    });


    it('ignores case record responses without findings', async () => {
      await setup({ referredVisitCode: null });
      component.caseRecordMode = 'view';
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
      caseRecord$.next({ statusCode: 200, data: {} });
      expect(component.complaintList).toEqual([]);
    });


    it('fetches MMU findings for referred visit otherwise', async () => {
      await setup({ referredVisitCode: 'RVC', referredVisitID: 'RVID' });
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 500 }),
      );
      component.caseRecordMode = 'view';
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'BR',
        'RVID',
        'General OPD',
        'RVC',
      );
      expect(component.complaintList).toEqual([]);
      component.findingSubscription = undefined as any;
    });

  });

  describe('complaint editing', () => {
    beforeEach(async () => {
      await setup();
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
    });

    it('getSCTid loads the concept id into the complaint row', () => {
      master.getSnomedCTRecord.and.returnValue(
        of({ statusCode: 200, data: { conceptID: 'SCT1' } }),
      );
      component.getSCTid({ chiefComplaint: 'Cough' }, 0);
      expect(master.getSnomedCTRecord).toHaveBeenCalledWith('Cough');
      expect(complaints().at(0).value.conceptID).toBe('SCT1');
    });

    it('getSCTid ignores failures', () => {
      master.getSnomedCTRecord.and.returnValue(of({ statusCode: 500 }));
      component.getSCTid({ chiefComplaint: 'Cough' }, 0);
      master.getSnomedCTRecord.and.returnValue(throwingObs());
      component.getSCTid({ chiefComplaint: 'Cough' }, 0);
      expect(complaints().at(0).value.conceptID).toBeNull();
    });



    it('suggestChiefComplaintList filters by string and object and resets when empty', () => {
      const row = complaints().at(0);
      row.patchValue({ chiefComplaint: 'cou' });
      component.suggestChiefComplaintList(row, 0);
      expect(component.suggestedChiefComplaintList[0].length).toBe(1);

      row.patchValue({ chiefComplaint: { chiefComplaint: 'Fever' } });
      component.suggestChiefComplaintList(row, 0);
      expect(component.suggestedChiefComplaintList[0][0].chiefComplaint).toBe(
        'Fever',
      );

      row.patchValue({ chiefComplaint: 'zzz', duration: 3 });
      component.suggestChiefComplaintList(row, 0);
      expect(row.value.chiefComplaint).toBeNull();
      expect(row.value.duration).toBeNull();
    });






    it('validateDuration alerts and clears when duration exceeds age', () => {
      const row = complaints().at(0);
      row.patchValue({ duration: 40, unitOfDuration: 'Years' });
      component.validateDuration(row);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.DurationAge,
      );
      expect(row.value.duration).toBeNull();
      expect(row.value.unitOfDuration).toBeNull();
    });

    it('validateDuration accepts a valid or incomplete duration', () => {
      const row = complaints().at(0);
      row.patchValue({ duration: 2, unitOfDuration: 'Days' });
      component.validateDuration(row);
      row.patchValue({ duration: null, unitOfDuration: null });
      component.validateDuration(row);
      expect(confirm.alert).not.toHaveBeenCalled();
    });


    it('sortChiefComplaintList sorts alphabetically', () => {
      const list = [
        { chiefComplaint: 'b' },
        { chiefComplaint: 'a' },
        { chiefComplaint: 'b' },
      ];
      component.sortChiefComplaintList(list);
      expect(list.map((l) => l.chiefComplaint)).toEqual(['a', 'b', 'b']);
    });
  });

});
