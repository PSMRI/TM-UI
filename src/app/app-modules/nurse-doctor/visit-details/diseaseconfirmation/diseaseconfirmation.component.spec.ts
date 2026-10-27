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
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { DiseaseconfirmationComponent } from './diseaseconfirmation.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const CBAC_CONDITIONS = [
  { name: 'Diabetes Mellitus' },
  { name: 'Hypertension' },
  { name: 'Oral cancer' },
  { name: 'Breast cancer' },
  { name: 'Cervical cancer' },
  { name: 'Other' },
];

const IDRS_QUESTIONS = [
  { DiseaseQuestionType: 'Diabetes' },
  { DiseaseQuestionType: 'Diabetes' },
  { DiseaseQuestionType: 'Epilepsy' },
  { DiseaseQuestionType: 'Hypertension' },
  { DiseaseQuestionType: 'Asthma' },
  { DiseaseQuestionType: 'Other' },
];

describe('DiseaseconfirmationComponent', () => {
  let component: DiseaseconfirmationComponent;
  let fixture: ComponentFixture<DiseaseconfirmationComponent>;
  let masterData$: BehaviorSubject<any>;
  let benDetails$: BehaviorSubject<any>;
  let enableForm$: BehaviorSubject<any>;
  let nurse: any;
  let doctor: any;
  let idrs: any;
  let ncd: any;
  let routeParams: any;
  const fb = new FormBuilder();

  async function setup(session: Record<string, any> = {}) {
    masterData$ = new BehaviorSubject<any>(null);
    benDetails$ = new BehaviorSubject<any>({ genderName: 'Female' });
    enableForm$ = new BehaviorSubject<any>(false);
    routeParams = { attendant: 'nurse' };
    nurse = autoSpy(NurseService, { diseaseFileUpload: false });
    doctor = autoSpy(DoctorService);
    idrs = autoSpy(IdrsscoreService);
    ncd = Object.assign({}, {
      enableDiseaseConfirmForm$: enableForm$,
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DiseaseconfirmationComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: 'BEN1', visitCode: 'VC1', ...session },
        }),
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: doctor },
        { provide: IdrsscoreService, useValue: idrs },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: masterData$ },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$ },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: routeParams } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(DiseaseconfirmationComponent);
    component = fixture.componentInstance;
    component.diseaseFormsGroup = fb.group({
      diseaseFormsArray: fb.array([]),
    });
  }

  function formArray(): FormArray {
    return component.diseaseFormsGroup.get('diseaseFormsArray') as FormArray;
  }

  function rows(): any[] {
    return formArray().getRawValue();
  }

  function selectedDisabled(i: number): boolean {
    return (formArray().at(i) as FormGroup).controls['selected'].disabled;
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('ngOnInit', () => {
    beforeEach(async () => {
      await setup();
    });





    ['doctor', 'tcspecialist'].forEach((role) => {
      it(`marks ${role} as doctor`, () => {
        routeParams.attendant = role;
        component.ngOnInit();
        expect(component.isDoctor).toBeTrue();
      });
    });





  });





  describe('getIDRSDetailsFrmNurse', () => {
    beforeEach(async () => {
      await setup();
      spyOn(console, 'log');
    });

    it('marks IDRS confirmed diseases as current when there were no previous suspects', () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { IDRSDetail: { confirmedDisease: 'Diabetes,Asthma' } },
        }),
      );
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(nurse.getPreviousVisitData).toHaveBeenCalledWith({
        benRegID: 'BEN1',
      });
      expect(doctor.getIDRSDetails).toHaveBeenCalledWith('BEN1', 'V1');
      expect(rows().map((r) => r.diseaseName)).toEqual([
        'Diabetes',
        'Epilepsy',
        'Hypertension',
        'Asthma',
        'Other',
      ]);
      expect(rows()[0].selected).toBeTrue();
      expect(rows()[3].selected).toBeTrue();
      expect(selectedDisabled(0)).toBeFalse();
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([
        'Diabetes',
        'Asthma',
      ]);
    });

    it('merges IDRS diseases with previous suspects and disables old ones', () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({
          statusCode: 200,
          data: {
            confirmedDisease: 'Hypertension',
            isDiabetic: true,
            isDefectiveVision: true,
            isEpilepsy: false,
            isHypertension: true,
          },
        }),
      );
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { IDRSDetail: { confirmedDisease: 'Hypertension,Epilepsy' } },
        }),
      );
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(component.suspect).toEqual([
        'Hypertension',
        'Diabetes',
        'Vision Screening',
        'Epilepsy',
      ]);
      expect(idrs.setHypertensionSelected).toHaveBeenCalled();
      // Diabetes and Hypertension are previous (disabled); Epilepsy is current
      expect(selectedDisabled(0)).toBeTrue();
      expect(selectedDisabled(1)).toBeFalse();
      expect(selectedDisabled(2)).toBeTrue();
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([
        'Diabetes',
        'Epilepsy',
        'Hypertension',
      ]);
    });


    it('skips form rebuild when IDRS details are unavailable', () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      doctor.getIDRSDetails.and.returnValue(of(null));
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(formArray().length).toBe(0);
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([]);
    });

    it('stops when previous visit data fails', () => {
      nurse.getPreviousVisitData.and.returnValue(of({ statusCode: 500 }));
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(doctor.getIDRSDetails).not.toHaveBeenCalled();
      masterData$.next(null);
      expect(nurse.getPreviousVisitData).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes from master data on subsequent emissions', () => {
      nurse.getPreviousVisitData.and.returnValue(of({ statusCode: 500 }));
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: [] });
      masterData$.next({ IDRSQuestions: [] });
      expect(masterData$.observed).toBeFalse();
    });
  });

  describe('getPatientRevisitSuspectedDieseaData', () => {
    beforeEach(async () => {
      await setup();
      spyOn(console, 'log');
      component.diseaseFormsArray = formArray();
    });


    it('selects nothing when previous data is unavailable', () => {
      nurse.getPreviousVisitData.and.returnValue(of({ statusCode: 500 }));
      component.getPatientRevisitSuspectedDieseaData();
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(formArray().length).toBe(0);
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([]);
    });

    it('ignores empty master data', () => {
      component.getPatientRevisitSuspectedDieseaData();
      masterData$.next({ IDRSQuestions: [] });
      masterData$.next(null);
      expect(nurse.getPreviousVisitData).not.toHaveBeenCalled();
    });
  });

  describe('getDiseasesMasterData', () => {
    beforeEach(async () => {
      await setup();
      spyOn(console, 'log');
    });

    it('adds one row per distinct question type', () => {
      component.getDiseasesMasterData();
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(rows().map((r) => r.diseaseName)).toEqual([
        'Diabetes',
        'Epilepsy',
        'Hypertension',
        'Asthma',
        'Other',
      ]);
      expect(rows().every((r) => r.selected === false)).toBeTrue();
    });

    it('ignores empty data', () => {
      component.getDiseasesMasterData();
      masterData$.next({ IDRSQuestions: [] });
      masterData$.next(null);
      expect(formArray().length).toBe(0);
    });
  });

  describe('helpers', () => {
    beforeEach(async () => {
      await setup();
      spyOn(console, 'log');
    });

    it('addToSuspected ignores duplicates', () => {
      component.suspect = ['A'];
      component.addToSuspected('A');
      component.addToSuspected('B');
      expect(component.suspect).toEqual(['A', 'B']);
    });

    it('addMoreDiseases / getDiseaseFormArray expose the rows', () => {
      component.addMoreDiseases({ disease: 'X', flag: null, selected: true });
      component.addMoreDiseases(null);
      expect(component.getDiseaseFormArray().length).toBe(2);
      expect(rows()[0]).toEqual({
        diseaseName: 'X',
        flag: null,
        selected: true,
      });
    });

    function seed() {
      ['Hypertension', 'Diabetes'].forEach((d) =>
        formArray().push(
          fb.group({ diseaseName: d, flag: null, selected: true }),
        ),
      );
    }

    it('checked(false) on Hypertension clears and unchecks', () => {
      seed();
      component.checked(
        { checked: false },
        { value: { diseaseName: 'Hypertension' } },
      );
      expect(idrs.clearHypertensionSelected).toHaveBeenCalled();
      expect(idrs.setUnchecked).toHaveBeenCalledWith('Hypertension');
    });

    it('checked(false) on Diabetes only unchecks', () => {
      seed();
      component.checked(
        { checked: false },
        { value: { diseaseName: 'Diabetes' } },
      );
      expect(idrs.clearHypertensionSelected).not.toHaveBeenCalled();
      expect(idrs.setUnchecked).toHaveBeenCalledWith('Diabetes');
    });

    it('checked(true) sets selected diseases', () => {
      seed();
      component.checked(
        { checked: true },
        { value: { diseaseName: 'Hypertension' } },
      );
      expect(idrs.setHypertensionSelected).toHaveBeenCalled();
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([
        'Hypertension',
        'Diabetes',
      ]);
      idrs.setHypertensionSelected.calls.reset();
      component.checked(
        { checked: true },
        { value: { diseaseName: 'Diabetes' } },
      );
      expect(idrs.setHypertensionSelected).not.toHaveBeenCalled();
    });


    it('addToChronicDiseases selects and disables chronic rows', () => {
      [
        'Vision Screening',
        'Diabetes',
        'Epilepsy',
        'Hypertension',
        'Other',
      ].forEach((d) =>
        formArray().push(
          fb.group({ diseaseName: d, flag: null, selected: false }),
        ),
      );
      component.addToChronicDiseases({
        data: {
          isDefectiveVision: true,
          isDiabetic: true,
          isEpilepsy: true,
          isHypertension: true,
        },
      });
      [0, 1, 2, 3].forEach((i) => {
        expect(selectedDisabled(i)).toBeTrue();
        expect(formArray().at(i).getRawValue().selected).toBeTrue();
      });
      expect(selectedDisabled(4)).toBeFalse();
    });

  });
});
