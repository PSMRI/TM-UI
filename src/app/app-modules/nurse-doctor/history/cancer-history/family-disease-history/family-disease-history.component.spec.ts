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
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { FamilyDiseaseHistoryComponent } from './family-disease-history.component';
import { DoctorService } from '../../../shared/services/doctor.service';
import { NurseService } from '../../../shared/services/nurse.service';
import { MasterdataService } from '../../../shared/services/masterdata.service';
import { CancerUtils } from '../../../shared/utility/cancer-utility';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('FamilyDiseaseHistoryComponent', () => {
  let component: FamilyDiseaseHistoryComponent;
  let fixture: ComponentFixture<FamilyDiseaseHistoryComponent>;
  let doctorService: any;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let storage: any;
  let masterData$: BehaviorSubject<any>;

  const BREAST = {
    cancerDiseaseType: 'Breast Cancer',
    gender: 'female',
    snomedCode: 'B1',
    snomedTerm: 'Breast',
  };
  const ORAL = {
    cancerDiseaseType: 'Oral Cancer',
    gender: 'unisex',
    snomedCode: 'O1',
    snomedTerm: 'Oral',
  };
  const OTHER = { cancerDiseaseType: 'Any other Cancer', gender: 'unisex' };
  const MEMBERS = [
    { familyMemberType: 'Mother', gender: 'female' },
    { familyMemberType: 'Father', gender: 'male' },
  ];
  const MASTER = {
    CancerDiseaseType: [BREAST, ORAL, OTHER],
    familyMemberTypes: MEMBERS,
  };

  beforeEach(async () => {
    doctorService = autoSpy(DoctorService);
    doctorService.getCancerHistoryDetails.and.returnValue(
      of({ statusCode: 200, data: { benFamilyHistory: [] } }),
    );
    nurseService = autoSpy(NurseService);
    masterData$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FamilyDiseaseHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 22,
            visitID: 11,
            serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
          },
        }),
        { provide: DoctorService, useValue: doctorService },
        { provide: NurseService, useValue: nurseService },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: masterData$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: of({ name: 'A' }) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(FamilyDiseaseHistoryComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    storage = TestBed.inject(SessionStorageService);
    fixture = TestBed.createComponent(FamilyDiseaseHistoryComponent);
    component = fixture.componentInstance;
    component.cancerPatientFamilyMedicalHistoryForm = new CancerUtils(
      TestBed.inject(FormBuilder),
      storage,
    ).createCancerPatientFamilyMedicalHistoryForm();
  });

  const diseases = () =>
    component.cancerPatientFamilyMedicalHistoryForm.get(
      'diseases',
    ) as FormArray;

  function init(mode = 'new') {
    component.mode = mode;
    fixture.detectChanges();
    masterData$.next(MASTER);
  }

  describe('master data', () => {
    it('loads disease and family member types', () => {
      init();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.templateCancerDiseaseType).toEqual(
        MASTER.CancerDiseaseType,
      );
      expect(component.filterFamilyMemebers).toEqual(MEMBERS);
      expect(component.temp[0].diseaseType.length).toBe(3);
      expect(doctorService.getCancerHistoryDetails).not.toHaveBeenCalled();
    });

    it('fetches history in view mode', () => {
      init('view');
      expect(doctorService.getCancerHistoryDetails).toHaveBeenCalledWith(
        22,
        11,
      );
    });

    it('fetches history for specialist flag 100', () => {
      storage.setItem('specialistFlag', '100');
      init();
      expect(doctorService.getCancerHistoryDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('with master data', () => {
    beforeEach(() => init());

    it('getDiseases returns the disease rows', () => {
      expect(component.getDiseases()?.length).toBe(1);
      component.cancerPatientFamilyMedicalHistoryForm = new FormGroup({});
      expect(component.getDiseases()).toBeNull();
    });

    describe('filterFamilyMember', () => {
      it('filters family members by gender and sets snomed details', () => {
        const row = diseases().at(0);
        component.filterFamilyMember(BREAST, 0, row);
        expect(row.value.snomedCode).toBe('B1');
        expect(component.temp[0].familyMemebers).toEqual([MEMBERS[0]]);
        expect(component.previousValue[0]).toBe(BREAST);
      });

      it('keeps every member for unisex diseases and clears snomed for other', () => {
        const row = diseases().at(0);
        row.patchValue({ snomedCode: 'x', snomedTerm: 'y' });
        component.filterFamilyMember(OTHER, 0, row);
        expect(row.value.snomedCode).toBeNull();
        expect(row.value.snomedTerm).toBeNull();
        expect(component.temp[0].familyMemebers).toEqual(MEMBERS);
      });

      it('removes the chosen disease from other rows and restores the previous one', () => {
        component.addFamilyDisease();
        component.filterFamilyMember(BREAST, 0, diseases().at(0));
        expect(component.temp[1].diseaseType).not.toContain(BREAST);

        component.filterFamilyMember(ORAL, 0, diseases().at(0));
        expect(component.temp[1].diseaseType).toContain(BREAST);
        expect(component.temp[1].diseaseType).not.toContain(ORAL);
      });
    });

    it('addFamilyDisease adds a row without already chosen diseases', () => {
      diseases().at(0).patchValue({ cancerDiseaseType: BREAST });
      component.addFamilyDisease();
      expect(diseases().length).toBe(2);
      expect(component.temp[1].diseaseType).toEqual([ORAL, OTHER]);
    });

    describe('removeDisease', () => {
      it('resets the only row', () => {
        const row = diseases().at(0);
        row.patchValue({ cancerDiseaseType: BREAST });
        component.removeDisease(0, row);
        expect(confirmation.confirm).toHaveBeenCalledWith(
          'warn',
          LANGUAGE_EN.alerts.info.warn,
        );
        expect(diseases().length).toBe(1);
        expect(row.value.cancerDiseaseType).toBeNull();
      });

      it('removes a row and returns its disease to the other lists', () => {
        component.addFamilyDisease();
        component.filterFamilyMember(BREAST, 1, diseases().at(1));
        diseases().at(1).patchValue({ cancerDiseaseType: BREAST });
        expect(component.temp[0].diseaseType).not.toContain(BREAST);

        component.removeDisease(1, diseases().at(1));

        expect(diseases().length).toBe(1);
        expect(component.temp.length).toBe(1);
        expect(component.temp[0].diseaseType).toContain(BREAST);
      });

      it('does nothing when not confirmed', () => {
        confirmation.confirm.and.returnValue(of(false));
        component.addFamilyDisease();
        component.removeDisease(1, diseases().at(1));
        expect(diseases().length).toBe(2);
      });
    });

    describe('getCancerHistory', () => {
      it('patches known and other diseases into rows', () => {
        doctorService.getCancerHistoryDetails.and.returnValue(
          of({
            statusCode: 200,
            data: {
              benFamilyHistory: [
                { cancerDiseaseType: 'Breast Cancer', familyMemberList: ['Mother'] },
                { cancerDiseaseType: 'Bone Cancer', familyMemberList: ['Father'] },
              ],
            },
          }),
        );
        component.getCancerHistory(22, 11);

        expect(diseases().length).toBe(2);
        expect(diseases().at(0).value.cancerDiseaseType).toBe(BREAST);
        expect(diseases().at(1).value.cancerDiseaseType).toBe(OTHER);
        expect(diseases().at(1).value.otherDiseaseType).toBe('Bone Cancer');
        expect(diseases().at(0).touched).toBeTrue();
      });

      it('ignores unsuccessful responses', () => {
        doctorService.getCancerHistoryDetails.and.returnValue(
          of({ statusCode: 5000, data: null }),
        );
        component.getCancerHistory(22, 11);
        expect(component.familyHistoryData).toBeUndefined();
      });
    });

    describe('getPreviousCancerFamilyHistory', () => {
      it('shows previous history in a dialog', () => {
        const data = { data: [{ a: 1 }] };
        nurseService.getPreviousCancerFamilyHistory.and.returnValue(
          of({ data }),
        );
        component.getPreviousCancerFamilyHistory();
        expect(nurseService.getPreviousCancerFamilyHistory).toHaveBeenCalledWith(
          22,
        );
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: data,
            title: LANGUAGE_EN.historyData.familyhistory.previousfamilyhistory,
          },
        });
      });

      it('alerts when empty, on failure and on error', () => {
        nurseService.getPreviousCancerFamilyHistory.and.returnValue(
          of({ data: { data: [] } }),
        );
        component.getPreviousCancerFamilyHistory();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.previousInfo,
        );
        nurseService.getPreviousCancerFamilyHistory.and.returnValue(
          of({ data: null, errorStatus: 'bad' }),
        );
        component.getPreviousCancerFamilyHistory();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        nurseService.getPreviousCancerFamilyHistory.and.returnValue(
          throwingObs('down'),
        );
        component.getPreviousCancerFamilyHistory();
        expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
      });
    });
  });

  it('sortDiseaseList orders by disease name', () => {
    const list = [ORAL, OTHER, BREAST, { ...BREAST }];
    component.sortDiseaseList(list);
    expect(list.map((d) => d.cancerDiseaseType)).toEqual([
      'Any other Cancer',
      'Breast Cancer',
      'Breast Cancer',
      'Oral Cancer',
    ]);
  });

  it('checkValidity requires disease type and family members', () => {
    expect(
      component.checkValidity({
        value: { cancerDiseaseType: BREAST, familyMemberList: ['Mother'] },
      }),
    ).toBeFalse();
    expect(
      component.checkValidity({ value: { cancerDiseaseType: BREAST } }),
    ).toBeTrue();
  });

  it('unsubscribes on destroy and refreshes language on ngDoCheck', () => {
    init('view');
    const subs = [
      component.beneficiaryDetailSubscription,
      component.cancerHistorySubscription,
    ];
    component.ngOnDestroy();
    subs.forEach((s) => expect(s.closed).toBeTrue());
    component.currentLanguageSet = undefined;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
