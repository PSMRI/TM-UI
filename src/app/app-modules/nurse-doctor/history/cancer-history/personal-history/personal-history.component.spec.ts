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
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { PersonalHistoryComponent } from './personal-history.component';
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

describe('PersonalHistoryComponent (cancer)', () => {
  let component: PersonalHistoryComponent;
  let fixture: ComponentFixture<PersonalHistoryComponent>;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let masterData$: BehaviorSubject<any>;
  const info = LANGUAGE_EN.alerts.info;
  const ev = (value: any) => ({ target: { value } });

  const OILS = [
    { habitValue: 'Mustard' },
    { habitValue: 'Sunflower' },
    { habitValue: 'Don’t know.' },
  ];
  const MASTER = {
    alcoholUseStatus: ['a'],
    dietTypes: ['d'],
    oilConsumed: OILS,
    physicalActivityType: ['p'],
    tobaccoUseStatus: ['t'],
    typeOfTobaccoProducts: ['Beedi', 'Cigarettes'],
    frequencyOfAlcoholIntake: ['f'],
  };

  beforeEach(async () => {
    nurseService = autoSpy(NurseService);
    masterData$ = new BehaviorSubject<any>(MASTER);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PersonalHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 22,
            serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
          },
        }),
        { provide: NurseService, useValue: nurseService },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: masterData$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: of({ ageVal: 40 }) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PersonalHistoryComponent, '')
      .compileComponents();

    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    fixture = TestBed.createComponent(PersonalHistoryComponent);
    component = fixture.componentInstance;
    component.cancerPatientPerosnalHistoryForm = new CancerUtils(
      TestBed.inject(FormBuilder),
      TestBed.inject(SessionStorageService),
    ).createCancerPatientPerosnalHistoryForm();
    fixture.detectChanges();
  });

  const form = () => component.cancerPatientPerosnalHistoryForm;

  it('loads language, master data and patient age on init', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.patientAge).toBe(40);
    expect(component.templateOilConsumed).toBe(OILS);
    expect(component.templateTobaccoProductUsed).toEqual([
      'Beedi',
      'Cigarettes',
    ]);
    expect(component.templateFrequecyOfAlcohol).toEqual(['f']);
    expect(component.dummy).toEqual(jasmine.objectContaining({ vanID: 1 }));
    component.currentLanguageSet = undefined;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  describe('tobacco products', () => {
    it('flags beedi and cigarette smokers when the list changes', () => {
      form().patchValue({ typeOfTobaccoProductList: ['Beedi', 'Cigarettes'] });
      expect(component.doSmokeBeedi).toBeTrue();
      expect(component.doSmokeCigarettes).toBeTrue();
    });

    it('clears the filtered cigarette answer when cigarettes are deselected', () => {
      form().patchValue({ isFilteredCigaerette: 'Yes' });
      form().patchValue({ typeOfTobaccoProductList: ['Gutka'] });
      expect(component.doSmokeBeedi).toBeFalse();
      expect(component.doSmokeCigarettes).toBeFalse();
      expect(form().value.isFilteredCigaerette).toBeNull();
    });
  });

  it('checkTobaccoUseStatus clears tobacco details for a defined status', () => {
    form().patchValue({ startAge_year: 10, endAge_year: 20 });
    component.checkTobaccoUseStatus(null);
    expect(form().value.startAge_year).toBe(10);
    component.checkTobaccoUseStatus('Yes');
    expect(form().value.startAge_year).toBeNull();
    expect(form().value.endAge_year).toBeNull();
    expect(form().value.typeOfTobaccoProductList).toBeNull();
  });

  it('clears dependent habit fields', () => {
    form().patchValue({
      durationOfBetelQuid: 3,
      ssAlcoholUsed: 'x',
      frequencyOfAlcoholUsed: 'y',
      fruitQuantityPerDay: 1,
      vegetableQuantityPerDay: 2,
    });
    component.checkBetelQuid();
    component.checkUsageOfAlcohol();
    component.checkFruitConsumption();
    component.checkVegetableConsumption();
    expect(form().value.durationOfBetelQuid).toBeNull();
    expect(component.ssAlcoholUsed).toBeNull();
    expect(form().value.frequencyOfAlcoholUsed).toBeNull();
    expect(form().value.fruitQuantityPerDay).toBeNull();
    expect(form().value.vegetableQuantityPerDay).toBeNull();
    form().patchValue({ frequencyOfAlcoholUsed: 'y' });
    component.checkLastAlcoholUsage();
    expect(form().value.frequencyOfAlcoholUsed).toBeNull();
  });

  it('exposes form values through getters', () => {
    form().patchValue({
      tobaccoUse: 'Yes',
      isBetelNutChewing: true,
      alcoholUse: 'No',
      dietType: 'Veg',
      fruitConsumptionDays: 3,
      vegetableConsumptionDays: 4,
    });
    expect(component.tobaccoUse).toBe('Yes');
    expect(component.isBetelNutChewing).toBeTrue();
    expect(component.alcoholUse).toBe('No');
    expect(component.dietType).toBe('Veg');
    expect(component.fruitConsumptionDays).toBe(3);
    expect(component.vegetableConsumptionDays).toBe(4);
  });

  describe('oilSelected', () => {
    it('limits options to "Don’t know." when it is chosen', () => {
      form().patchValue({ typeOfOilConsumedList: ['Don’t know.'] });
      component.oilSelected();
      expect(component.templateOilConsumed).toEqual([OILS[2]]);
    });

    it('removes "Don’t know." when a real oil is chosen', () => {
      form().patchValue({ typeOfOilConsumedList: ['Mustard'] });
      component.oilSelected();
      expect(component.templateOilConsumed).toEqual([OILS[0], OILS[1]]);
    });

    it('restores every option when nothing is selected', () => {
      form().patchValue({ typeOfOilConsumedList: ['Mustard'] });
      component.oilSelected();
      form().patchValue({ typeOfOilConsumedList: [] });
      component.oilSelected();
      expect(component.templateOilConsumed).toBe(OILS);
    });
  });

  it('prevents more than 7 days a week for fruit and vegetables', () => {
    const big = { key: '8', preventDefault: jasmine.createSpy() };
    const ok = { key: '5', preventDefault: jasmine.createSpy() };
    component.preventFruitConsumption(big);
    component.preventVegetableConsumption(big);
    component.preventFruitConsumption(ok);
    expect(big.preventDefault).toHaveBeenCalledTimes(2);
    expect(ok.preventDefault).not.toHaveBeenCalled();
    expect(confirmation.alert).toHaveBeenCalledWith(info.daysInWeek);
  });

  describe('age checks', () => {
    it('rejects a start age above the patient age or zero', () => {
      form().patchValue({ startAge_year: 50 });
      component.checkStartAge(ev('50'));
      expect(form().value.startAge_year).toBeNull();
      expect(confirmation.alert).toHaveBeenCalledWith(info.startAge);
      component.checkStartAge(ev('0'));
      expect(confirmation.alert).toHaveBeenCalledWith(info.invalidLessThan);
    });

    it('accepts a valid start age', () => {
      component.checkStartAge(ev('15'));
      expect(component.startAgeYear).toBe(15);
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('rejects stop ages above the patient age, before the start age, or zero', () => {
      component.checkStartAge(ev('20'));
      component.checkStopAge(ev('45'));
      expect(confirmation.alert).toHaveBeenCalledWith(info.stopAge);
      component.checkStopAge(ev('18'));
      expect(confirmation.alert).toHaveBeenCalledWith(info.ageLess);
      component.checkStopAge(ev('0'));
      expect(confirmation.alert).toHaveBeenCalledWith(info.invalidLessThan);
      expect(form().value.endAge_year).toBeNull();
    });

    it('accepts a valid stop age', () => {
      component.checkStartAge(ev('20'));
      component.checkStopAge(ev('30'));
      expect(confirmation.alert).not.toHaveBeenCalled();
    });
  });

  it('rejects zero quantities per day', () => {
    form().patchValue({ fruitQuantityPerDay: 0, vegetableQuantityPerDay: 0 });
    component.fruitConsumptionPerDayCheck(ev('0'));
    component.vegetableConsumptionPerDayCheck(ev('0'));
    component.fruitConsumptionPerDayCheck(ev('2'));
    expect(confirmation.alert).toHaveBeenCalledTimes(2);
    expect(form().value.fruitQuantityPerDay).toBeNull();
    expect(form().value.vegetableQuantityPerDay).toBeNull();
  });

  it('minimumvaluenonZeroBetelQuid clears a numeric zero', () => {
    form().patchValue({ durationOfBetelQuid: 0 });
    component.minimumvaluenonZeroBetelQuid({ target: { value: 1 } });
    expect(form().value.durationOfBetelQuid).toBe(0);
    component.minimumvaluenonZeroBetelQuid({ target: { value: 0 } });
    expect(form().value.durationOfBetelQuid).toBeNull();
  });

  describe('previous history', () => {
    const cases: [string, string][] = [
      ['getPreviousCancerPersonalHabitHistory', 'habit'],
      ['getPreviousCancerPersonalDietHistory', 'diet'],
    ];

    cases.forEach(([method]) => {
      it(`${method} opens previous details when present`, () => {
        const data = { data: [{ a: 1 }] };
        nurseService[method].and.returnValue(of({ data }));
        (component as any)[method]();
        expect(nurseService[method]).toHaveBeenCalledWith(22);
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: data,
            title:
              LANGUAGE_EN.historyData.personalhistory.previouspersonalhistory,
          },
        });
      });

      it(`${method} alerts when empty, on failure and on error`, () => {
        nurseService[method].and.returnValue(of({ data: { data: [] } }));
        (component as any)[method]();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.previousHistoryDetailsAlert.prevHabitDiet,
        );
        nurseService[method].and.returnValue(
          of({ data: null, errorMessage: 'bad' }),
        );
        (component as any)[method]();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        nurseService[method].and.returnValue(throwingObs('down'));
        (component as any)[method]();
        expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
      });
    });
  });

  it('unsubscribes on destroy', () => {
    const subs = [
      component.nurseMasterDataSubscription,
      component.beneficiaryDetailSubscription,
    ];
    component.ngOnDestroy();
    subs.forEach((s) => expect(s.closed).toBeTrue());
  });
});
