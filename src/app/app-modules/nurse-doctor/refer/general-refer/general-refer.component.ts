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

import { Component, OnInit, Input, DoCheck, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../shared/services';
import { DatePipe } from '@angular/common';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { MatDialog } from '@angular/material/dialog';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';

@Component({
  selector: 'app-general-refer',
  templateUrl: './general-refer.component.html',
  styleUrls: ['./general-refer.component.css'],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-US', // Set the desired locale (e.g., 'en-GB' for dd/MM/yyyy)
    },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'LL',
        },
        display: {
          dateInput: 'DD/MM/YYYY', // Set the desired display format
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
})
export class GeneralReferComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  referForm!: FormGroup;

  @Input()
  referMode!: string;

  revisitDate: any;
  tomorrow: any;
  maxSchedulerDate: any;
  today: any;
  higherHealthcareCenter: any;
  additionalServices: any;
  beneficiaryRegID: any;
  visitID: any;
  visitCategory: any;
  date: any;
  previousServiceList: any;
  currentLanguageSet: any;
  referralReason: any;

  selectValue: any;
  selectValueService: any;
  showMsg: any = 0;
  healthCareReferred = false;
  referralReferred = false;
  instituteFlag = false;
  referralSuggested: any = 0;
  referredVisitcode: any;
  designation: any;

  constructor(
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    public datepipe: DatePipe,
    private masterdataService: MasterdataService,
    private idrsScoreService: IdrsscoreService,
    private nurseService: NurseService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.visitCategory = localStorage.getItem('visitCategory');
    if (localStorage.getItem('referredVisitCode')) {
      this.referredVisitcode = localStorage.getItem('referredVisitCode');
    } else {
      this.referredVisitcode = 'undefined';
    }
    this.getDoctorMasterData();
    this.idrsScoreService.clearSuspectedArrayFlag();
    this.idrsScoreService.clearReferralSuggested();

    this.idrsScoreService.IDRSSuspectedFlag$.subscribe((response) => {
      this.showMsg = response;
      if (this.showMsg > 0) sessionStorage.setItem('suspectFlag', 'true');
      else sessionStorage.setItem('suspectFlag', 'false');
    });
    this.idrsScoreService.referralSuggestedFlag$.subscribe((response) => {
      this.showMsg = response;
      if (this.showMsg > 0) sessionStorage.setItem('suspectFlag', 'true');
      else sessionStorage.setItem('suspectFlag', 'false');
    });
    this.today = new Date();
    const d = new Date();
    const checkdate = new Date();
    d.setDate(d.getDate() + 1);
    checkdate.setMonth(this.today.getMonth() + 3);
    this.maxSchedulerDate = checkdate;
    this.tomorrow = d;

    //designation to show the TMC suggestion.
    this.designation = localStorage.getItem('designation');
  }

  ngOnDestroy() {
    if (this.doctorMasterDataSubscription)
      this.doctorMasterDataSubscription.unsubscribe();
    if (this.referSubscription) this.referSubscription.unsubscribe();
  }

  doctorMasterDataSubscription: any;
  getDoctorMasterData() {
    this.doctorMasterDataSubscription =
      this.masterdataService.doctorMasterData$.subscribe((masterData) => {
        if (masterData) {
          console.log('masterData=', masterData);
          this.higherHealthcareCenter = masterData.higherHealthCare;
          if (this.higherHealthcareCenter.length === 0) {
            this.instituteFlag = false;
            sessionStorage.setItem('instFlag', 'false');
          } else {
            this.instituteFlag = true;
            sessionStorage.setItem('instFlag', 'true');
          }
          this.additionalServices = masterData.additionalServices;
          //to add correct name by checking it from masterdata
          console.log(masterData.revisitDate);
          console.log('hi');
          this.revisitDate = masterData.revisitDate;

          if (this.referMode === 'view') {
            this.beneficiaryRegID = localStorage.getItem('beneficiaryRegID');
            this.visitID = localStorage.getItem('visitID');
            this.visitCategory = localStorage.getItem('visitCategory');
            this.getReferDetails(
              this.beneficiaryRegID,
              this.visitID,
              this.visitCategory,
            );
          }
        }
      });
  }

  referSubscription: any;
  getReferDetails(beneficiaryRegID: any, visitID: any, visitCategory: any) {
    this.referSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data && res.data.Refer) {
          this.patchReferDetails(res.data.Refer);
        }
      });
  }

  patchReferDetails(referDetails: any) {
    this.revisitDate = referDetails.revisitDate;
    this.referralReason = referDetails.referralReason;
    this.revisitDate = this.datepipe.transform(this.revisitDate, 'yyyy-MM-dd');
    const temp: any = [];
    if (referDetails.refrredToAdditionalServiceList) {
      this.previousServiceList = referDetails.refrredToAdditionalServiceList;
      referDetails.refrredToAdditionalServiceList.map((item: any) => {
        const arr = this.additionalServices.filter((element: any) => {
          return element.serviceName === item.serviceName;
        });
        if (arr.length > 0) temp.push(arr[0]);
      });
    }
    console.log('line96' + temp.slice());
    referDetails.refrredToAdditionalServiceList = temp.slice();
    console.log('referDetails', referDetails);
    const referedToInstitute = this.higherHealthcareCenter.filter(
      (item: any) => {
        return item.institutionID === referDetails.referredToInstituteID;
      },
    );
    if (referedToInstitute.length > 0) {
      referDetails.referredToInstituteName = referedToInstitute[0];
    }
    console.log('referredDet=' + referDetails);
    console.log('revisitDate' + this.revisitDate);
    referDetails.revisitDate = this.revisitDate;
    referDetails.referralReason = this.referralReason;
    this.referForm.patchValue({ referralReason: referDetails.referralReason });
    this.referForm.patchValue(referDetails);
  }
  get RevisitDate() {
    return this.referForm.get('revisitDate');
  }
  get ReferralReason() {
    return this.referForm.get('referralReason');
  }
  checkdate(revisitDate: any) {
    this.today = new Date();
    const d = new Date();
    const checkdate = new Date();
    d.setDate(d.getDate() + 1);
    checkdate.setMonth(this.today.getMonth() + 3);
    this.maxSchedulerDate = checkdate;
    this.tomorrow = d;
  }

  canDisable(service: any) {
    if (this.previousServiceList) {
      const temp = this.previousServiceList.filter((item: any) => {
        return item.serviceID === service.serviceID;
      });

      if (temp.length > 0) service.disabled = true;
      else service.disabled = false;

      return temp.length > 0;
    }
    return false;
  }

  public additionalservices(selected: any): void {
    if (selected !== null && selected.length > 0) {
      this.selectValueService = selected.length;
      console.log(this.selectValue);
    }
  }

  public higherhealthcarecenter(selected: any): void {
    if (selected !== null && selected.institutionName) {
      this.selectValue = 1;
      this.healthCareReferred = true;
    } // should display the selected option.

    console.log(this.selectValue);
  }

  getPreviousReferralHistory() {
    const benRegID = localStorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousReferredHistory(benRegID, this.visitCategory)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (res.data.data.length > 0) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.Referdetails
                  .previousReferralhistorynotAvailable,
              );
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.Referdetails
                .errorInFetchingPreviousHistory,
              'error',
            );
          }
        },
        (err) => {
          this.confirmationService.alert(
            this.currentLanguageSet.Referdetails.errorInFetchingPreviousHistory,
            'error',
          );
        },
      );
  }

  viewPreviousData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title: this.currentLanguageSet.previousReferralHistoryDetails,
      },
    });
  }

  loadMMUReferDeatils() {
    const reqObj = {
      benRegID: localStorage.getItem('beneficiaryRegID'),
      visitCode: localStorage.getItem('referredVisitCode'),
      benVisitID: localStorage.getItem('referredVisitID'),
      fetchMMUDataFor: 'Referral',
    };
    if (
      localStorage.getItem('referredVisitCode') !== 'undefined' &&
      localStorage.getItem('referredVisitID') !== 'undefined'
    ) {
      this.doctorService.getMMUData(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (res.data.data.refrredToAdditionalServiceList.length > 0) {
              this.viewMMUReferData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.Referdetails
                  .mMUReferraldetailsnotAvailable,
              );
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.Referdetails
                .errorInFetchingMMUReferraldetails,
              'error',
            );
          }
        },
        (err) => {
          this.confirmationService.alert(
            this.currentLanguageSet.Referdetails
              .errorInFetchingMMUReferraldetails,
            'error',
          );
        },
      );
    }
  }

  viewMMUReferData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title: this.currentLanguageSet.Referdetails.mMUReferralDetails,
      },
    });
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
}
