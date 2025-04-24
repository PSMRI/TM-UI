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
import * as moment from 'moment';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
    selector: 'app-cancer-examination-case-sheet',
    templateUrl: './cancer-examination-case-sheet.component.html',
    styleUrls: ['./cancer-examination-case-sheet.component.css'],
    standalone: false
})
export class CancerExaminationCaseSheetComponent
  implements OnInit, OnChanges, DoCheck
{
  @Input()
  casesheetData: any;
  @Input()
  previous: any;
  gynecologicalImageUrl = 'assets/images/gynecologicalExamination.png';
  breastImageUrl = 'assets/images/breastExamination.png';
  abdominalImageUrl = 'assets/images/abdominalExamination.png';
  oralImageUrl = 'assets/images/oralExamination.png';
  date: any;
  signsAndSymptoms: any;
  BenCancerLymphNodeDetails: any;
  oralExamination: any;
  breastExamination: any;
  abdominalExamination: any;
  gynecologicalExamination: any;
  imageAnnotatedData: any;
  beneficiaryDetails: any;
  diagnosisdetails: any;

  blankRows = [1, 2, 3, 4];
  current_language_set: any;
  serviceList = '';

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

      this.signsAndSymptoms = this.casesheetData.nurseData.signsAndSymptoms;
      this.BenCancerLymphNodeDetails =
        this.casesheetData.nurseData.BenCancerLymphNodeDetails;
      this.oralExamination = this.casesheetData.nurseData.oralExamination;
      this.breastExamination = this.casesheetData.nurseData.breastExamination;
      this.abdominalExamination =
        this.casesheetData.nurseData.abdominalExamination;
      this.gynecologicalExamination =
        this.casesheetData.nurseData.gynecologicalExamination;
      this.imageAnnotatedData = this.casesheetData.ImageAnnotatedData;
    }
    const t = new Date();
    this.date = t.getDate() + '/' + (t.getMonth() + 1) + '/' + t.getFullYear();
    if (
      this.casesheetData !== undefined &&
      this.casesheetData.doctorData !== undefined &&
      this.casesheetData.doctorData.diagnosis !== undefined
    )
      this.diagnosisdetails = this.casesheetData.doctorData.diagnosis;

    console.log(
      'referDetailsForRefercancer',
      JSON.stringify(this.diagnosisdetails, null, 4),
    );
    if (
      this.casesheetData !== undefined &&
      this.casesheetData.doctorData !== undefined &&
      this.casesheetData.doctorData.diagnosis !== undefined &&
      !moment(
        this.casesheetData.doctorData.diagnosis.revisitDate,
        'DD/MM/YYYY',
        true,
      ).isValid()
    ) {
      if (this.diagnosisdetails.revisitDate !== undefined) {
        const sDate = new Date(this.diagnosisdetails.revisitDate);
        this.diagnosisdetails.revisitDate = [
          this.padLeft.apply(sDate.getDate()),
          this.padLeft.apply(sDate.getMonth() + 1),
          this.padLeft.apply(sDate.getFullYear()),
        ].join('/');
      }
    }
  }
  padLeft() {
    const len = String(10).length - String(this).length + 1;
    return len > 0 ? new Array(len).join('0') + this : this;
  }

  getImageAnnotation(imageID: any) {
    const arr = this.imageAnnotatedData.filter(
      (item: any) => item.imageID === imageID,
    );
    return arr.length > 0 ? arr[0] : null;
  }
}
