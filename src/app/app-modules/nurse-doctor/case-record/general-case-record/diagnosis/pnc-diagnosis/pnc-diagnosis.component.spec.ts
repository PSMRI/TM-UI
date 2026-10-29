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

import { PncDiagnosisComponent } from './pnc-diagnosis.component';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
} from 'src/app/app-modules/nurse-doctor/shared/services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('PncDiagnosisComponent', () => {
  let component: PncDiagnosisComponent;
  let fixture: ComponentFixture<PncDiagnosisComponent>;
  let doctorService: any;
  let masterService: any;
  let confirmation: any;
  let session: any;
  let benDetails$: BehaviorSubject<any>;
  let caseRecord$: BehaviorSubject<any>;

  const prov = () =>
    component.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray;
  const conf = () =>
    component.generalDiagnosisForm.get(
      'confirmatoryDiagnosisList',
    ) as FormArray;
  const res = (diagnosis: any) => ({ statusCode: 200, data: { diagnosis } });

  beforeEach(async () => {
    benDetails$ = new BehaviorSubject<any>(null);
    caseRecord$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PncDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            visitCategory: 'PNC',
            visitCode: 'VC1',
          },
        }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateCaserecordResponse$: caseRecord$,
          }),
        },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PncDiagnosisComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PncDiagnosisComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService);
    masterService = TestBed.inject(MasterdataService);
    confirmation = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    component.generalDiagnosisForm = component.utils.createPNCDiagnosisForm();
  });

  afterEach(() => fixture.destroy());

  describe('ngOnInit', () => {
    it('initialises dates, language and disables specialist diagnosis', () => {
      fixture.detectChanges();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.specialist).toBeFalse();
      expect(
        component.generalDiagnosisForm.controls['specialistDiagnosis'].disabled,
      ).toBeTrue();
      const diff =
        component.today.getTime() - component.minimumDeathDate.getTime();
      expect(diff).toBe(365 * 24 * 60 * 60 * 1000);
    });

    it('enables specialist diagnosis for TC Specialist', () => {
      session.setItem('designation', 'TC Specialist');
      fixture.detectChanges();
      expect(component.specialist).toBeTrue();
      expect(
        component.generalDiagnosisForm.controls['specialistDiagnosis'].enabled,
      ).toBeTrue();
    });

    it('sets dob year from beneficiary age', () => {
      fixture.detectChanges();
      benDetails$.next({ ageVal: 25 });
      expect(component.beneficiaryAge).toBe(25);
      expect(component.dob.getFullYear()).toBe(
        component.today.getFullYear() - 25,
      );
    });
  });

  it('refreshes language on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('exposes list getters', () => {
    expect(component.provisionalDiagnosisControls.length).toBe(1);
    expect(component.getConfirmatoryDiagnosisList()?.length).toBe(1);
    component.generalDiagnosisForm.removeControl('provisionalDiagnosisList');
    component.generalDiagnosisForm.removeControl('confirmatoryDiagnosisList');
    expect(component.provisionalDiagnosisControls).toEqual([]);
    expect(component.getConfirmatoryDiagnosisList()).toBeNull();
  });

  it('reads isMaternalDeath and clears death details', () => {
    component.generalDiagnosisForm.patchValue({
      isMaternalDeath: true,
      placeOfDeath: 'Home',
      causeOfDeath: 'X',
      dateOfDeath: new Date(),
    });
    expect(component.isMaternalDeath).toBeTrue();
    component.checkWithDeathDetails();
    const v = component.generalDiagnosisForm.value;
    expect(v.placeOfDeath).toBeNull();
    expect(v.dateOfDeath).toBeNull();
    expect(v.causeOfDeath).toBeNull();
  });

  describe('ngOnChanges', () => {
    it('does nothing outside view mode', () => {
      component.caseRecordMode = 'edit';
      component.ngOnChanges();
      expect(component.diagnosisSubscription).toBeUndefined();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).not.toHaveBeenCalled();
    });



    it('uses visitCode for MMU details when specialist flag is 3', () => {
      component.caseRecordMode = 'view';
      session.setItem('referredVisitCode', 'RVC');
      session.setItem('referredVisitID', 'RV');
      session.setItem('specialist_flag', '3');
      doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(
        of(
          res({
            placeOfDeath: 'MMU',
            provisionalDiagnosisList: [{ term: 'P', conceptID: 'c' }],
          }),
        ),
      );
      component.ngOnChanges();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).toHaveBeenCalledWith('B1', 'V1', 'PNC', 'VC1');
      expect(component.generalDiagnosisForm.value.placeOfDeath).toBe('MMU');
      expect(prov().at(0).value.term).toBe('P');
    });

    it('uses referred visit for MMU details otherwise', () => {
      component.caseRecordMode = 'view';
      session.setItem('referredVisitCode', 'RVC');
      session.setItem('referredVisitID', 'RV');
      doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(
        of(res({ placeOfDeath: 'Ref' })),
      );
      component.ngOnChanges();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).toHaveBeenCalledWith('B1', 'RV', 'PNC', 'RVC');
      expect(component.generalDiagnosisForm.value.placeOfDeath).toBe('Ref');
    });

  });

  describe('provisional diagnosis list', () => {
    beforeEach(() => fixture.detectChanges());

    it('adds up to 30 and then alerts', () => {
      for (let i = 0; i < 29; i++) component.addProvisionalDiagnosis();
      expect(prov().length).toBe(30);
      component.addProvisionalDiagnosis();
      expect(prov().length).toBe(30);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.maxDiagnosis,
      );
    });

    it('confirms before removing a valid entry', () => {
      component.addProvisionalDiagnosis();
      prov().at(0).patchValue({ term: 'A', conceptID: '1' });
      component.removeProvisionalDiagnosis(0, prov().at(0));
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(prov().length).toBe(1);
      expect(component.generalDiagnosisForm.dirty).toBeTrue();
    });

    it('resets the only valid entry when confirmed', () => {
      const fg = prov().at(0) as FormGroup;
      fg.patchValue({ term: 'A', conceptID: '1' });
      fg.controls['viewProvisionalDiagnosisProvided'].disable();
      component.removeProvisionalDiagnosis(0, fg);
      expect(fg.value.term).toBeNull();
      expect(
        fg.controls['viewProvisionalDiagnosisProvided'].enabled,
      ).toBeTrue();
    });

    it('does nothing when confirmation declined', () => {
      confirmation.confirm.and.returnValue(of(false));
      prov().at(0).patchValue({ term: 'A', conceptID: '1' });
      component.removeProvisionalDiagnosis(0, prov().at(0));
      expect(prov().at(0).value.term).toBe('A');
      expect(component.generalDiagnosisForm.dirty).toBeFalse();
    });

    it('removes invalid entries without confirmation', () => {
      component.addProvisionalDiagnosis();
      component.removeProvisionalDiagnosis(1, prov().at(1));
      expect(prov().length).toBe(1);
      prov().at(0).patchValue({ term: 'A' });
      component.removeProvisionalDiagnosis(0, prov().at(0));
      expect(prov().at(0).value.term).toBeNull();
      expect(confirmation.confirm).not.toHaveBeenCalled();
    });
  });

  describe('confirmatory diagnosis list', () => {
    beforeEach(() => fixture.detectChanges());

    it('adds up to 30 and then alerts', () => {
      for (let i = 0; i < 29; i++) component.addConfirmatoryDiagnosis();
      expect(conf().length).toBe(30);
      component.addConfirmatoryDiagnosis();
      expect(conf().length).toBe(30);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.maxDiagnosis,
      );
    });

    it('confirms before removing a valid entry', () => {
      component.addConfirmatoryDiagnosis();
      conf().at(0).patchValue({ term: 'A', conceptID: '1' });
      component.removeConfirmatoryDiagnosis(0, conf().at(0));
      expect(conf().length).toBe(1);
      expect(component.generalDiagnosisForm.dirty).toBeTrue();
    });

    it('resets the only valid entry when confirmed', () => {
      const fg = conf().at(0) as FormGroup;
      fg.patchValue({ term: 'A', conceptID: '1' });
      fg.controls['viewConfirmatoryDiagnosisProvided'].disable();
      component.removeConfirmatoryDiagnosis(0, fg);
      expect(fg.value.term).toBeNull();
      expect(
        fg.controls['viewConfirmatoryDiagnosisProvided'].enabled,
      ).toBeTrue();
    });

    it('does nothing when confirmation declined', () => {
      confirmation.confirm.and.returnValue(of(false));
      conf().at(0).patchValue({ term: 'A', conceptID: '1' });
      component.removeConfirmatoryDiagnosis(0, conf().at(0));
      expect(conf().at(0).value.term).toBe('A');
    });

    it('removes invalid entries without confirmation', () => {
      component.addConfirmatoryDiagnosis();
      component.removeConfirmatoryDiagnosis(1, conf().at(1));
      expect(conf().length).toBe(1);
      component.removeConfirmatoryDiagnosis(0, conf().at(0));
      expect(conf().length).toBe(1);
      expect(confirmation.confirm).not.toHaveBeenCalled();
    });
  });

  it('checks diagnosis validity', () => {
    const ok = { value: { term: 't', conceptID: 'c' } };
    const bad = { value: { term: 't' } };
    expect(component.checkProvisionalDiagnosisValidity(ok)).toBeFalse();
    expect(component.checkProvisionalDiagnosisValidity(bad)).toBeTrue();
    expect(component.checkConfirmatoryDiagnosisValidity(ok)).toBeFalse();
    expect(component.checkConfirmatoryDiagnosisValidity(bad)).toBeTrue();
  });

  it('displays diagnoses', () => {
    expect(component.displayDiagnosis('x')).toBe('x');
    expect(component.displayDiagnosis({ term: 'T' })).toBe('T');
    expect(component.displayDiagnosis(undefined)).toBe('');
  });


  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    component.caseRecordMode = 'view';
    component.ngOnChanges();
    component.ngOnDestroy();
    expect(component.beneficiaryDetailsSubscription.closed).toBeTrue();
    expect(component.diagnosisSubscription.closed).toBeTrue();
  });

  it('destroys cleanly without subscriptions', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

});
