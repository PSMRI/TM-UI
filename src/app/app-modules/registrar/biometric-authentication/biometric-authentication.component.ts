import { Component, OnInit } from '@angular/core';
import { RegistrarService } from '../shared/services/registrar.service';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfirmationService } from '../../core/services';

@Component({
    selector: 'app-biometric-authentication',
    templateUrl: './biometric-authentication.component.html',
    styleUrls: ['./biometric-authentication.component.css'],
    standalone: false
})
export class BiometricAuthenticationComponent {
  enableImage = false;
  messageInfo: any;

  constructor(
    public mdDialogRef: MatDialogRef<BiometricAuthenticationComponent>,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
  ) {}

  connectDevice() {
    this.enableImage = true;
    this.messageInfo = 'Please wait while connecting to the device';
    const pidValue = 'P';
    this.registrarService.getBiometricData(pidValue).subscribe(
      (res: any) => {
        this.messageInfo =
          'Please place your finger on the device to authenticate';
        if (res !== undefined && res !== null && res.statusCode === 200) {
          console.log('DATA STATUS', res);
          this.enableImage = true;
          this.messageInfo = 'Fingerprint captured successfully';
        } else if (res.statusCode !== 200) {
          this.enableImage = true;
          this.messageInfo = 'Issue in capturing fingerprint';
        } else {
          this.enableImage = true;
          this.messageInfo = 'Issue in connecting with device';
        }
      },
      (err: any) => {
        this.enableImage = false;
        this.confirmationService.alert('Capture timed out', err.error);
      },
    );
  }

  closeDialog() {
    this.mdDialogRef.close();
    this.enableImage = false;
  }
}
