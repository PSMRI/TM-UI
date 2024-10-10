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

import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './material.module';
import { AppFooterComponent } from './components/app-footer/app-footer.component';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { CommonDialogComponent } from './components/common-dialog/common-dialog.component';
import { SetLanguageComponent } from './components/set-language.component';
import {
  ConfirmationService,
  CameraService,
  AuthService,
  SpinnerService,
  BeneficiaryDetailsService,
} from './services';
import { AuthGuard } from './services/auth-guard.service';
import { CommonService } from './services/common-services.service';
import { HttpServiceService } from './services/http-service.service';
import { InventoryService } from './services/inventory.service';
import { IotService } from './services/iot.service';
import { CameraDialogComponent } from './components/camera-dialog/camera-dialog.component';
import { WebcamModule } from 'ngx-webcam';
import { CanDeactivateGuardService } from './services/can-deactivate-guard.service';
import { BeneficiaryDetailsComponent } from './components/beneficiary-details/beneficiary-details.component';
import { ViewRadiologyUploadedFilesComponent } from '../lab/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { PreviousDetailsComponent } from './components/previous-details/previous-details.component';
import { MatTableModule } from '@angular/material/table';
import { IotcomponentComponent } from './components/iotcomponent/iotcomponent.component';
import { CalibrationComponent } from './components/calibration/calibration.component';
import { ConfirmatoryDiagnosisDirective } from './directives/confirmatory-diagnosis.directive';
import { DisableFormControlDirective } from './directives/disableFormControl.directive';
import { NullDefaultValueDirective } from './directives/null-default-value.directive';
import { AllergenSearchComponent } from './components/allergen-search/allergen-search.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { StringValidatorDirective } from './directives/stringValidator.directive';
import { NumberValidatorDirective } from './directives/numberValidator.directive';
import { OpenPreviousVisitDetailsComponent } from './components/open-previous-visit-details/open-previous-visit-details.component';
import { ShowCommitAndVersionDetailsComponent } from './components/show-commit-and-version-details/show-commit-and-version-details.component';
import { IotBluetoothComponent } from './components/iot-bluetooth/iot-bluetooth.component';
import { MyEmailDirective } from './directives/email/myEmail.directive';
import { MyMobileNumberDirective } from './directives/MobileNumber/myMobileNumber.directive';
import { MyNameDirective } from './directives/name/myName.directive';
import { MyPasswordDirective } from './directives/password/myPassword.directive';
import { MmuRbsDetailsComponent } from './components/mmu-rbs-details/mmu-rbs-details.component';
import { SpecialistLoginComponent } from './components/specialist-login/specialist-login.component';
import { DiagnosisSearchComponent } from './components/diagnosis-search/diagnosis-search.component';
import { DiagnosisSearchDirective } from './directives/provisionalDiagnosis.directive';
import { HealthIdDisplayModalComponent } from './components/health-id-display-modal/health-id-display-modal.component';
import { HttpInterceptorService } from './services/http-interceptor.service';
import { TelemedicineService } from './services/telemedicine.service';
import { MyHealthIdDirective } from './directives/myHealthId/myHealthId.directive';
import { NgChartsModule } from 'ng2-charts';
import { MasterdataService } from '../nurse-doctor/shared/services';
import { RegistrarService } from '../registrar/shared/services/registrar.service';
import { SharedModule } from './components/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    HttpClientModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgChartsModule,
    WebcamModule,
    MatTableModule,
    SharedModule,
  ],
  declarations: [
    CommonDialogComponent,
    CameraDialogComponent,
    SpinnerComponent,
    BeneficiaryDetailsComponent,
    PreviousDetailsComponent,
    ShowCommitAndVersionDetailsComponent,
    CalibrationComponent,
    MmuRbsDetailsComponent,
    SpecialistLoginComponent,
    MyEmailDirective,
    MyMobileNumberDirective,
    ConfirmatoryDiagnosisDirective,
    MyNameDirective,
    MyPasswordDirective,
    StringValidatorDirective,
    NullDefaultValueDirective,
    NumberValidatorDirective,
    IotcomponentComponent,
    IotBluetoothComponent,
    AllergenSearchComponent,
    OpenPreviousVisitDetailsComponent,
    DisableFormControlDirective,
    ViewRadiologyUploadedFilesComponent,
    DiagnosisSearchComponent,
    DiagnosisSearchDirective,
    HealthIdDisplayModalComponent,
    MyHealthIdDirective,
  ],
  exports: [
    MaterialModule,
    CommonDialogComponent,
    IotBluetoothComponent,
    ShowCommitAndVersionDetailsComponent,
    CameraDialogComponent,
    SpinnerComponent,
    BeneficiaryDetailsComponent,
    SpecialistLoginComponent,
    MmuRbsDetailsComponent,
    PreviousDetailsComponent,
    MyEmailDirective,
    MyMobileNumberDirective,
    ConfirmatoryDiagnosisDirective,
    MyNameDirective,
    MyPasswordDirective,
    DisableFormControlDirective,
    StringValidatorDirective,
    NumberValidatorDirective,
    NullDefaultValueDirective,
    IotcomponentComponent,
    AllergenSearchComponent,
    CalibrationComponent,
    HealthIdDisplayModalComponent,
    OpenPreviousVisitDetailsComponent,
    WebcamModule,
    DiagnosisSearchComponent,
    DiagnosisSearchDirective,
    NgChartsModule,
  ],
})
export class CoreModule {
  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [
        HttpInterceptorService,
        HttpServiceService,
        ConfirmationService,
        CameraService,
        AuthGuard,
        AuthService,
        SpinnerService,
        BeneficiaryDetailsService,
        CommonService,
        InventoryService,
        CanDeactivateGuardService,
        TelemedicineService,
        IotService,
        HttpServiceService,
        SetLanguageComponent,
        MasterdataService,
        RegistrarService,
      ],
    };
  }
}
