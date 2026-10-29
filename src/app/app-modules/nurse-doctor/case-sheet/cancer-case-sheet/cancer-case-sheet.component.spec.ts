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
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { CancerCaseSheetComponent } from './cancer-case-sheet.component';
import { DoctorService } from '../../shared/services/doctor.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { PrintPageSelectComponent } from '../../print-page-select/print-page-select.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
} from 'src/testing/test-utils';

describe('CancerCaseSheetComponent', () => {
  let component: CancerCaseSheetComponent;
  let fixture: ComponentFixture<CancerCaseSheetComponent>;
  let doctorService: any;
  let confirmation: any;
  let dialog: any;
  let location: any;

  const SESSION = {
    caseSheetVisitCategory: 'Cancer Screening',
    caseSheetBenFlowID: 1,
    caseSheetVisitID: 2,
    caseSheetBeneficiaryRegID: 3,
    visitCode: 4,
    previousCaseSheetVisitCategory: 'Cancer Screening',
    previousCaseSheetBenFlowID: 11,
    previousCaseSheetVisitID: 12,
    previousCaseSheetBeneficiaryRegID: 13,
    previousCaseSheetVisitCode: 14,
    currentRole: 'Oncologist',
  };

  async function setup(printablePage?: string, serviceType = 'TM') {
    doctorService = autoSpy(DoctorService);
    location = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerCaseSheetComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: DoctorService, useValue: doctorService },
        { provide: Location, useValue: location },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { printablePage } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CancerCaseSheetComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    fixture = TestBed.createComponent(CancerCaseSheetComponent);
    component = fixture.componentInstance;
    component.serviceType = serviceType;
    fixture.detectChanges();
  }

  describe('current case sheet', () => {
    beforeEach(() => setup('current'));

    it('requests TM case sheet data for the current visit', () => {
      expect(doctorService.getTMCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'Cancer Screening',
        benFlowID: 1,
        benVisitID: 2,
        beneficiaryRegID: 3,
        visitCode: 4,
      });
      expect(component.getCaseSheetDataVisit).toEqual({
        benVisitID: 2,
        benRegID: 3,
        benFlowID: 1,
      });
      expect(component.visitCategory).toBe('Cancer Screening');
      expect(component.hideBack).toBeFalse();
      expect(component.oncologistRemarks).toBeTrue();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('stores data from a successful response only', () => {
      doctorService.getTMCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { a: 1 } }),
      );
      component.getTMCasesheetData({});
      expect(component.caseSheetData).toEqual({ a: 1 });
      doctorService.getTMCasesheetData.and.returnValue(of({ statusCode: 500 }));
      component.getTMCasesheetData({});
      expect(component.caseSheetData).toEqual({ a: 1 });
    });

    it('unsubscribes on destroy', () => {
      const sub = component.casesheetSubs;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
    });

    describe('getOncologistRemarks', () => {
      it('passes existing remarks and saves the trimmed result', () => {
        component.caseSheetDiagnosisData = {
          provisionalDiagnosisOncologist: 'old',
        };
        confirmation.editRemarks.and.returnValue(of('new remark.extra'));
        spyOn(component, 'saveOncologistRemarks');
        component.getOncologistRemarks();
        expect(confirmation.editRemarks).toHaveBeenCalledWith(
          LANGUAGE_EN.casesheet.oncologistObservation,
          'old',
        );
        expect(
          component.caseSheetDiagnosisData.provisionalDiagnosisOncologist,
        ).toBe('new remark');
        expect(component.saveOncologistRemarks).toHaveBeenCalledWith(
          'new remark',
        );
      });

      it('creates diagnosis data when none exists', () => {
        confirmation.editRemarks.and.returnValue(of('note.'));
        spyOn(component, 'saveOncologistRemarks');
        component.getOncologistRemarks();
        expect(confirmation.editRemarks).toHaveBeenCalledWith(
          jasmine.anything(),
          undefined,
        );
        expect(component.caseSheetDiagnosisData).toEqual({
          provisionalDiagnosisOncologist: 'note',
        });
      });

      it('does nothing when the dialog is cancelled', () => {
        confirmation.editRemarks.and.returnValue(of(null));
        spyOn(component, 'saveOncologistRemarks');
        component.getOncologistRemarks();
        expect(component.saveOncologistRemarks).not.toHaveBeenCalled();
      });
    });

    describe('saveOncologistRemarks', () => {
      it('updates the case sheet diagnosis on success', () => {
        component.caseSheetData = {
          doctorData: { diagnosis: { other: 1 } },
        };
        doctorService.postOncologistRemarksforCancerCaseSheet.and.returnValue(
          of({ statusCode: 200 }),
        );
        component.saveOncologistRemarks('remark');
        expect(
          doctorService.postOncologistRemarksforCancerCaseSheet,
        ).toHaveBeenCalledWith('remark', 2, 3);
        expect(component.caseSheetData.doctorData.diagnosis).toEqual({
          other: 1,
          provisionalDiagnosisOncologist: 'remark',
        });
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.common.Dataupdatedsuccessfully,
          'success',
        );
      });

      it('alerts success without doctor data', () => {
        component.caseSheetData = undefined;
        doctorService.postOncologistRemarksforCancerCaseSheet.and.returnValue(
          of({ statusCode: 200 }),
        );
        component.saveOncologistRemarks('remark');
        expect(component.caseSheetData).toBeUndefined();
        expect(confirmation.alert).toHaveBeenCalledWith(
          jasmine.anything(),
          'success',
        );
      });

      it('alerts errors for 500 and 5000', () => {
        [500, 5000].forEach((statusCode) => {
          doctorService.postOncologistRemarksforCancerCaseSheet.and.returnValue(
            of({ statusCode, errorMessage: `e${statusCode}` }),
          );
          component.saveOncologistRemarks('r');
          expect(confirmation.alert).toHaveBeenCalledWith(
            `e${statusCode}`,
            'error',
          );
        });
      });
    });

    describe('selectPrintPage', () => {
      it('applies the selected sections', () => {
        const selection = {
          caseSheetExamination: false,
          caseSheetHistory: false,
          caseSheetCurrentVitals: true,
          cancerCaseSheetObservations: false,
          caseSheetCovidVaccinationDetails: true,
        };
        dialog.open.and.returnValue(createDialogRefMock(selection));
        component.selectPrintPage();
        expect(dialog.open).toHaveBeenCalledWith(
          PrintPageSelectComponent,
          jasmine.objectContaining({
            data: jasmine.objectContaining({
              visitCategory: 'Cancer Screening',
            }),
          }),
        );
        expect(component.printPagePreviewSelect).toEqual(selection);
      });

      it('keeps the defaults when cancelled', () => {
        dialog.open.and.returnValue(createDialogRefMock(undefined));
        component.selectPrintPage();
        expect(component.printPagePreviewSelect.caseSheetHistory).toBeTrue();
      });
    });

    it('prints, scrolls to top and goes back', () => {
      spyOn(window, 'print');
      spyOn(window, 'scrollTo');
      component.printPage();
      component.goToTop();
      component.goBack();
      expect(window.print).toHaveBeenCalled();
      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
      expect(location.back).toHaveBeenCalled();
    });
  });

  describe('previous case sheet', () => {
    beforeEach(() => setup(undefined, 'MMU'));

    it('defaults to the previous visit and requests MMU data', () => {
      expect(component.hideBack).toBeTrue();
      expect(doctorService.getMMUCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'Cancer Screening',
        benFlowID: 11,
        beneficiaryRegID: 13,
        visitCode: 14,
      });
      expect(component.getCaseSheetDataVisit.benVisitID).toBe(12);
      expect(doctorService.getTMCasesheetData).not.toHaveBeenCalled();
    });

    it('stores MMU data from a successful response', () => {
      doctorService.getMMUCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { m: 1 } }),
      );
      component.getMMUCasesheetData({});
      expect(component.caseSheetData).toEqual({ m: 1 });
    });
  });

  describe('other service types', () => {
    beforeEach(() => setup('current', 'HWC'));

    it('does not request case sheet data', () => {
      expect(doctorService.getTMCasesheetData).not.toHaveBeenCalled();
      expect(doctorService.getMMUCasesheetData).not.toHaveBeenCalled();
    });
  });
});
