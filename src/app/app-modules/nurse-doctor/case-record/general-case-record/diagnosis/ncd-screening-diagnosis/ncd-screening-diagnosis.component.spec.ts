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
import { FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import { NcdScreeningDiagnosisComponent } from './ncd-screening-diagnosis.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';
import { DoctorService } from 'src/app/app-modules/nurse-doctor/shared/services/doctor.service';
import { IdrsscoreService } from 'src/app/app-modules/nurse-doctor/shared/services/idrsscore.service';
import { NurseService } from 'src/app/app-modules/nurse-doctor/shared/services/nurse.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('NcdScreeningDiagnosisComponent', () => {
  let component: NcdScreeningDiagnosisComponent;
  let fixture: ComponentFixture<NcdScreeningDiagnosisComponent>;
  let doctorService: any;
  let masterService: any;
  let idrs: any;
  let ncd: any;
  let confirmation: any;
  let session: any;
  let subj: Record<string, Subject<any>>;

  const list = () =>
    component.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray;
  const ctrl = (n: string) => component.generalDiagnosisForm.controls[n];

  beforeEach(async () => {
    subj = {
      enableDiseaseConfirmForm: new BehaviorSubject<any>(false),
      diabetes: new Subject<any>(),
      hypertension: new Subject<any>(),
      oral: new Subject<any>(),
      breast: new Subject<any>(),
      cervical: new Subject<any>(),
      prevConfirmed: new BehaviorSubject<any>(undefined),
      caseRecord: new BehaviorSubject<any>(null),
      enableConfirm: new BehaviorSubject<any>(false),
      visitDiseases: new BehaviorSubject<any>(null),
      provisional: new BehaviorSubject<any>(false),
    };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NcdScreeningDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            visitCategory: 'NCD screening',
            visitCode: 'VC1',
            beneficiaryGender: 'Female',
          },
        }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            previousVisitConfirmedDiseases$: subj['prevConfirmed'],
            populateCaserecordResponse$: subj['caseRecord'],
          }),
        },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
        {
          provide: IdrsscoreService,
          useValue: autoSpy(IdrsscoreService, {
            enableDiseaseConfirmationOnCaseRecord$: subj['enableConfirm'],
            visitDiseases$: subj['visitDiseases'],
          }),
        },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, {
            enableProvisionalDiag$: subj['provisional'],
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(NcdScreeningDiagnosisComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(NcdScreeningDiagnosisComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService);
    masterService = TestBed.inject(MasterdataService);
    idrs = TestBed.inject(IdrsscoreService);
    ncd = {} as any;
    confirmation = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    component.generalDiagnosisForm =
      component.utils.createNCDScreeningDiagnosisForm();
  });

  afterEach(() => fixture.destroy());

  describe('ngOnInit', () => {

    it('initialises for a TC specialist', () => {
      session.setItem('designation', 'TC Specialist');
      fixture.detectChanges();
      expect(component.specialist).toBeTrue();
      expect(ctrl('instruction').enabled).toBeTrue();
    });

    it('tracks the provisional diagnosis flag', () => {
      fixture.detectChanges();
      subj['provisional'].next(true);
      expect(component.enableProvisionalDiag).toBeTrue();
      subj['provisional'].next('x');
      expect(component.enableProvisionalDiag).toBeFalse();
    });


    it('runs updateIfDiseaseConfirmed when confirmation enabled', () => {
      fixture.detectChanges();
      spyOn(component, 'updateIfDiseaseConfirmed');
      subj['enableConfirm'].next(true);
      expect(component.updateIfDiseaseConfirmed).toHaveBeenCalled();
    });
  });


  it('refreshes language on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('exposes getters', () => {
    expect(component.provisionalDiagnosisControls.length).toBe(1);
    expect(component.specialistDaignosis).toBe(ctrl('instruction'));
    expect(component.doctorDaignosis).toBeNull();
    component.generalDiagnosisForm.removeControl('provisionalDiagnosisList');
    expect(component.provisionalDiagnosisControls).toEqual([]);
  });


  describe('ngOnChanges', () => {
    const res = (diagnosis: any) => ({
      statusCode: 200,
      data: { diagnosis },
    });

    it('does nothing outside view mode', () => {
      component.caseRecordMode = 'edit';
      component.ngOnChanges();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).not.toHaveBeenCalled();
      expect(component.diagnosisSubscription).toBeUndefined();
    });



    it('does not patch empty first diagnosis', () => {
      component.patchDiagnosisDetails([{ term: '', conceptID: '' }]);
      expect(list().length).toBe(1);
    });



  });

  describe('addDiagnosis / removeDiagnosisFromList', () => {
    beforeEach(() => fixture.detectChanges());

    it('adds up to 30 and then alerts', () => {
      for (let i = 0; i < 29; i++) component.addDiagnosis();
      expect(list().length).toBe(30);
      component.addDiagnosis();
      expect(list().length).toBe(30);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.maxDiagnosis,
      );
    });

    it('confirms removal of a valid entry (multi)', () => {
      component.addDiagnosis();
      list().at(0).patchValue({ term: 'A', conceptID: '1' });
      component.removeDiagnosisFromList(0, list().at(0));
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(list().length).toBe(1);
    });

    it('replaces the last valid entry when confirmed', () => {
      list().at(0).patchValue({ term: 'A', conceptID: '1' });
      component.removeDiagnosisFromList(0, list().at(0));
      expect(list().length).toBe(1);
      expect(list().at(0).value.term).toBeNull();
    });

    it('keeps the entry when confirmation is declined', () => {
      confirmation.confirm.and.returnValue(of(false));
      list().at(0).patchValue({ term: 'A', conceptID: '1' });
      component.removeDiagnosisFromList(0, list().at(0));
      expect(list().at(0).value.term).toBe('A');
    });

    it('removes invalid entries without confirmation', () => {
      component.addDiagnosis();
      component.removeDiagnosisFromList(1, list().at(1));
      expect(list().length).toBe(1);
      component.removeDiagnosisFromList(0, list().at(0));
      expect(list().length).toBe(1);
      expect(confirmation.confirm).not.toHaveBeenCalled();
    });
  });

  it('checks provisional diagnosis validity', () => {
    expect(
      component.checkProvisionalDiagnosisValidity({
        value: { term: 'a', conceptID: '1' },
      }),
    ).toBeFalse();
    expect(
      component.checkProvisionalDiagnosisValidity({ value: { term: 'a' } }),
    ).toBeTrue();
  });

  describe('updateIfDiseaseConfirmed', () => {
    it('confirms diabetes and hypertension', () => {
      const log = spyOn(console, 'log');
      subj['visitDiseases'].next(['Diabetes', 'Hypertension', 'Other']);
      component.updateIfDiseaseConfirmed();
      expect(component.diabetesChecked).toBeTrue();
      expect(component.hyperTensionChecked).toBeTrue();
      expect(ctrl('diabetesConfirmed').disabled).toBeTrue();
      expect(ctrl('hypertensionConfirmed').disabled).toBeTrue();
      expect(
        component.generalDiagnosisForm.getRawValue().diabetesConfirmed,
      ).toBeTrue();
      expect(log).toHaveBeenCalledWith('confirm diseases');
    });

  });


  it('forwards diabetes / hypertension confirmation', () => {
    component.addToConfirmDisease(true);
    component.addHyperTensionToConfirmDisease(true);
    expect(idrs.finalDiagnosisDiabetesConfirm).toHaveBeenCalledWith(true);
    expect(idrs.finalDiagnosisHypertensionConfirm).toHaveBeenCalledWith(true);
  });




  it('displays and selects diagnoses', () => {
    expect(component.displayDiagnosis('x')).toBe('x');
    expect(component.displayDiagnosis({ term: 'T' })).toBe('T');
    expect(component.displayDiagnosis(null)).toBe('');
    component.onDiagnosisSelected({ term: 'T', conceptID: 'C' }, 0);
    expect(list().at(0).value).toEqual(
      jasmine.objectContaining({ term: 'T', conceptID: 'C' }),
    );
    component.onDiagnosisSelected(null, 0);
    expect(list().at(0).value.term).toBeNull();
  });
});
