import { Component, OnInit } from '@angular/core';
import { RddeviceService } from '../../shared/services/rddevice.service';
import { RegistrarService } from '../../shared/services/registrar.service';
import { HealthIdOtpSuccessComponent } from '../../health-id-otp-generation/health-id-otp-generation.component';
import { GenerateMobileOtpGenerationComponent } from '../../generate-mobile-otp-generation/generate-mobile-otp-generation.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
    selector: 'app-rdservicebio',
    templateUrl: './rdservicebio.component.html',
    styleUrls: ['./rdservicebio.component.css'],
    standalone: false
})
export class RdservicebioComponent implements OnInit {
  selectedValue: any;
  select = '';

  txtWadh = '';
  txtDeviceInfo = '';
  txtPidOptions = '';
  txtPidData = '';
  ddlAVDM = '';
  Timeout = '';
  Icount = '';
  Fcount = '';
  Itype = '';
  Ptype = '';
  Ftype = '';
  Dtype = '';
  transactionId: any;
  data: any;
  aadharBioNum: any;
  captureres: any;
  capturePID: any;
  showProgressBar = false;

  constructor(
    private rddeviceService: RddeviceService,
    private registrarService: RegistrarService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit(): void {
    this.aadharBioNum = this.route.snapshot.paramMap.get('aadharNumber');
    this.select += '<option value="0">Select</option>';
    for (let i = 1; i <= 100; i++) {
      this.select += `<option value="${i}">${i}</option>`;
    }
  }

  reset(): void {
    this.txtWadh = '';
    this.txtDeviceInfo = '';
    this.txtPidOptions = '';
    this.txtPidData = '';
    this.ddlAVDM = '';
    this.Timeout = '';
    this.Icount = '';
    this.Fcount = '';
    this.Itype = '';
    this.Ptype = '';
    this.Ftype = '';
    this.Dtype = '';
  }

  discoverAvdm() {
    this.rddeviceService.discoverAvdm().subscribe(
      (data) => {
        if (data !== null) {
          this.confirmationService.alert(
            'RDSERVICE discovered successfully',
            'success',
          );
        }
      },
      (error) => {
        console.error('Error discovering RDSERVICE:', error);
      },
    );
  }

  deviceInfoAvdm() {
    const res = this.rddeviceService.getDeviceInfo();
  }

  captureData() {
    this.captureres = this.rddeviceService.captureAvdm();
    console.log(this.captureres, 'CAPTURE DATA');
    if (this.captureres !== null) {
      this.confirmationService
        .confirmHealthId('success', 'Fingerprint captured successfully')
        .subscribe((res) => {
          if (res) {
            if (this.aadharBioNum !== null && this.aadharBioNum !== undefined) {
              this.router.navigate(['/registrar/registration/']);
              this.showProgressBar = true;
              this.generateAbha();
            } else {
              this.rddeviceService.capturePID = this.captureres;
              this.router.navigate(['/registrar/registration/']);
            }
          }
        });
    }
  }

  generateAbha() {
    const reqObj = {
      aadhaar: this.aadharBioNum,
      bioType: 'FMR',
      pid: this.captureres,
    };
    this.registrarService
      .generateABHAForBiometric(reqObj)
      .subscribe((res: any) => {
        if (res.statusCode === 200 && Object.keys(res.data).length > 0) {
          this.transactionId = res.data.txnId;
          this.generateMobileOTPForBio();
        } else {
          this.showProgressBar = false;
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      });
  }

  generateMobileOTPForBio() {
    const dialogRefMobile = this.dialog.open(
      GenerateMobileOtpGenerationComponent,
      {
        height: '250px',
        width: '420px',
        disableClose: true,
        data: { transactionId: this.transactionId, bioValue: true },
      },
    );
    dialogRefMobile.afterClosed().subscribe((response) => {
      if (response !== undefined && response !== null) {
        this.transactionId = response;
        this.posthealthIDButtonCall();
      }
    });
  }

  posthealthIDButtonCall() {
    const reqObj = {
      txnId: this.transactionId,
      createdBy: this.sessionstorage.getItem('userName'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
    };
    this.registrarService.generateHealthIdWithUID(reqObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.registrarService.abhaGenerateData = res.data;
          this.registrarService.aadharNumberNew = this.aadharBioNum;
          this.registrarService.getabhaDetail(true);
          const dialogRefSuccess = this.dialog.open(
            HealthIdOtpSuccessComponent,
            {
              height: '300px',
              width: '420px',
              disableClose: true,
              data: { res, generateHealthIDCardBio: true },
            },
          );
          dialogRefSuccess.afterClosed().subscribe((result) => {
            const dat = {
              healthIdNumber: res.data.healthIdNumber,
            };
          });
        } else {
          this.showProgressBar = false;
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      (err) => {
        this.showProgressBar = false;
        this.confirmationService.alert(
          'Issue In Getting Beneficiary ABHA Details',
          'error',
        );
      },
    );
  }
}
