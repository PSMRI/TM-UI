/*
 * AMRIT � Accessible Medical Records via Integrated Technology
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

import { Component, OnInit, Input, OnChanges, DoCheck } from '@angular/core';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
    selector: 'app-cancer-history-case-sheet',
    templateUrl: './cancer-history-case-sheet.component.html',
    styleUrls: ['./cancer-history-case-sheet.component.css'],
    standalone: false
})
export class CancerHistoryCaseSheetComponent
  implements OnInit, OnChanges, DoCheck
{
  @Input()
  casesheetData: any;
  @Input()
  previous: any;
  familyDiseaseHistory: any;
  patientPersonalHistory: any;
  patientObstetricHistory: any;
  beneficiaryDetails: any;

  blankRows = [1, 2, 3, 4];
  current_language_set: any;

  constructor(public httpServiceService: HttpServiceService) {}

  ngOnInit() {
    this.assignSelectedLanguage();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  ngOnChanges() {
    if (this.casesheetData) {
      if (this.casesheetData.BeneficiaryData)
        this.beneficiaryDetails = this.casesheetData.BeneficiaryData;

      if (
        this.casesheetData.nurseData &&
        this.casesheetData.nurseData.familyDiseaseHistory
      )
        this.familyDiseaseHistory =
          this.casesheetData.nurseData.familyDiseaseHistory;

      if (
        this.casesheetData.nurseData &&
        this.casesheetData.nurseData.benPersonalDietHistory
      )
        this.patientPersonalHistory = Object.assign(
          {},
          this.casesheetData.nurseData.benPersonalDietHistory,
        );

      if (
        this.casesheetData.nurseData &&
        this.casesheetData.nurseData.patientPersonalHistory
      )
        this.patientPersonalHistory = Object.assign(
          this.patientPersonalHistory,
          this.casesheetData.nurseData.patientPersonalHistory,
        );

      if (
        this.casesheetData.nurseData &&
        this.casesheetData.nurseData.patientObstetricHistory
      )
        this.patientObstetricHistory =
          this.casesheetData.nurseData.patientObstetricHistory;
    }
  }
}
