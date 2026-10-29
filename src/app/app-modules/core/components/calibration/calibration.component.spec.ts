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
import { MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { of } from 'rxjs';
import { CalibrationComponent } from './calibration.component';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';
import { ConfirmationService } from '../../services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('CalibrationComponent', () => {
  let fixture: ComponentFixture<CalibrationComponent>;
  let component: CalibrationComponent;
  let master: any;
  let confirmation: any;
  let dialogRef: any;

  const strips = [
    { stripCode: 'S1', expiryDate: '2000-01-01' },
    { stripCode: 'S2', expiryDate: '2999-01-01' },
  ];

  beforeEach(async () => {
    master = autoSpy(MasterdataService);
    master.fetchCalibrationStrips.and.returnValue(
      of({ statusCode: 200, data: { calibrationData: strips, pageCount: 3 } }),
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CalibrationComponent],
      providers: [
        ...commonTestProviders({ dialogData: { providerServiceMapID: 7 } }),
        { provide: MasterdataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CalibrationComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
  });



  it('shows no-record message when the list is empty', () => {
    component.assignSelectedLanguage();
    master.fetchCalibrationStrips.and.returnValue(
      of({ statusCode: 200, data: { calibrationData: [] } }),
    );
    component.masterData(7, 0);
    expect(component.message).toBe(LANGUAGE_EN.common.noRecordFound);
  });


  it('ngDoCheck refreshes the language', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
  });

  describe('goToLink', () => {
    beforeEach(() => component.assignSelectedLanguage());

    it('warns for an expired strip and closes with its code when confirmed', () => {
      component.goToLink(strips[0]);
      expect(confirmation.confirmCalibration).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.coreComponents.selectedCalibrationStripIs,
      );
      expect(dialogRef.close).toHaveBeenCalledWith('S1');
    });

    it('asks to proceed for a valid strip and closes when confirmed', () => {
      component.goToLink(strips[1]);
      expect(confirmation.confirmCalibration).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.coreComponents
          .doYouWantToProceedWithSelectedCalibrationStrip,
      );
      expect(dialogRef.close).toHaveBeenCalledWith('S2');
    });

    it('does not close when the user declines', () => {
      confirmation.confirmCalibration.and.returnValue(of(false));
      component.goToLink(strips[0]);
      component.goToLink(strips[1]);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  it('close() closes the dialog with null', () => {
    component.close();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });


  describe('filterPreviousData', () => {
    beforeEach(() => {
      component.components = new MatTableDataSource<any>();
      component.dataList = strips as any;
    });

    it('restores the full list when the search term is empty', () => {
      component.filterPreviousData('');
      expect(component.components.data).toEqual(strips);
    });

    it('filters by any field value, case-insensitively', () => {
      component.filterPreviousData('s2');
      expect(component.components.data).toEqual([strips[1]]);
    });
  });

});
