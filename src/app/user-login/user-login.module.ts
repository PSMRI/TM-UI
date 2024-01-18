import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { ServiceComponent } from './service/service.component';
import { MaterialModule } from '../app-modules/core/material.module';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [LoginComponent, ServiceComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    MatIconModule,
  ],
  exports: [LoginComponent, ServiceComponent],
})
export class UserLoginModule {}
