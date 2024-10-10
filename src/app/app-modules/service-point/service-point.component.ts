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

import { Component, DoCheck, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { SetLanguageComponent } from '../core/components/set-language.component';
import { ConfirmationService } from '../core/services';
import { HttpServiceService } from '../core/services/http-service.service';
import { ServicePointService } from './service-point.service';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-service-point',
  templateUrl: './service-point.component.html',
  styleUrls: ['./service-point.component.css'],
})
export class ServicePointComponent implements OnInit, DoCheck {
  designation: any;
  vanServicepointDetails: any;
  servicePointsList: any = [];
  filteredServicePoints: any = [];
  vansList: any = [];

  sessionsList = [
    {
      sessionID: 1,
      sessionName: 'Morning',
    },
    {
      sessionID: 2,
      sessionName: 'Evening',
    },
    {
      sessionID: 3,
      sessionName: 'Full Day',
    },
  ];

  showVan = false;

  userId: any;
  serviceProviderId: any;
  isDisabled = true;
  currentLanguageSet: any;
  statesList: any = [];
  districtList: any = [];
  subDistrictList: any = [];
  villageList: any = [];
  vanID: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private servicePointService: ServicePointService,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private languageComponent: SetLanguageComponent,
  ) {}

  servicePointForm = this.fb.group({
    vanID: ['', Validators.required],
    stateID: ['', Validators.required],
    stateName: ['', Validators.required],
    districtID: ['', Validators.required],
    districtName: ['', Validators.required],
    blockID: ['', Validators.required],
    blockName: ['', Validators.required],
    districtBranchID: ['', Validators.required],
    villageName: ['', Validators.required],
  });

  ngOnInit() {
    this.fetchLanguageResponse();
    this.serviceProviderId = localStorage.getItem('providerServiceID');
    this.userId = localStorage.getItem('userID');
    this.getServicePoint();
  }

  resetLocalStorage() {
    localStorage.removeItem('sessionID');
    localStorage.removeItem('serviceLineDetails');
    localStorage.removeItem('vanType');
    localStorage.removeItem('location');
    localStorage.removeItem('servicePointID');
    localStorage.removeItem('servicePointName');
    sessionStorage.removeItem('facilityID');
  }

  getServicePoint() {
    this.route.data.subscribe({
      next: (res: any) => {
        if (
          res.servicePoints.statusCode === 200 &&
          res.servicePoints.data !== null
        ) {
          const data = res.servicePoints.data;
          if (data.UserVanSpDetails)
            this.vanServicepointDetails = data.UserVanSpDetails;
          this.filterVanList(this.vanServicepointDetails);
        } else if (res.servicePoints.statusCode === 5002) {
          this.confirmationService.alert(
            res.servicePoints.errorMessage,
            'error',
          );
        } else {
          this.confirmationService.alert(
            res.servicePoints.errorMessage,
            'error',
          );
          this.router.navigate(['/service']);
        }
      },
      error: (err: any) => {
        this.confirmationService.alert(err, 'error');
      },
    });
  }

  filterVanList(vanServicepointDetails: any) {
    console.log('vanServicepointDetails', vanServicepointDetails);
    this.vansList = vanServicepointDetails.filter((item: any) => {
      if (item.vanSession === '3') {
        return item.vanSession;
      }
    });
    this.vansList = vanServicepointDetails.filter(
      (item: any, index: any, self: any) => {
        return (
          self.findIndex((t: any) => {
            return t.vanID === item.vanID;
          }) === index
        );
      },
    );
  }

  getServiceLineDetails() {
    console.log('van list', this.vansList);

    const selectedVanID = this.servicePointForm.get('vanID')?.value;
    console.log('selected Van ID', selectedVanID);

    const serviceLineDetails: any = this.vansList.find(
      (van: any) => van.vanID === selectedVanID,
    );
    if (serviceLineDetails)
      localStorage.setItem(
        'serviceLineDetails',
        JSON.stringify(serviceLineDetails),
      );
    if (serviceLineDetails.facilityID)
      sessionStorage.setItem('facilityID', serviceLineDetails.facilityID);
    if (serviceLineDetails.servicePointID)
      localStorage.setItem('servicePointID', serviceLineDetails.servicePointID);
    if (serviceLineDetails.servicePointName)
      localStorage.setItem(
        'servicePointName',
        serviceLineDetails.servicePointName,
      );
    if (serviceLineDetails.vanSession)
      localStorage.setItem('sessionID', serviceLineDetails.vanSession);
    this.getDemographics();
  }

  routeToDesignation(designation: any) {
    console.log('designation', designation);
    switch (designation) {
      case 'Registrar':
        this.router.navigate(['/registrar/registration']);
        break;
      case 'Nurse':
        this.router.navigate(['/nurse-doctor/nurse-worklist']);
        break;
      case 'Doctor':
        this.router.navigate(['/nurse-doctor/doctor-worklist']);
        break;
      case 'Lab Technician':
        this.router.navigate(['/lab']);
        break;
      case 'Pharmacist':
        this.router.navigate(['/pharmacist']);
        break;
      case 'Radiologist':
        this.router.navigate(['/nurse-doctor/radiologist-worklist']);
        break;
      case 'Oncologist':
        this.router.navigate(['/nurse-doctor/oncologist-worklist']);
        break;
      default:
    }
  }

  getDemographics() {
    this.servicePointService.getMMUDemographics().subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.saveDemographicsToStorage(res.data);
      } else {
        this.locationGathetingIssues();
      }
    });
  }

  saveDemographicsToStorage(data: any) {
    if (data) {
      if (data.stateMaster && data.stateMaster.length >= 1) {
        localStorage.setItem('location', JSON.stringify(data));
        this.statesList = data.stateMaster;
        this.servicePointForm.controls.stateID.patchValue(
          data.otherLoc.stateID,
        );
        this.fetchDistrictsOnStateSelection(
          this.servicePointForm.controls.stateID.value,
        );
        this.servicePointForm.controls.districtID.reset();
        this.servicePointForm.controls.blockID.reset();
        this.servicePointForm.controls.districtBranchID.reset();
      } else {
        this.locationGathetingIssues();
      }
    } else {
      this.locationGathetingIssues();
    }
  }

  fetchDistrictsOnStateSelection(stateID: any) {
    console.log('stateID', stateID);
    if (stateID) {
      this.statesList.forEach((item: any) => {
        if (item.stateID === stateID)
          return this.servicePointForm.controls.stateName.setValue(
            item.stateName,
          );
      });
    }
    this.registrarService.getDistrictList(stateID).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.districtList = res.data;
        this.servicePointForm.controls.blockID.reset();
        this.servicePointForm.controls.districtBranchID.reset();
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.IssuesInFetchingDemographics,
          'error',
        );
      }
    });
  }

  fetchSubDistrictsOnDistrictSelection(districtID: any) {
    if (districtID) {
      this.districtList.forEach((item: any) => {
        if (item.districtID === districtID)
          return this.servicePointForm.controls.districtName.setValue(
            item.districtName,
          );
      });
    }
    this.registrarService
      .getSubDistrictList(districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.subDistrictList = res.data;
          this.servicePointForm.controls.districtBranchID.reset();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.IssuesInFetchingDemographics,
            'error',
          );
        }
      });
  }

  onSubDistrictChange(blockID: any) {
    if (blockID) {
      this.subDistrictList.forEach((item: any) => {
        if (item.blockID === blockID)
          return this.servicePointForm.controls.blockName.setValue(
            item.blockName,
          );
      });
    }
    this.registrarService.getVillageList(blockID).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.villageList = res.data;
        this.servicePointForm.controls.districtBranchID.reset();
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.IssuesInFetchingLocationDetails,
          'error',
        );
      }
    });
  }

  onDistrictBranchSelection(districtBranchID: any) {
    if (districtBranchID) {
      this.villageList.forEach((item: any) => {
        if (item.districtBranchID === districtBranchID)
          return this.servicePointForm.controls.villageName.setValue(
            item.villageName,
          );
      });
    }
  }

  saveLocationDataToStorage() {
    const locationData = {
      stateID: this.servicePointForm.controls.stateID.value,
      stateName: this.servicePointForm.controls.stateName.value,
      districtID: this.servicePointForm.controls.districtID.value,
      districtName: this.servicePointForm.controls.districtName.value,
      blockName: this.servicePointForm.controls.blockName.value,
      blockID: this.servicePointForm.controls.blockID.value,
      subDistrictID: this.servicePointForm.controls.districtBranchID.value,
      villageName: this.servicePointForm.controls.villageName.value,
    };

    // Convert the object into a JSON string
    const locationDataJSON = JSON.stringify(locationData);

    // Store the JSON string in localStorage
    localStorage.setItem('locationData', locationDataJSON);
    this.goToWorkList();
  }

  goToWorkList() {
    this.designation = localStorage.getItem('designation');
    this.routeToDesignation(this.designation);
  }

  locationGathetingIssues() {
    this.confirmationService.alert(
      this.currentLanguageSet.coreComponents
        .issuesInGettingLocationTryToReLogin,
      'error',
    );
  }

  //AN40085822 13/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--
}
