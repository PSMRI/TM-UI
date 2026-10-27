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
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';
import { LabService } from 'src/app/app-modules/lab/shared/services';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/lab/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { DoctorService } from '../../../shared/services';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { TestInVitalsService } from '../../../shared/services/test-in-vitals.service';
import { ViewTestReportComponent } from './view-test-report/view-test-report.component';
import { TestAndRadiologyComponent } from './test-and-radiology.component';

const lab = (name: string, extra: any = {}) => ({
  procedureName: name,
  procedureType: 'Laboratory',
  procedureID: 1,
  referredVisit: false,
  componentList: [],
  ...extra,
});
const radiology = (name: string) => ({
  procedureName: name,
  procedureType: 'Radiology',
});

describe('TestAndRadiologyComponent', () => {
  let component: TestAndRadiologyComponent;
  let fixture: ComponentFixture<TestAndRadiologyComponent>;
  let caseRecord$: BehaviorSubject<any>;
  let doctor: any;
  let labService: any;
  let idrs: any;
  let confirm: any;
  let dialog: any;
  let vitals: TestInVitalsService;

  async function setup(sessionValues: Record<string, any> = {}) {
    caseRecord$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, {
      populateCaserecordResponse$: caseRecord$.asObservable(),
    });
    labService = autoSpy(LabService);
    idrs = autoSpy(IdrsscoreService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TestAndRadiologyComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 'BR',
            visitID: 'V',
            visitCategory: 'General OPD',
            ...sessionValues,
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: LabService, useValue: labService },
        { provide: IdrsscoreService, useValue: idrs },
        TestInVitalsService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    spyOn(console, 'log');
    fixture = TestBed.createComponent(TestAndRadiologyComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    vitals = TestBed.inject(TestInVitalsService);
  }

  afterEach(() => fixture?.destroy());



  describe('getMMUTestResults', () => {
    beforeEach(async () =>
      setup({
        visitCode: 'VC',
        referredVisitID: 'RVID',
        referredVisitCode: 'RVC',
      }),
    );

    it('merges current and referred visit results and adds vitals RBS rows', () => {
      component.vitalsRBSResp = lab('RBS Test', { procedureID: null });
      doctor.getMMUCaseRecordAndReferDetails.and.returnValues(
        of({
          statusCode: 200,
          data: {
            LabReport: [
              lab('RBS Test', {
                componentList: [{ stripsNotAvailable: true }],
              }),
              radiology('XRay'),
            ],
            ArchivedVisitcodeForLabResult: [{ visitCode: 1 }],
          },
        }),
        of({
          statusCode: 200,
          data: {
            LabReport: [lab('Hb'), radiology('CT')],
            ArchivedVisitcodeForLabResult: [{ visitCode: 2 }],
          },
        }),
      );
      doctor.getGenericVitalsForMMULabReport.and.returnValue(
        of({
          benPhysicalVitalDetail: {
            rbsTestResult: 150,
            rbsTestRemarks: 'r',
            createdDate: 'c',
          },
        }),
      );
      component.getMMUTestResults('BR', 'V', 'NCD screening');

      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'BR',
        'V',
        'NCD screening',
        'VC',
      );
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'BR',
        'RVID',
        'NCD screening',
        'RVC',
      );
      expect(idrs.setReferralSuggested).toHaveBeenCalled();
      expect(
        component.radiologyResults.map((r: any) => r.procedureName),
      ).toEqual(['XRay', 'CT']);
      expect(component.archivedResults).toEqual([
        { visitCode: 1 },
        { visitCode: 2 },
      ]);
      expect(doctor.getGenericVitalsForMMULabReport).toHaveBeenCalledWith({
        benRegID: 'BR',
        benVisitID: 'V',
      });
      expect(component.labResults.length).toBe(3);
      expect(component.labResults[0].referredVisit).toBeTrue();
      expect(component.labResults[0].componentList[0].testResultValue).toBe(
        150,
      );
    });


    it('ignores a failed current visit response', () => {
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(of(null));
      component.getMMUTestResults('BR', 'V', 'General OPD');
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledTimes(1);
    });

    it('getGeneralVitalsData ignores missing RBS values', () => {
      doctor.getGenericVitalsForMMULabReport.and.returnValues(
        of({}),
        of({ benPhysicalVitalDetail: { rbsTestResult: null } }),
      );
      component.getGeneralVitalsData('BR', 'V');
      component.getGeneralVitalsData('BR', 'V');
      expect(component.labResults).toEqual([]);
    });
  });

  describe('filters and paging', () => {
    beforeEach(async () => setup());


    it('filterArchivedProcedures filters archived results and pages them', () => {
      component.archivedLabResults = [lab('Hb'), lab('RBS')];
      component.filterArchivedProcedures('rb');
      expect(component.filteredArchivedLabResults.length).toBe(1);
      expect(component.previousLabPagedList.length).toBe(1);
      component.filterArchivedProcedures('');
      expect(component.previousLabPagedList.length).toBe(2);
    });
  });

  describe('archived reports', () => {
    beforeEach(async () => setup());

    it('showArchivedTestResult loads archived lab and radiology results', () => {
      doctor.getArchivedReports.and.returnValue(
        of({ statusCode: 200, data: [lab('Hb'), radiology('XRay')] }),
      );
      component.showArchivedTestResult({ visitCode: 'OLD', date: 'D' });
      expect(doctor.getArchivedReports).toHaveBeenCalledWith({
        beneficiaryRegID: 'BR',
        visitCode: 'OLD',
      });
      expect(component.archivedLabResults.length).toBe(1);
      expect(component.archivedRadiologyResults.length).toBe(1);
      expect(component.enableArchiveView).toBeTrue();
      expect(component.visitedDate).toBe('D');
      expect(component.visitCode).toBe('OLD');
    });

    it('showArchivedTestResult ignores failures', () => {
      doctor.getArchivedReports.and.returnValue(of({ statusCode: 500 }));
      component.showArchivedTestResult({ visitCode: 'OLD' });
      expect(component.enableArchiveView).toBeFalse();
    });

    it('resetArchived clears archive state', () => {
      component.archivedLabResults = [1];
      component.enableArchiveView = true;
      component.visitCode = 'x';
      component.previousLabPagedList = [1];
      component.resetArchived();
      expect(component.archivedLabResults).toEqual([]);
      expect(component.filteredArchivedLabResults).toEqual([]);
      expect(component.archivedRadiologyResults).toEqual([]);
      expect(component.enableArchiveView).toBeFalse();
      expect(component.visitCode).toBeNull();
      expect(component.visitedDate).toBeNull();
      expect(component.previousLabPagedList).toEqual([]);
    });

    it('showArchivedRadiologyTestResult opens the report dialog', () => {
      component.showArchivedRadiologyTestResult({ r: 1 });
      expect(dialog.open).toHaveBeenCalledWith(ViewTestReportComponent, {
        data: { r: 1 },
        width: 0.8 * window.innerWidth + 'px',
        panelClass: 'dialog-width',
        disableClose: false,
      });
    });
  });

  describe('showTestResult', () => {
    beforeEach(async () => setup());


    it('does not open when content status fails, alerts on error, skips when dismissed', () => {
      const open = spyOn(window, 'open');
      dialog.open.and.returnValue(createDialogRefMock(9));
      labService.viewFileContent.and.returnValue(
        of({ data: { statusCode: 500 } }),
      );
      component.showTestResult([9]);
      labService.viewFileContent.and.returnValue(
        throwingObs({ errorMessage: 'nope' }),
      );
      component.showTestResult([9]);
      expect(confirm.alert).toHaveBeenCalledWith('nope', 'err');
      dialog.open.and.returnValue(createDialogRefMock(undefined));
      labService.viewFileContent.calls.reset();
      component.showTestResult([9]);
      expect(labService.viewFileContent).not.toHaveBeenCalled();
      expect(open).not.toHaveBeenCalled();
    });
  });

  describe('fetosense', () => {
    beforeEach(async () => setup());

    it('showFetosenseReport builds the summary view', () => {
      component.showFetosenseReport({
        testName: 'NST',
        aMRITFilePath: '/p',
        lengthOfTest: 20,
        partnerName: 'M',
        motherLMPDate: 'L',
        basalHeartRate: 140,
        testId: 'T',
        deviceId: 'D',
      });
      expect(component.enableFetosenseView).toBeTrue();
      expect(component.fetosenseTestName).toBe('NST');
      expect(component.amritFilePath).toBe('/p');
      expect(component.imgUrl).toBeUndefined();
      expect(component.fetosenseView.map((f) => f.value)).toEqual([
        20,
        'M',
        'L',
        140,
        'T',
        'D',
      ] as any);
      expect(component.getTestName(1)).toBeUndefined();
    });

    it('showFetosenseGraph converts base64 PDF to a trusted URL', () => {
      const create = spyOn(URL, 'createObjectURL').and.returnValue('blob:x');
      component.amritFilePath = '/p';
      doctor.getReportsBase64.and.returnValue(
        of({ statusCode: 200, data: { response: btoa('%PDF') } }),
      );
      component.showFetosenseGraph();
      expect(doctor.getReportsBase64).toHaveBeenCalledWith({
        aMRITFilePath: '/p',
      });
      expect(create).toHaveBeenCalled();
      expect(component.imgUrl).toBeTruthy();
    });

    it('showFetosenseGraph skips undefined content, alerts on status error and failure', () => {
      const create = spyOn(URL, 'createObjectURL');
      doctor.getReportsBase64.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.showFetosenseGraph();
      expect(create).not.toHaveBeenCalled();
      doctor.getReportsBase64.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' }),
      );
      component.showFetosenseGraph();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      doctor.getReportsBase64.and.returnValue(throwingObs('x'));
      component.showFetosenseGraph();
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });
  });

  it('ngDoCheck re-assigns language', async () => {
    await setup();
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });
});
