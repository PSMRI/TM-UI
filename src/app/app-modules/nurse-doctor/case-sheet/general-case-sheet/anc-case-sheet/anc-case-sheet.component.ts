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
    selector: 'app-anc-case-sheet',
    templateUrl: './anc-case-sheet.component.html',
    styleUrls: ['./anc-case-sheet.component.css'],
    standalone: false
})
export class AncCaseSheetComponent implements OnInit, OnChanges, DoCheck {
  @Input()
  caseSheetData: any;
  @Input()
  previous: any;
  aNCDetailsAndFormula: any;
  aNCImmunization: any;
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
    if (
      this.caseSheetData &&
      this.caseSheetData.nurseData &&
      this.caseSheetData.nurseData.anc
    ) {
      this.aNCDetailsAndFormula =
        this.caseSheetData.nurseData.anc.ANCCareDetail;
      this.aNCImmunization =
        this.caseSheetData.nurseData.anc.ANCWomenVaccineDetails;
    }
  }
}
