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
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { CancerCaseRecordComponent } from './cancer-case-record.component';
import { DoctorService } from '../../shared/services/doctor.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { CameraService } from 'src/app/app-modules/core/services/camera.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('CancerCaseRecordComponent', () => {
  let component: CancerCaseRecordComponent;
  let fixture: ComponentFixture<CancerCaseRecordComponent>;
  let doctorService: any;
  let camera: any;
  let storage: any;
  let router: Router;
  let benDetails$: BehaviorSubject<any>;

  const BEN = { genderName: 'Female', beneficiaryRegID: 22, benVisitID: 11 };

  beforeEach(async () => {
    doctorService = autoSpy(DoctorService);
    doctorService.getCancerVitalsDetails.and.returnValue(
      of({
        statusCode: 200,
        data: { GraphData: { bpList: [], weightList: [], bgList: [] } },
      }),
    );
    camera = autoSpy(CameraService);
    benDetails$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerCaseRecordComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 22,
            visitID: 11,
            visitCategory: 'Cancer Screening',
          },
        }),
        { provide: DoctorService, useValue: doctorService },
        { provide: CameraService, useValue: camera },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CancerCaseRecordComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    storage = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture = TestBed.createComponent(CancerCaseRecordComponent);
    component = fixture.componentInstance;
    component.diagnosisForm = new FormGroup({
      provisionalDiagnosisPrimaryDoctor: new FormControl(null),
    });
  });

  describe('init', () => {
    beforeEach(() => fixture.detectChanges());

    it('sets the language and waits for beneficiary details', () => {
      component.ngAfterViewInit();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(doctorService.getCancerVitalsDetails).not.toHaveBeenCalled();
      component.current_language_set = undefined;
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('flags women and loads graph data for the visit', () => {
      benDetails$.next(BEN);
      expect(component.female).toBeTrue();
      expect(doctorService.getCancerVitalsDetails).toHaveBeenCalledWith(22, 11);
      expect(doctorService.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('does not flag men', () => {
      benDetails$.next({ ...BEN, genderName: 'Male' });
      expect(component.female).toBeUndefined();
    });
  });

  describe('view mode', () => {
    beforeEach(() => {
      component.caseRecordMode = 'view';
      fixture.detectChanges();
    });

    it('fetches diagnosis details when the doctor flag is 9', () => {
      storage.setItem('doctorFlag', '9');
      benDetails$.next(BEN);
      expect(doctorService.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        22,
        11,
        'Cancer Screening',
      );
    });

    it('does not fetch for other doctor flags', () => {
      storage.setItem('doctorFlag', '2');
      benDetails$.next(BEN);
      expect(doctorService.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });
  });

  it('getGraphData plots the returned graph data', () => {
    spyOn(component, 'movegraphData');
    doctorService.getCancerVitalsDetails.and.returnValue(
      of({ statusCode: 200, data: { GraphData: { g: 1 } } }),
    );
    component.getGraphData(BEN);
    expect(component.movegraphData).toHaveBeenCalledWith({ g: 1 });
  });

  it('movegraphData plots all three graphs', () => {
    spyOn(component, 'plotBloodPressureGraph');
    spyOn(component, 'plotWeightGraph');
    spyOn(component, 'plotBloodSugarGraph');
    component.movegraphData({ bpList: [1], weightList: [2], bgList: [3] });
    expect(component.plotBloodPressureGraph).toHaveBeenCalledWith([1]);
    expect(component.plotWeightGraph).toHaveBeenCalledWith([2]);
    expect(component.plotBloodSugarGraph).toHaveBeenCalledWith([3]);
  });

  describe('graphs', () => {
    it('plots complete BP readings newest first', () => {
      component.plotBloodPressureGraph([
        { date: '2026-01-01', avgSysBP: 120, avgDysBP: 80 },
        { date: '2026-02-01', avgSysBP: 130, avgDysBP: 85 },
        { date: '2026-03-01', avgSysBP: 140 },
      ]);
      expect(component.bpChartLabels).toEqual(['2026-02-01', '2026-01-01']);
      expect(component.bpChartData).toEqual([
        { data: [130, 120], label: 'Systolic BP' },
        { data: [85, 80], label: 'Diastolic BP' },
      ]);
    });

    it('skips the BP graph without readings', () => {
      component.plotBloodPressureGraph([]);
      component.plotBloodPressureGraph(null);
      expect(component.bpChartData).toEqual([]);
    });

    it('plots weights newest first', () => {
      component.plotWeightGraph([
        { date: '2026-01-01', weight: 60 },
        { date: '2026-02-01', weight: 62 },
        { date: '2026-03-01' },
      ]);
      expect(component.weightChartLabels).toEqual(['2026-02-01', '2026-01-01']);
      expect(component.weightChartData).toEqual([
        { data: [62, 60], label: 'Weight' },
      ]);
    });

    it('plots complete blood sugar readings', () => {
      component.plotBloodSugarGraph([
        { date: '2026-01-01', bg_2hr_pp: 140, bg_fasting: 90, bg_random: 110 },
        { date: '2026-02-01', bg_fasting: 95 },
      ]);
      expect(component.bgChartLabels).toEqual(['2026-01-01']);
      expect(component.bgChartData).toEqual([
        { data: [140], label: '2-Hr Post Prandial' },
        { data: [90], label: 'Fasting' },
        { data: [110], label: 'Random' },
      ]);
    });

    it('leaves the weight and sugar graphs empty without data', () => {
      component.plotWeightGraph([]);
      component.plotBloodSugarGraph([]);
      expect(component.weightChartData).toEqual([]);
      expect(component.bgChartData).toEqual([]);
    });
  });

  describe('chartClicked', () => {
    ['bw', 'bp', 'bg'].forEach((type) => {
      it(`opens the ${type} graph`, () => {
        component.chartClicked(type);
        expect(camera.ViewGraph).toHaveBeenCalledWith(
          jasmine.objectContaining({ type, chartType: 'line' }),
        );
      });
    });

    it('ignores unknown graph types', () => {
      component.chartClicked('xx');
      expect(camera.ViewGraph).not.toHaveBeenCalled();
    });

    it('does not open incomplete graph objects', () => {
      component.callBodyWeightGraph({ type: 'bw' });
      component.callBloodPressureGraph({});
      component.callBloodGlucoseGraph({});
      expect(camera.ViewGraph).not.toHaveBeenCalled();
    });
  });

  describe('diagnosis details', () => {
    it('patches the diagnosis form from a successful response', () => {
      doctorService.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { diagnosis: { provisionalDiagnosisPrimaryDoctor: 'Dx' } },
        }),
      );
      component.getDiagnosisDetails(22, 11, 'Cancer Screening');
      expect(component.diagnosisForm.value).toEqual({
        provisionalDiagnosisPrimaryDoctor: 'Dx',
      });
    });

    it('ignores responses without a diagnosis', () => {
      spyOn(component, 'patchDiagnosisDetails');
      doctorService.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.getDiagnosisDetails(22, 11, 'X');
      expect(component.patchDiagnosisDetails).not.toHaveBeenCalled();
    });
  });

  it('calculateBMI uses the current vitals', () => {
    component.currentVitals = { weight_Kg: 65, height_cm: 170 };
    expect(component.calculateBMI()).toBe(22.5);
    component.currentVitals = null;
    expect(component.calculateBMI()).toBe(0);
  });

  describe('checkNormalWaist', () => {
    it('uses 80cm for non-pregnant women', () => {
      component.female = true;
      component.pregnancyStatus = 'No';
      component.checkNormalWaist(85);
      expect(component.normalWaist).toBeFalse();
      component.checkNormalWaist(75);
      expect(component.normalWaist).toBeTrue();
    });

    it('uses 90cm otherwise', () => {
      component.female = false;
      component.checkNormalWaist(85);
      expect(component.normalWaist).toBeTrue();
      component.checkNormalWaist(95);
      expect(component.normalWaist).toBeFalse();
    });
  });

  it('getCaseSheetPrintData stores the visit and opens the print page', () => {
    component.getCaseSheetPrintData({
      createdDate: '2026-03-05T10:00:00Z',
      VisitCategory: 'Cancer Screening',
      beneficiaryRegID: 22,
      benVisitID: 11,
    });
    expect(component.visitDateTime).toBe('2026-03-05T10:00:00.000Z');
    expect(storage.getItem('caseSheetBenFlowID')).toBe('null');
    expect(storage.getItem('caseSheetVisitCategory')).toBe('Cancer Screening');
    expect(storage.getItem('caseSheetBeneficiaryRegID')).toBe(22);
    expect(storage.getItem('caseSheetVisitID')).toBe(11);
    expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/print']);
  });

  describe('MMU history', () => {
    const HISTORY = Array.from({ length: 7 }, (_, i) => ({
      VisitCategory: i % 2 ? 'Cancer Screening' : 'General OPD',
      id: i,
    }));

    it('loads history and shows the first page', () => {
      doctorService.getMMUHistory.and.returnValue(
        of({ statusCode: 200, data: HISTORY }),
      );
      component.getMMUHistory();
      expect(component.hideMMUFetch).toBeTrue();
      expect(component.previousMMUHistoryPagedList).toEqual(
        HISTORY.slice(0, 5),
      );
    });

    it('keeps the fetch button on failure', () => {
      doctorService.getMMUHistory.and.returnValue(of({ statusCode: 5000 }));
      component.getMMUHistory();
      expect(component.hideMMUFetch).toBeFalse();
    });

    it('filters by visit category and resets paging', () => {
      component.historyOfMMU = HISTORY;
      component.previousMMUHistoryActivePage = 2;
      component.filterMMUHistory('cancer');
      expect(component.filteredMMUHistory.length).toBe(3);
      expect(component.previousMMUHistoryActivePage).toBe(1);
      component.filterMMUHistory();
      expect(component.filteredMMUHistory).toBe(HISTORY);
    });

    it('pages the filtered list', () => {
      component.filteredMMUHistory = HISTORY;
      component.previousMMUHistoryPageChanged({ page: 2, itemsPerPage: 5 });
      expect(component.previousMMUHistoryPagedList).toEqual(HISTORY.slice(5));
    });
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    component.getDiagnosisDetails(1, 2, 'X');
    const subs = [
      component.beneficiaryDetailsSubscription,
      component.diagnosisSubscription,
    ];
    component.ngOnDestroy();
    subs.forEach((s) => expect(s.closed).toBeTrue());
  });
});
