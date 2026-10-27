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

import { GeneralOpdDiagnosisComponent } from './general-opd-diagnosis.component';
import { DoctorService, MasterdataService } from '../../../../shared/services';
import { ConfirmationService } from '../../../../../core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('GeneralOpdDiagnosisComponent', () => {
  let component: GeneralOpdDiagnosisComponent;
  let fixture: ComponentFixture<GeneralOpdDiagnosisComponent>;
  let caseRecord$: BehaviorSubject<any>;
  let doctorService: any;
  let masterService: any;
  let confirmation: any;
  let session: any;

  const list = () =>
    component.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray;

  beforeEach(async () => {
    caseRecord$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralOpdDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            visitCategory: 'General OPD',
            visitCode: 'VC1',
          },
        }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateCaserecordResponse$: caseRecord$.asObservable(),
          }),
        },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(GeneralOpdDiagnosisComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(GeneralOpdDiagnosisComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService) as any;
    masterService = TestBed.inject(MasterdataService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    component.generalDiagnosisForm =
      component.utils.createGeneralDiagnosisForm();
  });

  describe('ngOnInit', () => {
    it('disables instruction for non-specialist', () => {
      fixture.detectChanges();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.specialist).toBeFalse();
      expect(component.specialistDaignosis?.disabled).toBeTrue();
    });

    it('enables instruction for TC Specialist', () => {
      session.setItem('designation', 'TC Specialist');
      fixture.detectChanges();
      expect(component.specialist).toBeTrue();
      expect(component.specialistDaignosis?.enabled).toBeTrue();
    });
  });

  it('refreshes language on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('exposes provisional diagnosis controls', () => {
    expect(component.provisionalDiagnosisControls.length).toBe(1);
    component.generalDiagnosisForm.removeControl('provisionalDiagnosisList');
    expect(component.provisionalDiagnosisControls).toEqual([]);
  });

  describe('ngOnChanges', () => {
    const diagnosis = {
      instruction: 'rest',
      provisionalDiagnosisList: [
        { term: 'Fever', conceptID: 'C1' },
        { term: 'Cold', conceptID: 'C2' },
      ],
    };

    it('does nothing when not in view mode', () => {
      component.caseRecordMode = 'edit';
      component.ngOnChanges();
      expect(component.diagnosisSubscription).toBeUndefined();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).not.toHaveBeenCalled();
    });




    it('fetches MMU details with referred visit otherwise', () => {
      session.setItem('referredVisitCode', 'RVC');
      session.setItem('referredVisitID', 'RV');
      doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: { diagnosis: { instruction: 'y' } } }),
      );
      component.caseRecordMode = 'view';
      component.ngOnChanges();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).toHaveBeenCalledWith('B1', 'RV', 'General OPD', 'RVC');
      expect(component.generalDiagnosisForm.get('instruction')?.value).toBe(
        'y',
      );
      expect(list().length).toBe(1);
    });
  });


  it('patchDiagnosisDetails skips empty first diagnosis', () => {
    component.patchDiagnosisDetails([{ term: '', conceptID: '' }]);
    expect(list().length).toBe(1);
    expect(list().at(0).value.term).toBeNull();
  });

  describe('addDiagnosis', () => {
    it('adds until 30 then alerts', () => {
      fixture.detectChanges();
      for (let i = 0; i < 29; i++) component.addDiagnosis();
      expect(list().length).toBe(30);
      component.addDiagnosis();
      expect(list().length).toBe(30);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.maxDiagnosis,
      );
    });
  });

  describe('removeDiagnosisFromList', () => {
    beforeEach(() => fixture.detectChanges());

    function fillValid(i: number) {
      list()
        .at(i)
        .patchValue({ term: 'T' + i, conceptID: 'C' + i });
    }

    it('removes a valid entry after confirmation when multiple', () => {
      component.addDiagnosis();
      fillValid(0);
      fillValid(1);
      component.removeDiagnosisFromList(0);
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(list().length).toBe(1);
      expect(list().at(0).value.term).toBe('T1');
    });

    it('resets the last valid entry after confirmation', () => {
      fillValid(0);
      component.removeDiagnosisFromList(0);
      expect(list().length).toBe(1);
      expect(list().at(0).value.term).toBeNull();
    });

    it('keeps entry when confirmation declined', () => {
      confirmation.confirm.and.returnValue(of(false));
      fillValid(0);
      component.removeDiagnosisFromList(0);
      expect(list().at(0).value.term).toBe('T0');
    });

    it('removes invalid entry directly when multiple', () => {
      component.addDiagnosis();
      fillValid(0);
      component.removeDiagnosisFromList(1);
      expect(confirmation.confirm).not.toHaveBeenCalled();
      expect(list().length).toBe(1);
      expect(list().at(0).value.term).toBe('T0');
    });

    it('replaces the only invalid entry', () => {
      const first = list().at(0);
      component.removeDiagnosisFromList(0);
      expect(list().length).toBe(1);
      expect(list().at(0)).not.toBe(first);
    });
  });

  it('checkProvisionalDiagnosisValidity', () => {
    expect(
      component.checkProvisionalDiagnosisValidity({
        value: { term: 'a', conceptID: 'b' },
      }),
    ).toBeFalse();
    expect(
      component.checkProvisionalDiagnosisValidity({ value: { term: 'a' } }),
    ).toBeTrue();
  });


  describe('diagnosis autocomplete', () => {
    const res = (items: any[]) => of({ data: { sctMaster: items } });



    it('re-fetches same term without resetting list', () => {
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        res([{ id: 1 }]),
      );
      component.onDiagnosisInputKeyup('fev', 0);
      component.onDiagnosisInputKeyup('fev', 0);
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(
        2,
      );
      expect(component.suggestedDiagnosisList[0]).toEqual([{ id: 1 }]);
    });







  });

  it('displayDiagnosis handles strings, objects and nulls', () => {
    expect(component.displayDiagnosis('abc')).toBe('abc');
    expect(component.displayDiagnosis({ term: 'Fever' })).toBe('Fever');
    expect(component.displayDiagnosis(null)).toBe('');
  });

  it('onDiagnosisSelected patches the row', () => {
    const sel = { term: 'Fever', conceptID: 'C1' };
    component.onDiagnosisSelected(sel, 0);
    expect(list().at(0).value).toEqual({
      viewProvisionalDiagnosisProvided: sel,
      conceptID: 'C1',
      term: 'Fever',
    });
    component.onDiagnosisSelected(null, 0);
    expect(list().at(0).value.term).toBeNull();
  });
});
