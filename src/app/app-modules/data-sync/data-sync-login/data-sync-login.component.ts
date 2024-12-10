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

import { Component, OnInit, Injector, DoCheck } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataSyncService } from '../shared/service/data-sync.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { ConfirmationService } from '../../core/services';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-data-sync-login',
  templateUrl: './data-sync-login.component.html',
  styleUrls: ['./data-sync-login.component.css'],
  providers: [DataSyncService],
})
export class DataSyncLoginComponent implements OnInit, DoCheck {
  userName!: string;
  password!: string;

  dynamictype = 'password';
  dialogRef: any;
  data: any;
  current_language_set: any;
  constructor(
    private router: Router,
    public httpServiceService: HttpServiceService,
    private dataSyncService: DataSyncService,
    private injector: Injector,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.dialogRef = this.injector.get(MatDialogRef, null);
    this.data = this.injector.get(MAT_DIALOG_DATA, null);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  showPWD() {
    this.dynamictype = 'text';
  }

  hidePWD() {
    this.dynamictype = 'password';
  }

  dataSyncLogin() {
    if (this.userName && this.password) {
      this.dataSyncService
        .dataSyncLogin(this.userName, this.password)
        .subscribe((res: any) => {
          if ((res.statusCode = '200' && res.data)) {
            this.sessionstorage.setItem('serverKey', res.data.key);
            if (this.data && this.data.masterDowloadFirstTime) {
              const mmuService = res.data.previlegeObj.filter((item: any) => {
                return item.serviceName === 'MMU';
              });
              sessionStorage.setItem('key', res.data.key);
              this.sessionstorage.setItem('providerServiceID', '2049');
              this.dialogRef.close(true);
            } else {
              this.router.navigate(['/datasync/workarea']);
            }
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        });
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.usernamenPass,
      );
    }
  }

  closeDialog() {
    this.dialogRef.close(false);
  }
}
