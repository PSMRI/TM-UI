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

import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, ConfirmationService } from '../../services';
import { HttpServiceService } from '../../services/http-service.service';
import { IotService } from '../../services/iot.service';
import { IotBluetoothComponent } from '../iot-bluetooth/iot-bluetooth.component';
import { ShowCommitAndVersionDetailsComponent } from '../show-commit-and-version-details/show-commit-and-version-details.component';
import { TelemedicineService } from '../../services/telemedicine.service';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css'],
})
export class AppHeaderComponent implements OnInit {
  language_file_path: any = './assets/';
  app_language: any = 'English';
  currentLanguageSet: any;
  languageArray: any;
  navigation: any;
  @Input()
  showRoles = false;

  servicePoint!: any;
  userName!: any;
  isAuthenticated!: boolean;
  roles: any;
  filteredNavigation: any;
  isConnected = true;
  status!: any;
  license: any;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private auth: AuthService,
    private telemedicineService: TelemedicineService,
    public service: IotService,
    private http_service: HttpServiceService,
  ) {}

  ngOnInit() {
    this.service.disconnectValue$.subscribe((response) => {
      if (response === undefined) this.isConnected = false;
      else this.isConnected = response;
    });
    this.http_service.currentLangugae$.subscribe((response) => {
      this.currentLanguageSet = response;
    });

    this.getUIVersionAndCommitDetails();
    this.servicePoint = localStorage.getItem('servicePointName');
    this.userName = localStorage.getItem('userName');
    this.isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
    this.license = environment.licenseUrl;
    if (this.isAuthenticated) {
      this.fetchLanguageSet();
    }
    this.status = localStorage.getItem('providerServiceID');
  }

  DataSync() {
    this.router.navigate(['/datasync']);
  }
  fetchLanguageSet() {
    this.http_service.fetchLanguageSet().subscribe((languageRes: any) => {
      if (
        languageRes &&
        languageRes.data !== undefined &&
        languageRes !== null
      ) {
        this.languageArray = languageRes.data;
        this.getLanguage();
      }
    });
    console.log('language array' + this.languageArray);
  }
  changeLanguage(language: any) {
    this.http_service
      .getLanguage(this.language_file_path + language + '.json')
      .subscribe(
        (response) => {
          if (response !== undefined && response !== null) {
            this.languageSuccessHandler(response, language);
          } else {
            alert(this.currentLanguageSet.alerts.info.langNotDefinesd);
          }
        },
        (error) => {
          alert(
            this.currentLanguageSet.alerts.info.comingUpWithThisLang +
              ' ' +
              language,
          );
        },
      );
  }
  getLanguage() {
    if (sessionStorage.getItem('setLanguage') !== null) {
      this.changeLanguage(sessionStorage.getItem('setLanguage'));
    } else {
      this.changeLanguage(this.app_language);
    }
  }

  languageSuccessHandler(response: any, language: any) {
    console.log('language is ', response);
    if (response === undefined) {
      alert(this.currentLanguageSet.alerts.info.langNotDefinesd);
    }

    if (response[language] !== undefined) {
      this.currentLanguageSet = response[language];
      sessionStorage.setItem('setLanguage', language);
      if (this.currentLanguageSet) {
        this.languageArray.forEach((item: any) => {
          if (item.languageName === language) {
            this.app_language = language;
          }
        });
      } else {
        this.app_language = language;
      }

      this.http_service.getCurrentLanguage(response[language]);
      this.rolenavigation();
    } else {
      alert(
        this.currentLanguageSet.alerts.info.comingUpWithThisLang +
          ' ' +
          language,
      );
    }
  }

  logout() {
    this.auth.logout().subscribe((res) => {
      this.router.navigate(['/login']).then((result) => {
        if (result) {
          this.changeLanguage('English');
          localStorage.clear();
          sessionStorage.clear();
        }
      });
    });
  }
  rolenavigation() {
    this.navigation = [
      {
        role: 'Registrar',
        label: this.currentLanguageSet.role_selection.Registrar,
        link: '/registrar/search',
      },
      {
        role: 'Nurse',
        link: '/nurse-doctor/nurse-worklist',
        label: this.currentLanguageSet.role_selection.Nurse,
      },
      {
        role: 'Doctor',
        link: '/nurse-doctor/doctor-worklist',
        label: this.currentLanguageSet.role_selection.Doctor,
      },
      {
        role: 'Lab Technician',
        link: '/lab/worklist',
        label: this.currentLanguageSet.role_selection.LabTechnician,
      },
      {
        role: 'Pharmacist',
        link: '/pharmacist/pharmacist-worklist',
        label: this.currentLanguageSet.role_selection.Pharmacist,
      },
      {
        role: 'Radiologist',
        link: '/nurse-doctor/radiologist-worklist',
        label: this.currentLanguageSet.role_selection.Radiologist,
      },
      {
        role: 'Oncologist',
        link: '/nurse-doctor/oncologist-worklist',
        label: this.currentLanguageSet.role_selection.Oncologist,
      },
      {
        role: 'TC Specialist',
        label: this.currentLanguageSet.common.TCSpecialist,
        work: [
          {
            link: '/nurse-doctor/tcspecialist-worklist',
            label: 'Worklist',
            labelName: this.currentLanguageSet.common.Worklist,
          },
          {
            label: 'Timesheet',
            labelName: this.currentLanguageSet.common.timeSheet,
          },
        ],
      },
      {
        role: 'DataSync',
        link: '/datasync',
        label: this.currentLanguageSet.common.dataSync,
      },
    ];
    if (this.showRoles) {
      const role: any = localStorage.getItem('role');
      this.roles = JSON.parse(role);
      if (this.roles !== undefined && this.roles !== null) {
        this.filteredNavigation = this.navigation.filter((item: any) => {
          return this.roles.includes(item.role);
        });
      }
    }
  }
  commitDetailsUI: any;
  versionUI: any;
  getUIVersionAndCommitDetails() {
    const commitDetailsPath: any = 'assets/git-version.json';
    this.auth.getUIVersionAndCommitDetails(commitDetailsPath).subscribe(
      (res) => {
        console.log('res', res);
        this.commitDetailsUI = res;
        this.versionUI = this.commitDetailsUI['version'];
      },
      (err) => {
        console.log('err', err);
      },
    );
  }
  showVersionAndCommitDetails() {
    this.auth.getAPIVersionAndCommitDetails().subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.constructAPIAndUIDetails(res.data);
        }
      },
      (err) => {},
    );
  }
  constructAPIAndUIDetails(apiVersionAndCommitDetails: any) {
    const data = {
      commitDetailsUI: {
        version: this.commitDetailsUI['version'],
        commit: this.commitDetailsUI['commit'],
      },
      commitDetailsAPI: {
        version: apiVersionAndCommitDetails['git.build.version'] || 'NA',
        commit: apiVersionAndCommitDetails['git.commit.id'] || 'NA',
      },
    };
    if (data) {
      this.showData(data);
    }
  }
  showData(versionData: any) {
    this.dialog.open(ShowCommitAndVersionDetailsComponent, {
      data: versionData,
    });
  }

  openIOT() {
    this.dialog.open(IotBluetoothComponent, {
      width: '600px',
    });
  }

  getSwymedLogout() {
    this.auth.getSwymedLogout().subscribe((res: any) => {
      window.location.href = res.data.response;
      this.logout();
    });
  }
  navigateToTeleMedicine() {
    this.telemedicineService.routeToTeleMedecine();
  }
}
