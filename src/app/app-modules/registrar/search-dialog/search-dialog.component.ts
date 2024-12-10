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

import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  AfterViewChecked,
  DoCheck,
} from '@angular/core';
import { CommonService } from '../../core/services/common-services.service';
import { RegistrarService } from '../shared/services/registrar.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { environment } from 'src/environments/environment';
import { HttpServiceService } from '../../core/services/http-service.service';
import { MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

interface Beneficary {
  firstName: string;
  lastName: string;
  fatherName: string;
  dob: string;
  gender: string;
  genderName: string;
  govtIDtype: string;
  govtIDvalue: string;
  stateID: string;
  districtID: string;
}

@Component({
  selector: 'app-search-dialog',
  templateUrl: './search-dialog.component.html',
  styleUrls: ['./search-dialog.component.css'],
})
export class SearchDialogComponent implements OnInit, DoCheck {
  // for ID Manpulation
  masterData: any;
  masterDataSubscription: any;

  beneficiary!: Beneficary;
  states: any;
  districts: any;
  stateID: any;
  districtID: any;
  govtIDs: any;
  countryId = environment.countryId;
  today!: Date;
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  newSearchForm!: FormGroup;
  maxDate = new Date();

  constructor(
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    public matDialogRef: MatDialogRef<SearchDialogComponent>,
    public commonService: CommonService,
    private registrarService: RegistrarService,
    private changeDetectorRef: ChangeDetectorRef,
    private fb: FormBuilder,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.newSearchForm = this.createBeneficiaryForm();
    this.callMasterDataObservable();
    this.getStatesData(); //to be called from masterobservable method layter
    this.today = new Date();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  AfterViewChecked() {
    this.changeDetectorRef.detectChanges();
  }

  createBeneficiaryForm() {
    return this.fb.group({
      firstName: [null, Validators.required],
      lastName: [null],
      fatherName: [null],
      dob: [null],
      gender: [null, Validators.required],
      stateID: [null, Validators.required],
      districtID: [null, Validators.required],
    });
  }

  resetBeneficiaryForm() {
    this.newSearchForm.reset();
    this.getStatesData();
  }

  /**
   *
   * Call Master Data Observable
   */
  callMasterDataObservable() {
    this.registrarService.getRegistrationMaster(this.countryId);
    this.loadMasterDataObservable();
  }

  /**
   *
   * Load Master Data of Id Cards as Observable
   */
  loadMasterDataObservable() {
    this.masterDataSubscription =
      this.registrarService.registrationMasterDetails$.subscribe((res) => {
        console.log('Registrar master data', res);
        if (res !== null) {
          this.masterData = Object.assign({}, res);
          console.log(this.masterData, 'masterDataall');
          this.getStatesData();
          this.govtIDData();
        }
      });
  }

  /**
   * select gender Name from id
   */
  selectGender() {
    const genderMaster = this.masterData.genderMaster;
    genderMaster.forEach((element: any) => {
      if (element.genderID === this.newSearchForm.controls['gender']) {
        this.newSearchForm.controls['genderName'] = element.genderName;
      }
    });
    console.log(this.newSearchForm.controls, 'csdvde');
  }

  /**
   * combining Govt ID lists
   */

  govtIDData() {
    console.log(this.masterData, 'govtidddds');
    const govID = this.masterData.govIdEntityMaster;
    const otherGovID = this.masterData.otherGovIdEntityMaster;

    otherGovID.forEach((element: any) => {
      govID.push(element);
    });
    this.govtIDs = govID;
    console.log(this.govtIDs, 'idsss');
  }

  location: any;
  /**
   * get states from localstorage and set default state
   */
  getStatesData() {
    const location: any = this.sessionstorage.getItem('location');
    this.location = JSON.parse(location);
    console.log(location, 'gotit');
    if (location) {
      this.states = this.location.stateMaster;
      if (location.otherLoc) {
        this.newSearchForm.controls['stateID'] = this.location.otherLoc.stateID;
        this.newSearchForm.controls['districtID'] =
          this.location.otherLoc.districtList[0].districtID;
        this.onStateChange();
      }
    }
  }

  onStateChange() {
    const stateIDVal: any = this.newSearchForm.controls['stateID'].value;
    if (stateIDVal) {
      this.registrarService
        .getDistrictList(stateIDVal)
        .subscribe((res: any) => {
          if (res && res.statusCode === 200) {
            this.districts = res.data;
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.issueFetching,
              'error',
            );
            this.matDialogRef.close(false);
          }
        });
    }
  }

  getDistricts(stateID: any) {
    this.commonService.getDistricts(stateID).subscribe((res) => {
      this.districts = res;
    });
  }

  beneficiaryList: any = [];
  dataObj: any;
  getSearchResult(formValues: any) {
    this.dataObj = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      fatherName: formValues.fatherName,
      dob: formValues.dob,
      genderID: formValues.gender,
      i_bendemographics: {
        stateID: formValues.state,
        districtID: formValues.district,
      },
    };

    //Passing form data to component and closing the dialog
    this.matDialogRef.close(this.dataObj);
  }
}
