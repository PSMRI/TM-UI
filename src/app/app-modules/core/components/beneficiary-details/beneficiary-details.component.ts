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

import { Component, OnInit, DoCheck, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BeneficiaryDetailsService } from '../../services/beneficiary-details.service';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import { ConfirmationService } from '../../services';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-beneficiary-details',
  templateUrl: './beneficiary-details.component.html',
  styleUrls: ['./beneficiary-details.component.css'],
})
export class BeneficiaryDetailsComponent implements OnInit, DoCheck, OnDestroy {
  beneficiary: any;
  today: any;
  beneficiaryDetailsSubscription: any;
  current_language_set: any;
  benDetails: any;
  healthIDArray: any = [];
  healthIDValue = '';

  constructor(
    private route: ActivatedRoute,
    public httpServiceService: HttpServiceService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private registrarService: RegistrarService,
    readonly sessionstorage: SessionStorageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    const benFlowID: any = this.sessionstorage.getItem('benFlowID');
    this.assignSelectedLanguage();
    this.today = new Date();
    this.route.params.subscribe((param) => {
      this.beneficiaryDetailsService.getBeneficiaryDetails(
        param['beneficiaryRegID'],
        benFlowID,
      );
      this.beneficiaryDetailsSubscription =
        this.beneficiaryDetailsService.beneficiaryDetails$.subscribe((res) => {
          if (res !== null) {
            this.beneficiary = res;
            if (res.serviceDate) {
              this.today = res.serviceDate;
            }
          }
        });

      this.beneficiaryDetailsService
        .getBeneficiaryImage(param['beneficiaryRegID'])
        .subscribe((data: any) => {
          if (data?.benImage) {
            this.beneficiary.benImage = data.benImage;
          }
        });
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

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
  }

  getHealthIDDetails() {
    this.route.params.subscribe((param) => {
      console.log('benID', param);
      const data = {
        beneficiaryRegID: param['beneficiaryRegID'],
        beneficiaryID: null,
      };
      this.registrarService.getHealthIdDetails(data).subscribe(
        (healthIDDetails: any) => {
          if (healthIDDetails.statusCode200) {
            console.log('healthID', healthIDDetails);
            if (
              healthIDDetails.data.BenHealthDetails !== undefined &&
              healthIDDetails.data.BenHealthDetails !== null
            ) {
              this.benDetails = healthIDDetails.data.BenHealthDetails;
              if (this.benDetails.length > 0) {
                this.benDetails.forEach((healthID: any, index: any) => {
                  if (
                    healthID.healthId !== undefined &&
                    healthID.healthId !== null &&
                    index !== this.benDetails.length - 1
                  )
                    this.healthIDArray.push(healthID.healthId + ',');
                  else if (
                    healthID.healthId !== undefined &&
                    healthID.healthId !== null
                  )
                    this.healthIDArray.push(healthID.healthId);
                  if (
                    healthID.healthId !== undefined &&
                    healthID.healthId !== null
                  )
                    this.healthIDValue =
                      this.healthIDValue + healthID.healthId + ',';
                });
              }
              if (
                this.healthIDValue !== undefined &&
                this.healthIDValue !== null &&
                this.healthIDValue.length > 1
              ) {
                this.healthIDValue = this.healthIDValue.substring(
                  0,
                  this.healthIDValue.length - 1,
                );
                this.beneficiaryDetailsService.healthID = this.healthIDValue;
              }
            }
          } else {
            this.confirmationService.alert(
              this.current_language_set.issueInGettingBeneficiaryABHADetails,
              'error',
            );
          }
        },
        (err: any) => {
          this.confirmationService.alert(
            this.current_language_set.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        },
      );
    });
  }
}
