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
  DoCheck,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService } from '../shared/services/doctor.service';
import { CameraService } from '../../core/services/camera.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import * as moment from 'moment';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-radiologist-worklist',
  templateUrl: './radiologist-worklist.component.html',
  styleUrls: ['./radiologist-worklist.component.css'],
})
export class RadiologistWorklistComponent
  implements OnInit, DoCheck, OnDestroy
{
  rowsPerPage = 5;
  activePage = 1;
  pagedList = [];
  rotate = true;
  beneficiaryList: any;
  filteredBeneficiaryList: any = [];
  blankTable = [1, 2, 3, 4, 5];
  filterTerm: any;
  currentLanguageSet: any;
  currentPage!: number;
  displayedColumns: any = [
    'sno',
    'beneficiaryID',
    'beneficiaryName',
    'gender',
    'age',
    'visitCategory',
    'district',
    'phoneNo',
    'visitDate',
    'image',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  constructor(
    private cameraService: CameraService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.sessionstorage.setItem('currentRole', 'Radiologist');
    this.removeBeneficiaryDataForVisit();
    this.loadWorklist();
  }

  removeBeneficiaryDataForVisit() {
    this.sessionstorage.removeItem('visitCode');
    this.sessionstorage.removeItem('beneficiaryGender');
    this.sessionstorage.removeItem('benFlowID');
    this.sessionstorage.removeItem('visitCategory');
    this.sessionstorage.removeItem('beneficiaryRegID');
    this.sessionstorage.removeItem('visitID');
    this.sessionstorage.removeItem('beneficiaryID');
    this.sessionstorage.removeItem('doctorFlag');
    this.sessionstorage.removeItem('nurseFlag');
    this.sessionstorage.removeItem('pharmacist_flag');
    this.sessionstorage.removeItem('specialistFlag');
  }

  ngOnDestroy() {
    this.sessionstorage.removeItem('currentRole');
  }

  loadWorklist() {
    this.doctorService.getRadiologistWorklist().subscribe(
      (data: any) => {
        if (data.statusCode === 200 && data.data !== null) {
          console.log('radiologist worklist', data.data);

          const benlist = this.loadDataToBenList(data.data);
          this.beneficiaryList = benlist;
          this.filteredBeneficiaryList = benlist;
          this.dataSource.data = [];
          this.dataSource.data = benlist;
          this.dataSource.paginator = this.paginator;
          this.dataSource.data.forEach((sectionCount: any, index: number) => {
            sectionCount.sno = index + 1;
          });
          this.filterTerm = null;
        } else {
          this.confirmationService.alert(data.errorMessage, 'error');
          this.dataSource.data = [];
          this.dataSource.paginator = this.paginator;
        }
      },
      (err: any) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }

  loadDataToBenList(data: any) {
    data.forEach((element: any) => {
      element.genderName = element.genderName || 'Not Available';
      element.age = element.age || 'Not Available';
      element.statusMessage = element.statusMessage || 'Not Available';
      element.VisitCategory = element.VisitCategory || 'Not Available';
      element.benVisitNo = element.benVisitNo || 'Not Available';
      element.districtName = element.districtName || 'Not Available';
      element.villageName = element.villageName || 'Not Available';
      element.preferredPhoneNum = element.preferredPhoneNum || 'Not Available';
      element.visitDate =
        moment(element.visitDate).format('DD-MM-YYYY HH:mm A ') ||
        'Not Available';
      element.benVisitDate =
        moment(element.benVisitDate).format('DD-MM-YYYY HH:mm A ') ||
        'Not Available';
    });
    return data;
  }

  filterBeneficiaryList(searchTerm: string) {
    if (!searchTerm) this.filteredBeneficiaryList = this.beneficiaryList;
    else {
      this.filteredBeneficiaryList = [];
      this.dataSource.data = [];
      this.dataSource.paginator = this.paginator;
      this.beneficiaryList.forEach((item: any) => {
        for (const key in item) {
          if (
            key === 'beneficiaryID' ||
            key === 'benName' ||
            key === 'genderName' ||
            key === 'age' ||
            key === 'VisitCategory' ||
            key === 'benVisitNo' ||
            key === 'districtName' ||
            key === 'preferredPhoneNum' ||
            key === 'villageName' ||
            key === 'beneficiaryRegID' ||
            key === 'visitDate'
          ) {
            const value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.filteredBeneficiaryList.push(item);
              this.dataSource.data.push(item);
              this.dataSource.paginator = this.paginator;
              this.dataSource.data.forEach(
                (sectionCount: any, index: number) => {
                  sectionCount.sno = index + 1;
                },
              );
              break;
            }
          }
        }
      });
    }
  }
  pageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedList = this.filteredBeneficiaryList.slice(startItem, endItem);
    console.log('list', this.pagedList);
  }
  patientImageView(benregID: any) {
    this.beneficiaryDetailsService
      .getBeneficiaryImage(benregID)
      .subscribe((data: any) => {
        if (data && data.benImage) this.cameraService.viewImage(data.benImage);
        else
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.imageNotFound,
          );
      });
  }

  loadDoctorExaminationPage(beneficiary: any) {
    this.sessionstorage.setItem('benFlowID', beneficiary.benFlowID);
    this.sessionstorage.setItem('visitCode', beneficiary.visitCode);
    if (beneficiary.visitFlowStatusFlag === 'N') {
      this.confirmationService
        .confirm(
          `info`,
          this.currentLanguageSet.alerts.info.confirmtoProceedFurther,
        )
        .subscribe((result) => {
          if (result) {
            this.sessionstorage.setItem('visitID', beneficiary.benVisitID);
            this.sessionstorage.setItem('doctorFlag', beneficiary.doctorFlag);
            this.sessionstorage.setItem('nurseFlag', beneficiary.nurseFlag);
            this.sessionstorage.setItem(
              'pharmacist_flag',
              beneficiary.pharmacist_flag,
            );
            this.sessionstorage.setItem(
              'beneficiaryRegID',
              beneficiary.beneficiaryRegID,
            );
            this.sessionstorage.setItem(
              'beneficiaryID',
              beneficiary.beneficiaryID,
            );
            this.sessionstorage.setItem(
              'visitCategory',
              beneficiary.VisitCategory,
            );
            this.router.navigate([
              '/nurse-doctor/patient',
              beneficiary.beneficiaryRegID,
            ]);
          }
        });
    } else {
      this.confirmationService
        .confirm('info', this.currentLanguageSet.alerts.info.consulation)
        .subscribe((res) => {
          if (res) {
            this.sessionstorage.setItem(
              'caseSheetBenFlowID',
              beneficiary.benFlowID,
            );
            this.sessionstorage.setItem(
              'caseSheetVisitCategory',
              beneficiary.VisitCategory,
            );
            this.sessionstorage.setItem(
              'caseSheetBeneficiaryRegID',
              beneficiary.beneficiaryRegID,
            );
            this.sessionstorage.setItem(
              'caseSheetVisitID',
              beneficiary.benVisitID,
            );
            this.router.navigate([
              '/nurse-doctor/print/' + 'TM' + '/' + 'current',
            ]);
          }
        });
    }
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
