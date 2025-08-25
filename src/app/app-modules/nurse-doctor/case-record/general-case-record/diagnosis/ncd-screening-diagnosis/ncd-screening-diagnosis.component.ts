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
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { ConfirmationService } from '../../../../../core/services/confirmation.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from 'src/app/app-modules/nurse-doctor/shared/services';
import { IdrsscoreService } from 'src/app/app-modules/nurse-doctor/shared/services/idrsscore.service';
import { GeneralUtils } from 'src/app/app-modules/nurse-doctor/shared/utility';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-ncd-screening-diagnosis',
  templateUrl: './ncd-screening-diagnosis.component.html',
  styleUrls: ['./ncd-screening-diagnosis.component.css'],
})
export class NcdScreeningDiagnosisComponent
  implements OnInit, OnChanges, DoCheck
{
  utils = new GeneralUtils(this.fb, this.sessionstorage);

  @Input()
  generalDiagnosisForm!: FormGroup;

  @Input()
  caseRecordMode!: string;
  designation: any;
  specialist!: boolean;
  doctorDiagnosis: any;
  current_language_set: any;
  confirmed: any;
  diabetesChecked!: boolean;
  hyperTensionChecked!: boolean;
  confirmDisease = [];
  confirmHyperTensionDisease = [];
  enableProvisionalDiag!: boolean;
  suggestedDiagnosisList: any = [];
  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private idrsScoreService: IdrsscoreService,
    private nurseService: NurseService,
    readonly sessionstorage: SessionStorageService,
    private masterdataService: MasterdataService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();

    console.log('caseRecordMode', this.caseRecordMode);
    console.log('doctorDiagnosis', this.doctorDiagnosis);
    this.designation = this.sessionstorage.getItem('designation');
    if (this.designation === 'TC Specialist') {
      this.generalDiagnosisForm.controls['instruction'].enable();
      this.specialist = true;
    } else {
      this.generalDiagnosisForm.controls['instruction'].disable();
      this.specialist = false;
    }
    this.idrsScoreService.enableDiseaseConfirmationOnCaseRecord$.subscribe(
      (confirmDisease) => {
        if (confirmDisease) {
          this.updateIfDiseaseConfirmed();
        }
      },
    );
    this.idrsScoreService.finalDiagnosisDiabetesConfirm(false);
    this.idrsScoreService.finalDiagnosisHypertensionConfirm(false);
    this.nurseService.enableProvisionalDiag$.subscribe((response) => {
      if (response === true) {
        this.enableProvisionalDiag = true;
      } else {
        this.enableProvisionalDiag = false;
      }
    });
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  get specialistDaignosis() {
    return this.generalDiagnosisForm.get('instruction');
  }

  get doctorDaignosis() {
    return this.generalDiagnosisForm.get('viewProvisionalDiagnosisProvided');
  }

  ngOnChanges() {
    if (this.caseRecordMode === 'view') {
      const beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
      const visitID = this.sessionstorage.getItem('visitID');
      const visitCategory = this.sessionstorage.getItem('visitCategory');
      const specialistFlagString =
        this.sessionstorage.getItem('specialist_flag');
      if (
        this.sessionstorage.getItem('referredVisitCode') === 'undefined' ||
        this.sessionstorage.getItem('referredVisitCode') === null
      ) {
        this.getDiagnosisDetails(beneficiaryRegID, visitID, visitCategory);
      } else if (
        specialistFlagString !== null &&
        parseInt(specialistFlagString) === 3
      ) {
        this.getMMUDiagnosisDetails(
          beneficiaryRegID,
          visitID,
          visitCategory,
          this.sessionstorage.getItem('visitCode'),
        );
      } else {
        this.getMMUDiagnosisDetails(
          beneficiaryRegID,
          this.sessionstorage.getItem('referredVisitID'),
          visitCategory,
          this.sessionstorage.getItem('referredVisitCode'),
        );
      }
    }
  }

  diagnosisSubscription: any;
  getDiagnosisDetails(beneficiaryRegID: any, visitID: any, visitCategory: any) {
    this.diagnosisSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data && res.data.diagnosis) {
          this.generalDiagnosisForm.patchValue(res.data.diagnosis);
          if (res.data.diagnosis.provisionalDiagnosisList) {
            this.patchDiagnosisDetails(
              res.data.diagnosis.provisionalDiagnosisList,
            );
          }
        }
      });
  }

  MMUdiagnosisSubscription: any;
  getMMUDiagnosisDetails(
    beneficiaryRegID: any,
    visitID: any,
    visitCategory: any,
    visitCode: any,
  ) {
    this.MMUdiagnosisSubscription = this.doctorService
      .getMMUCaseRecordAndReferDetails(
        beneficiaryRegID,
        visitID,
        visitCategory,
        visitCode,
      )
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data && res.data.diagnosis) {
          this.generalDiagnosisForm.patchValue(res.data.diagnosis);
          if (res.data.diagnosis.provisionalDiagnosisList) {
            this.patchDiagnosisDetails(
              res.data.diagnosis.provisionalDiagnosisList,
            );
          }
        }
      });
  }

  patchDiagnosisDetails(provisionalDiagnosis: any) {
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
        this.addDiagnosis();
      }
    }
  }

  addDiagnosis() {
    const diagnosisListForm = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (diagnosisListForm.length < 30) {
      diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.maxDiagnosis,
      );
    }
  }

  get provisionalDiagnosisControls(): AbstractControl[] {
    return (
      (this.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray)
        ?.controls || []
    );
  }

  removeDiagnosisFromList(
    index: any,
    diagnosisList: AbstractControl<any, any>,
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
    } else if (diagnosisListForm.length > 1) {
      diagnosisListForm.removeAt(index);
    } else {
      diagnosisListForm.removeAt(index);
      diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
    }
  }
  checkProvisionalDiagnosisValidity(provisionalDiagnosis: any) {
    const temp = provisionalDiagnosis.value;
    if (temp.term && temp.conceptID) {
      return false;
    } else {
      return true;
    }
  }

  updateIfDiseaseConfirmed() {
    this.idrsScoreService.visitDiseases$.subscribe((response) => {
      this.confirmed = response;
      console.log(' this.confirmed', this.confirmed);
    });
    if (this.confirmed !== null && this.confirmed.length > 0) {
      this.confirmed.forEach((checkForDiabetesAndHyper: any) => {
        if (
          checkForDiabetesAndHyper === 'Diabetes' &&
          checkForDiabetesAndHyper === 'Hypertension'
        ) {
          this.generalDiagnosisForm.patchValue({ diabetesConfirmed: true });
          this.diabetesChecked = true;
          this.hyperTensionChecked = true;
          this.generalDiagnosisForm.controls['diabetesConfirmed'].disable();
          this.generalDiagnosisForm.controls['hypertensionConfirmed'].disable();
          this.generalDiagnosisForm.patchValue({ hypertensionConfirmed: true });
          this.generalDiagnosisForm.patchValue({ diabetesConfirmed: true });
        } else if (checkForDiabetesAndHyper === 'Diabetes') {
          this.generalDiagnosisForm.patchValue({ diabetesConfirmed: true });
          this.diabetesChecked = true;
          this.generalDiagnosisForm.controls['diabetesConfirmed'].disable();
        } else if (checkForDiabetesAndHyper === 'Hypertension') {
          this.generalDiagnosisForm.patchValue({ hypertensionConfirmed: true });
          this.hyperTensionChecked = true;
          this.generalDiagnosisForm.controls['hypertensionConfirmed'].disable();
        } else {
          console.log('confirm diseases');
        }
      });
    } else {
      console.log('No confirmed diseases');
    }
  }
  addToConfirmDisease(diabetesConfirmation: any) {
    this.idrsScoreService.finalDiagnosisDiabetesConfirm(diabetesConfirmation);
  }
  addHyperTensionToConfirmDisease(hyperConfirmation: any) {
    this.idrsScoreService.finalDiagnosisHypertensionConfirm(hyperConfirmation);
  }

   onDiagnosisInputKeyup(value: string, index: number) {
    if (value.length >= 3) {
      this.masterdataService
        .searchDiagnosisBasedOnPageNo(value, index)
        .subscribe((results: any) => {
          this.suggestedDiagnosisList[index] = results?.data?.sctMaster;
        });
    } else {
      this.suggestedDiagnosisList[index] = [];
    }
  }

  displayDiagnosis(diagnosis: any): string {
    return typeof diagnosis === 'string' ? diagnosis : diagnosis?.term || '';
  }

  onDiagnosisSelected(selected: any, index: number) {
    // this.patientQuickConsultForm.get(['provisionalDiagnosisList', index])?.setValue(selected);
    const diagnosisFormArray = this.generalDiagnosisForm.get(
      'provisionalDiagnosisList'
    ) as FormArray;
    const diagnosisFormGroup = diagnosisFormArray.at(index) as FormGroup;

    // Set the nested and top-level fields
    diagnosisFormGroup.patchValue({
      viewProvisionalDiagnosisProvided: selected,
      conceptID: selected?.conceptID || null,
      term: selected?.term || null,
    });
  }
}
