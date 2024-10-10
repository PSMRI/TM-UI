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

import { Component, OnInit, Input, DoCheck, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NurseService } from '../../shared/services/nurse.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { LabService } from '../../../lab/shared/services';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ViewRadiologyUploadedFilesComponent } from '../../../lab/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { DoctorService } from '../../shared/services';
import { MatDialog } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';

@Component({
  selector: 'app-patient-upload-files',
  templateUrl: './upload-files.component.html',
  styleUrls: ['./upload-files.component.css'],
})
export class UploadFilesComponent implements OnInit, DoCheck, OnChanges {
  fileList!: FileList;
  file: any;
  fileContent: any;
  valid_file_extensions = [
    'msg',
    'pdf',
    'png',
    'jpeg',
    'jpg',
    'doc',
    'docx',
    'xlsx',
    'xls',
    'csv',
    'txt',
  ];
  disableFileSelection = false;
  enableForNCDScreening = false;
  maxFileSize = 5;

  @Input()
  patientFileUploadDetailsForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  enableFileSelection!: boolean;
  currentLanguageSet: any;

  constructor(
    private nurseService: NurseService,
    private labService: LabService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  ngOnChanges() {
    const specialistFlagString = localStorage.getItem('specialistFlag');
    if (String(this.mode) === 'view' && !this.enableFileSelection) {
      this.disableFileSelection = true;
    } else if (String(this.mode) === 'view' && this.enableFileSelection) {
      this.enableForNCDScreening = true;
    } else if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      this.enableForNCDScreening = true;
    } else {
      this.disableFileSelection = false;
    }
  }
  uploadFile(event: any) {
    this.fileList = event.target.files;
    if (this.fileList.length > 0) {
      this.file = event.target.files[0];

      const fileNameExtension = this.file.name.split('.');
      const fileName = fileNameExtension[0];
      if (fileName !== undefined && fileName !== null && fileName !== '') {
        const validFormat = this.checkExtension(this.file);
        if (!validFormat) {
          this.confirmationService.alert(
            this.currentLanguageSet.invalidFileExtensionSupportedFileFormats,
            'error',
          );
        } else {
          if (this.fileList[0].size / 1000 / 1000 > this.maxFileSize) {
            console.log('File Size' + this.fileList[0].size / 1000 / 1000);
            this.confirmationService.alert(
              this.currentLanguageSet.fileSizeShouldNotExceed +
                ' ' +
                this.maxFileSize +
                ' ' +
                this.currentLanguageSet.mb,
              'error',
            );
          } else if (this.file) {
            const myReader: FileReader = new FileReader();
            myReader.onloadend = this.onLoadFileCallback.bind(this);
            myReader.readAsDataURL(this.file);
          }
        }
      } else
        this.confirmationService.alert(
          this.currentLanguageSet.invalidFileName,
          'error',
        );
    }
  }

  onLoadFileCallback = (event: any) => {
    console.log(event, 'myReaderevent');

    const fileContent = event.currentTarget.result;
    this.assignFileObject(fileContent);
  };
  /*
   *  check for valid file extensions
   */
  checkExtension(file: any) {
    let count = 0;
    console.log('FILE DETAILS', file);
    if (file) {
      const array_after_split = file.name.split('.');
      if (array_after_split.length === 2) {
        const file_extension = array_after_split[array_after_split.length - 1];
        for (let i = 0; i < this.valid_file_extensions.length; i++) {
          if (
            file_extension.toUpperCase() ===
            this.valid_file_extensions[i].toUpperCase()
          ) {
            count = count + 1;
          }
        }

        if (count > 0) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  fileObj: any = [];
  assignFileObject(fileContent: any) {
    const serviceLineDetails: any = localStorage.getItem('serviceLineDetails');
    const kmFileManager = {
      fileName: this.file !== undefined ? this.file.name : '',
      fileExtension:
        this.file !== undefined ? '.' + this.file.name.split('.')[1] : '',
      userID: localStorage.getItem('userID'),
      fileContent: fileContent !== undefined ? fileContent.split(',')[1] : '',
      vanID: JSON.parse(serviceLineDetails).vanID,
      isUploaded: false,
      providerServiceMapID: localStorage.getItem('providerServiceID'),
      createdBy: localStorage.getItem('userName'),
    };
    this.fileObj.push(kmFileManager);
    this.nurseService.fileData = this.fileObj;
    console.log('kmFileManager', this.fileObj);
  }
  /*
   *  Remove file
   */
  remove(file: any) {
    const index = this.fileObj.indexOf(file);

    if (index >= 0) {
      this.fileObj.splice(index, 1);
    }
    console.log(this.fileObj);
    this.nurseService.fileData = null;
  }

  savedFileData: any = [];
  fileIDs: any = [];

  get uploadFiles() {
    return this.patientFileUploadDetailsForm.controls['fileIDs'].value;
  }

  saveUploadDetails(fileObj: any) {
    this.labService.saveFile(fileObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          res.data.forEach((file: any) => {
            this.savedFileData.push(file);
            this.fileIDs.push(file.kmFileManagerID);
            this.confirmationService.alert(
              'File Uploaded successfully',
              'success',
            );
          });
          this.fileObj.map((file: any) => {
            file.isUploaded = true;
          });
          this.savedFileData.map((file: any) => {
            file.isUploaded = true;
          });
        }
      },
      (err) => {
        this.confirmationService.alert(err.errorMessage, 'err');
      },
    );
    console.log('fileIDs', this.fileIDs);
    this.patientFileUploadDetailsForm.patchValue({
      fileIDs: this.fileIDs,
    });
    this.nurseService.fileData = null;
  }

  checkForDuplicateUpload() {
    if (this.fileObj !== undefined) {
      if (this.savedFileData !== undefined) {
        if (this.fileObj.length > this.savedFileData.length) {
          const result = this.fileObj.filter((uniqueFileName: any) => {
            const arrNames = this.savedFileData.filter((savedFileName: any) => {
              if (uniqueFileName.isUploaded === savedFileName.isUploaded) {
                return true;
              } else {
                return false;
              }
            });
            if (arrNames.length === 0) {
              return true;
            } else {
              return false;
            }
          });
          console.log('result', result);
          if (result && result.length > 0) {
            this.saveUploadDetails(result);
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.selectNewFile,
              'info',
            );
          }
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.selectNewFile,
            'info',
          );
        }
      } else {
        this.saveUploadDetails(this.fileObj);
      }
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.selectNewFile,
        'info',
      );
    }
  }

  viewNurseSelectedFiles() {
    console.log('this.doc', this.doctorService.fileIDs);
    const file_Ids = this.doctorService.fileIDs;
    const ViewTestReport = this.dialog.open(
      ViewRadiologyUploadedFilesComponent,
      {
        width: '40%',
        data: {
          filesDetails: file_Ids,
          panelClass: 'dialog-width',
          disableClose: false,
        },
      },
    );
    ViewTestReport.afterClosed().subscribe((result) => {
      if (result) {
        this.labService.viewFileContent(result).subscribe((res: any) => {
          const blob = new Blob([res], { type: res.type });
          console.log(blob, 'blob');
          const url = window.URL.createObjectURL(blob);
          // window.open(url);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
      }
    });
  }

  triggerLog(event: any) {
    console.log(event.clientX);
    if (event.clientX !== 0) {
      const x: any = document.getElementById('fileUpload');
      x?.click();
    }
  }
}
