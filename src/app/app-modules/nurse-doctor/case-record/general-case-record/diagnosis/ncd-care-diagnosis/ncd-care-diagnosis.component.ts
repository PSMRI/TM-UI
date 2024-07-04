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

import { Component, OnInit, Input, DoCheck } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { MasterdataService, DoctorService } from '../../../../shared/services';
import { ActivatedRoute } from '@angular/router';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { GeneralUtils } from 'src/app/app-modules/nurse-doctor/shared/utility';

@Component({
  selector: 'app-ncd-care-diagnosis',
  templateUrl: './ncd-care-diagnosis.component.html',
  styleUrls: ['./ncd-care-diagnosis.component.css'],
})
export class NcdCareDiagnosisComponent implements OnInit, DoCheck {
  utils = new GeneralUtils(this.fb);

  @Input()
  generalDiagnosisForm!: FormGroup;

  @Input()
  caseRecordMode!: string;

  ncdCareConditions: any;
  ncdCareTypes: any;
  current_language_set: any;
  designation: any;
  specialist!: boolean;
  isNcdScreeningConditionOther = false;
  temp: any = [];
  visitCategory: any;
  attendantType: any;
  enableNCDCondition = false;
  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.getDoctorMasterData();
    this.assignSelectedLanguage();
    this.designation = localStorage.getItem('designation');
    if (this.designation === 'TC Specialist') {
      this.generalDiagnosisForm.controls['specialistDiagnosis'].enable();
      this.specialist = true;
    } else {
      this.generalDiagnosisForm.controls['specialistDiagnosis'].disable();
      this.specialist = false;
    }
    this.visitCategory = localStorage.getItem('visitCategory');
    this.attendantType = this.route.snapshot.params['attendant'];
    if (this.attendantType === 'doctor') {
      this.enableNCDCondition = true;
    }
    if (this.designation === 'TC Specialist') {
      this.enableNCDCondition = false;
    }
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  getDoctorMasterData() {
    this.masterdataService.doctorMasterData$.subscribe((masterData) => {
      if (masterData) {
        if (masterData.ncdCareConditions)
          this.ncdCareConditions = masterData.ncdCareConditions.slice();
        if (masterData.ncdCareTypes)
          this.ncdCareTypes = masterData.ncdCareTypes.slice();

        if (this.caseRecordMode === 'view') {
          const beneficiaryRegID = localStorage.getItem('beneficiaryRegID');
          const visitID = localStorage.getItem('visitID');
          const visitCategory = localStorage.getItem('visitCategory');
          this.getDiagnosisDetails(beneficiaryRegID, visitID, visitCategory);
        }
      }
    });
  }

  diagnosisSubscription: any;
  getDiagnosisDetails(beneficiaryRegID: any, visitID: any, visitCategory: any) {
    this.diagnosisSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data && res.data.diagnosis) {
          this.patchDiagnosisDetails(res.data.diagnosis);
          if (res.data.diagnosis.provisionalDiagnosisList) {
            this.patchProvisionalDiagnosisDetails(
              res.data.diagnosis.provisionalDiagnosisList,
            );
          }
        }
      });
  }

  patchDiagnosisDetails(diagnosis: any) {
    console.log('diagnosis', diagnosis);
    if (
      diagnosis !== undefined &&
      diagnosis.ncdScreeningConditionArray !== undefined &&
      diagnosis.ncdScreeningConditionArray !== null
    ) {
      this.temp = diagnosis.ncdScreeningConditionArray;
    }
    if (
      diagnosis !== undefined &&
      diagnosis.ncdScreeningConditionOther !== undefined &&
      diagnosis.ncdScreeningConditionOther !== null
    ) {
      this.isNcdScreeningConditionOther = true;
    }
    const ncdCareType = this.ncdCareTypes.filter((item: any) => {
      return item.ncdCareType === diagnosis.ncdCareType;
    });
    if (ncdCareType.length > 0) diagnosis.ncdCareType = ncdCareType[0];

    this.generalDiagnosisForm.patchValue(diagnosis);
  }
  patchProvisionalDiagnosisDetails(provisionalDiagnosis: any) {
    const savedDiagnosisData = provisionalDiagnosis;
    const diagnosisArrayList = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    console.log('from diagnosis' + provisionalDiagnosis[0].term);
    if (
      provisionalDiagnosis[0].term !== '' &&
      provisionalDiagnosis[0].conceptID !== ''
    ) {
      console.log('from diagnosis second' + provisionalDiagnosis[0].term);

      for (let i = 0; i < savedDiagnosisData.length; i++) {
        diagnosisArrayList.at(i).patchValue({
          viewProvisionalDiagnosisProvided: savedDiagnosisData[i].term,
          term: savedDiagnosisData[i].term,
          conceptID: savedDiagnosisData[i].conceptID,
        });
        (<FormGroup>diagnosisArrayList.at(i)).controls[
          'viewProvisionalDiagnosisProvided'
        ].disable();
        if (diagnosisArrayList.length < savedDiagnosisData.length)
          this.addDiagnosis();
      }
    }
  }

  addDiagnosis() {
    const diagnosisListForm = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (diagnosisListForm.length <= 29) {
      diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.maxDiagnosis,
      );
    }
  }

  getProvisionalDiagnosisList(): AbstractControl[] | null {
    const provisionalDiagnosisListControl = this.generalDiagnosisForm.get(
      'provisionalDiagnosisList',
    );
    return provisionalDiagnosisListControl instanceof FormArray
      ? provisionalDiagnosisListControl.controls
      : null;
  }

  removeDiagnosisFromList(
    index: any,
    diagnosisList?: AbstractControl<any, any>,
  ) {
    const diagnosisListForm = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (!diagnosisListForm.at(index).invalid) {
      this.confirmationService
        .confirm(`warn`, this.current_language_set.alerts.info.warn)
        .subscribe((result) => {
          if (result) {
            const diagnosisListForm = this.generalDiagnosisForm.controls[
              'provisionalDiagnosisList'
            ] as FormArray;
            if (diagnosisListForm.length > 1) {
              diagnosisListForm.removeAt(index);
            } else {
              diagnosisListForm.removeAt(index);
              diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
            }
          }
        });
    } else {
      if (diagnosisListForm.length > 1) {
        diagnosisListForm.removeAt(index);
      } else {
        diagnosisListForm.removeAt(index);
        diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
      }
    }
  }

  checkProvisionalDiagnosisValidity(viewProvisionalDiagnosisProvided: any) {
    const temp = viewProvisionalDiagnosisProvided.value;
    if (temp.term && temp.conceptID) {
      return false;
    } else {
      return true;
    }
  }

  changeNcdScreeningCondition(eventValue: any, event: any) {
    const value: any = event.value;
    let flag = false;
    if (value !== undefined && value !== null && value.length > 0) {
      value.forEach((element: any) => {
        if (element === 'Other') flag = true;
      });
    }
    if (flag) this.isNcdScreeningConditionOther = true;
    else {
      this.generalDiagnosisForm.controls[
        'ncdScreeningConditionOther'
      ].patchValue(null);
      this.isNcdScreeningConditionOther = false;
    }
    this.temp = value;
    this.generalDiagnosisForm.controls['ncdScreeningConditionArray'].patchValue(
      value,
    );
  }
}
