import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { WorkareaComponent } from './workarea.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../shared/services';
import { IdrsscoreService } from '../shared/services/idrsscore.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { RegistrarService } from '../../registrar/shared/services/registrar.service';
import { HealthIdDisplayModalComponent } from '../../core/components/health-id-display-modal/health-id-display-modal.component';
import { OpenPreviousVisitDetailsComponent } from '../../core/components/open-previous-visit-details/open-previous-visit-details.component';
import { SchedulerComponent } from '../scheduler/scheduler.component';
import { SpecialistLoginComponent } from '../../core/components/specialist-login/specialist-login.component';

/**
 * WorkareaComponent is ~4k lines, so these tests exercise the class with an
 * empty template and fully mocked collaborators. Tests are grouped in the
 * same order as the component's methods.
 */
describe('WorkareaComponent', () => {
  let fixture: ComponentFixture<WorkareaComponent>;
  let component: WorkareaComponent;
  let store: Record<string, any>;
  let router: jasmine.SpyObj<Router>;
  let confirmation: jasmine.SpyObj<ConfirmationService>;
  let nurse: any;
  let doctor: any;
  let masterdata: any;
  let idrs: any;
  let registrar: jasmine.SpyObj<RegistrarService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let storage: jasmine.SpyObj<SessionStorageService>;
  let beneficiary$: BehaviorSubject<any>;
  let visitMaster$: BehaviorSubject<any>;
  let lang$: BehaviorSubject<any>;
  const fb = new FormBuilder();

  const LANG: any = {
    common: {
      scheduleforTM: 'Schedule for',
      submit: 'Submit',
      update: 'Update',
      Kindlyuploadthefiles: 'Kindly upload the files',
      doYouWantToLinkCareContext: 'Link care context?',
    },
    alerts: {
      info: {
        proceedFurther: 'Select visit category',
        datafillSuccessfully: 'Saved',
        mandatoryFields: 'Mandatory fields',
        navigateFurtherAlert: 'Leave page?',
      },
    },
    issueInGettingBeneficiaryABHADetails: 'ABHA issue',
    pleaseSelectVisualAcuityTestInInvestigation: 'Select visual acuity',
    provideSwyMedLoginDetailsToStartTC: 'Provide login?',
    loginManuallyThroughSwyMed: 'Login manually',
    errorInFetchingMMUInvestigationDetails: 'MMU error',
  };

  const dialogClosingWith = (result: any) =>
    ({ afterClosed: () => of(result) }) as any;

  beforeEach(async () => {
    store = {
      designation: 'Doctor',
      serviceName: 'TM',
      beneficiaryRegID: '1001',
      visitID: '3003',
      visitCode: '4004',
      providerServiceID: '13',
      serviceLineDetails: JSON.stringify({ vanID: 61, parkingPlaceID: 246 }),
    };
    beneficiary$ = new BehaviorSubject<any>(null);
    visitMaster$ = new BehaviorSubject<any>(null);
    lang$ = new BehaviorSubject<any>(LANG);

    router = jasmine.createSpyObj('Router', ['navigate']);
    confirmation = jasmine.createSpyObj('ConfirmationService', [
      'alert',
      'confirm',
      'notify',
    ]);
    nurse = {
      ncdTemp$: of(false),
      enableLAssessment$: of(false),
      enableProvisionalDiag$: of(false),
      fileData: undefined,
      ...jasmine.createSpyObj('NurseService', [
        'clearNCDTemp',
        'clearEnableLAssessment',
        'clearNCDScreeningProvision',
        'setLMPForFetosenseTest',
      ]),
    };
    doctor = {
      enableVitalsUpdateButton$: of(false),
      ...jasmine.createSpyObj('DoctorService', [
        'checkUsersignatureExist',
        'postGeneralCaseRecordInvestigation',
        'clearCache',
        'invokeSwymedCallSpecialist',
        'updateTCStartTime',
        'getMMUData',
      ]),
    };
    doctor.checkUsersignatureExist.and.returnValue(of({ statusCode: 200, data: null }));
    masterdata = {
      visitDetailMasterData$: visitMaster$.asObservable(),
      ...jasmine.createSpyObj('MasterdataService', [
        'reset',
        'getVisitDetailMasterData',
        'getNurseMasterData',
        'getDoctorMasterData',
      ]),
    };
    idrs = {
      rBSPresentFlag$: of(0),
      visualAcuityPresentFlag$: of(0),
      heamoglobinPresentFlag$: of(0),
      diabetesSelectedFlag$: of(0),
      VisualAcuityTestMandatoryFlag$: of(0),
      visualAcuityTestInMMU: 0,
    };
    registrar = jasmine.createSpyObj('RegistrarService', ['getHealthIdDetails']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);
    storage = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
      'removeItem',
    ]);
    storage.getItem.and.callFake((k: string) => store[k] ?? null);
    storage.removeItem.and.callFake((k: string) => delete store[k]);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [WorkareaComponent],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { attendant: 'doctor' } } },
        },
        { provide: MasterdataService, useValue: masterdata },
        { provide: NurseService, useValue: nurse },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: DoctorService, useValue: doctor },
        {
          provide: HttpServiceService,
          useValue: { currentLangugae$: lang$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: beneficiary$.asObservable() },
        },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: IdrsscoreService, useValue: idrs },
        { provide: RegistrarService, useValue: registrar },
        { provide: SessionStorageService, useValue: storage },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(WorkareaComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(WorkareaComponent);
    component = fixture.componentInstance;
    component.current_language_set = LANG;
    component.patientMedicalForm = fb.group({});
    spyOn(console, 'log');
  });

  // ---------------------------------------------------------------------
  // Batch 1: language, navigation, small helpers, TC / scheduler
  // ---------------------------------------------------------------------

  describe('setValues', () => {
    beforeEach(() => (component.serviceType = 'TM'));

    it('should set schedule button text', () => {
      component.setValues();
      expect(component.schedulerButton).toBe('Schedule for TM');
    });

    it('should keep the "View schedule" label once a slot is booked', () => {
      component.schedulerButton = 'View TM Schedule';
      component.setValues();
      expect(component.schedulerButton).toBe('View TM Schedule');
    });

    it('doctor (flag 1) should get a submit button', () => {
      component.doctorFlag = 1;
      component.setValues();
      expect(component.isSpecialist).toBeFalse();
      expect(component.isDoctorSave).toBeTrue();
      expect(component.doctorSaveAndTCSave).toBe('Submit');
    });

    it('doctor (other flag) should get an update button', () => {
      component.doctorFlag = 2;
      component.setValues();
      expect(component.isDoctorUpdate).toBeTrue();
      expect(component.doctorUpdateAndTCSubmit).toBe('Update');
    });

    describe('as TC specialist', () => {
      beforeEach(() => (component.attendant = 'tcspecialist'));

      it('doctor 1 / specialist 1 should submit', () => {
        component.doctorFlag = 1;
        component.specialistFlag = 1;
        component.setValues();
        expect(component.isSpecialist).toBeTrue();
        expect(component.isDoctorSave).toBeTrue();
        expect(component.doctorSaveAndTCSave).toBe('Submit');
      });

      it('doctor 1 / specialist 3 should update', () => {
        component.doctorFlag = 1;
        component.specialistFlag = 3;
        component.setValues();
        expect(component.isDoctorUpdate).toBeTrue();
        expect(component.doctorUpdateAndTCSubmit).toBe('Update');
      });

      it('doctor 9 / specialist 1 should update with submit label', () => {
        component.doctorFlag = 9;
        component.specialistFlag = 1;
        component.setValues();
        expect(component.isDoctorUpdate).toBeTrue();
        expect(component.doctorUpdateAndTCSubmit).toBe('Submit');
      });

      it('doctor 9 / specialist 3 should update with update label', () => {
        component.doctorFlag = 9;
        component.specialistFlag = 3;
        component.setValues();
        expect(component.doctorUpdateAndTCSubmit).toBe('Update');
      });
    });
  });

  describe('assignSelectedLanguage / ngDoCheck', () => {
    it('should load the language and apply values', () => {
      component.current_language_set = undefined;
      spyOn(component, 'setValues');
      component.ngDoCheck();
      expect(component.current_language_set).toBe(LANG);
      expect(component.setValues).toHaveBeenCalled();
    });

    it('should skip setValues when no language is loaded', () => {
      lang$.next(null);
      spyOn(component, 'setValues');
      component.assignSelectedLanguage();
      expect(component.setValues).not.toHaveBeenCalled();
    });
  });

  describe('checkMandatory', () => {
    it('should alert when no visit category is selected', () => {
      component.visitCategory = null;
      component.checkMandatory();
      expect(confirmation.alert).toHaveBeenCalledWith('Select visit category');
    });

    it('should alert and clear pending file uploads', () => {
      component.visitCategory = 'ANC';
      nurse.fileData = [{ f: 1 }];
      component.checkMandatory();
      expect(confirmation.alert).toHaveBeenCalledWith('Kindly upload the files');
      expect(nurse.fileData).toBeNull();
    });

    it('should not alert when category set and no files pending', () => {
      component.visitCategory = 'ANC';
      nurse.fileData = [];
      component.checkMandatory();
      expect(confirmation.alert).not.toHaveBeenCalled();
    });
  });

  it('hideAll should remove section forms and hide everything', () => {
    component.patientMedicalForm = fb.group({
      patientVisitForm: fb.group({}),
      patientHistoryForm: fb.group({}),
      patientVitalsForm: fb.group({}),
      idrsScreeningForm: fb.group({}),
    });
    component.showVitals = true;
    component.showRefer = true;
    component.hideAll();
    expect(Object.keys(component.patientMedicalForm.controls)).toEqual([
      'patientVisitForm',
    ]);
    expect(component.showVitals).toBeFalse();
    expect(component.showRefer).toBeFalse();
  });

  describe('submitPatientMedicalDetailsForm', () => {
    const cases: [string, keyof WorkareaComponent][] = [
      ['Cancer Screening', 'submitNurseCancerVisitDetails'],
      ['NCD screening', 'submitNurseNCDScreeningVisitDetails'],
      ['General OPD (QC)', 'submitNurseQuickConsultVisitDetails'],
      ['ANC', 'submitNurseANCVisitDetails'],
      ['PNC', 'submitPatientMedicalDetailsPNC'],
      ['General OPD', 'submitNurseGeneralOPDVisitDetails'],
      ['NCD care', 'submitNurseNCDcareVisitDetails'],
      ['COVID-19 Screening', 'submitNurseCovidVisitDetails'],
    ];
    cases.forEach(([category, method]) => {
      it(`should dispatch ${category} to ${String(method)}`, () => {
        component.visitCategory = category;
        const spy = spyOn(component, method as any);
        component.submitPatientMedicalDetailsForm('form');
        expect(spy).toHaveBeenCalledWith('form');
        expect(component.disableSubmitButton).toBeTrue();
        expect(component.showProgressBar).toBeTrue();
      });
    });
  });

  describe('navigation and session cleanup', () => {
    it('navigateToNurseWorklist should clear beneficiary data', () => {
      component.navigateToNurseWorklist();
      ['beneficiaryGender', 'beneficiaryRegID', 'beneficiaryID', 'benFlowID'].forEach(
        (k) => expect(storage.removeItem).toHaveBeenCalledWith(k),
      );
      expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/nurse-worklist']);
    });

    it('navigateToDoctorWorklist should clear visit data and tests', () => {
      component.testsPrescribed = { laboratoryList: [] };
      component.navigateToDoctorWorklist();
      expect(component.testsPrescribed).toBeNull();
      ['visitCode', 'visitCategory', 'doctorFlag', 'nurseFlag', 'pharmacist_flag'].forEach(
        (k) => expect(storage.removeItem).toHaveBeenCalledWith(k),
      );
      expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/doctor-worklist']);
    });

    it('navigateToSpecialistWorklist should go to tcspecialist worklist', () => {
      component.navigateToSpecialistWorklist();
      expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/tcspecialist-worklist']);
    });

    it('basedOnRoleNavigateToWorklist should pick by role', () => {
      component.isSpecialist = true;
      component.basedOnRoleNavigateToWorklist();
      expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/tcspecialist-worklist']);
      component.isSpecialist = false;
      component.basedOnRoleNavigateToWorklist();
      expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/doctor-worklist']);
    });
  });

  it('checkForPrescribedTests should compute tests from the investigation form', () => {
    const inv = fb.group({ labTest: [[]] });
    component.patientMedicalForm = fb.group({
      patientCaseRecordForm: fb.group({ generalDoctorInvestigationForm: inv }),
    });
    doctor.postGeneralCaseRecordInvestigation.and.returnValue({ laboratoryList: [1] });
    component.checkForPrescribedTests({ t: 1 });
    expect(doctor.postGeneralCaseRecordInvestigation).toHaveBeenCalledWith(inv, { t: 1 });
    expect(component.testsPrescribed).toEqual({ laboratoryList: [1] });
  });

  it('resetSpinnerandEnableTheSubmitButton should reset flags', () => {
    component.disableSubmitButton = true;
    component.showProgressBar = true;
    component.resetSpinnerandEnableTheSubmitButton();
    expect(component.disableSubmitButton).toBeFalse();
    expect(component.showProgressBar).toBeFalse();
  });

  describe('getImageCoordinates', () => {
    const examForm = (images: any[]) =>
      fb.group({
        patientExaminationForm: fb.group({
          oralExaminationForm: fb.group({ image: [images[0]] }),
          abdominalExaminationForm: fb.group({ image: [images[1]] }),
          gynecologicalExaminationForm: fb.group({ image: [images[2]] }),
          breastExaminationForm: fb.group({ image: [images[3]] }),
        }),
      });

    it('should collect annotated images with van and parking place', () => {
      const result = component.getImageCoordinates(
        examForm([{ id: 1 }, null, { id: 3 }, { id: 4 }]),
      );
      expect(result).toEqual([
        { id: 1, vanID: 61, parkingPlaceID: 246 },
        { id: 3, vanID: 61, parkingPlaceID: 246 },
        { id: 4, vanID: 61, parkingPlaceID: 246 },
      ]);
    });

    it('should return an empty list when nothing is annotated', () => {
      expect(component.getImageCoordinates(examForm([null, null, null, null]))).toEqual([]);
    });
  });

  describe('visualAcuityTestValidation', () => {
    const caseRecord = (labTest: any) =>
      fb.group({ generalDoctorInvestigationForm: fb.group({ labTest: [labTest] }) });

    beforeEach(() => {
      component.visualAcuityPresent = 1;
      component.visualAcuityMandatory = 1;
      idrs.visualAcuityTestInMMU = 1;
    });

    it('should require the visual acuity test when missing', () => {
      const required: any[] = [];
      component.visualAcuityTestValidation(caseRecord([{ procedureName: 'RBS' }]), required);
      expect(required).toEqual(['Select visual acuity']);
    });

    it('should pass when the test is prescribed (case-insensitive)', () => {
      const required: any[] = [];
      component.visualAcuityTestValidation(
        caseRecord([{ procedureName: environment.visualAcuityTest.toUpperCase() }]),
        required,
      );
      expect(required).toEqual([]);
    });

    it('should require the test when lab list is empty', () => {
      const required: any[] = [];
      component.visualAcuityTestValidation(caseRecord(null), required);
      expect(required.length).toBe(1);
    });

    it('should skip validation when not mandatory', () => {
      component.visualAcuityMandatory = 0;
      const required: any[] = [];
      component.visualAcuityTestValidation(caseRecord([]), required);
      expect(required).toEqual([]);
    });
  });

  describe('care context linking', () => {
    beforeEach(() => spyOn(component, 'getHealthIDDetails'));

    it('specialist with prescribed tests should alert and go to specialist worklist', () => {
      component.testsPrescribed = { laboratoryList: [{}] };
      spyOn(component, 'navigateToSpecialistWorklist');
      component.linkCareContextBasedOnSpecialistScheduled();
      expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
      expect(component.navigateToSpecialistWorklist).toHaveBeenCalled();
    });

    it('specialist without tests should offer to link care context', () => {
      component.testsPrescribed = null;
      component.linkCareContextBasedOnSpecialistScheduled();
      expect(component.getHealthIDDetails).toHaveBeenCalledWith('Saved');
    });

    it('doctor with a TC schedule should go back to worklist', () => {
      component.testsPrescribed = { laboratoryList: [] };
      component.schedulerData = { slot: 1 };
      spyOn(component, 'navigateToDoctorWorklist');
      component.linkCareContextBasedOnTestsPrescribed();
      expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
    });

    it('doctor with no tests and no schedule should offer linking', () => {
      component.testsPrescribed = { laboratoryList: [] };
      component.schedulerData = null;
      component.linkCareContextBasedOnTestsPrescribed();
      expect(component.getHealthIDDetails).toHaveBeenCalledWith('Saved');
    });
  });

  describe('getHealthIDDetails / fetchHealthIDDetailsOnConfirmation', () => {
    beforeEach(() => {
      component.beneficiary = { beneficiaryID: '2002' };
      component.beneficiaryRegID = '1001';
    });

    it('should fetch ABHA details when user confirms', () => {
      confirmation.confirm.and.returnValue(of(true));
      spyOn(component, 'fetchHealthIDDetailsOnConfirmation');
      component.getHealthIDDetails('Saved');
      expect(confirmation.confirm).toHaveBeenCalledWith('info', 'Saved. Link care context?');
      expect(component.fetchHealthIDDetailsOnConfirmation).toHaveBeenCalled();
    });

    it('should navigate by role when user declines', () => {
      confirmation.confirm.and.returnValue(of(false));
      spyOn(component, 'basedOnRoleNavigateToWorklist');
      component.getHealthIDDetails('Saved');
      expect(component.basedOnRoleNavigateToWorklist).toHaveBeenCalled();
    });

    it('should open the ABHA dialog and navigate after it closes', () => {
      registrar.getHealthIdDetails.and.returnValue(of({ statusCode: 200, data: [] }));
      dialog.open.and.returnValue(dialogClosingWith(null));
      spyOn(component, 'basedOnRoleNavigateToWorklist');
      component.fetchHealthIDDetailsOnConfirmation();
      expect(registrar.getHealthIdDetails).toHaveBeenCalledWith({
        beneficiaryID: '2002',
        beneficiaryRegID: '1001',
      });
      expect(dialog.open).toHaveBeenCalledWith(
        HealthIdDisplayModalComponent,
        jasmine.objectContaining({
          data: jasmine.objectContaining({ healthIDMapping: true, visitCode: '4004' }),
        }),
      );
      expect(component.basedOnRoleNavigateToWorklist).toHaveBeenCalled();
    });

    it('should alert and return to nurse worklist on a failed response', () => {
      registrar.getHealthIdDetails.and.returnValue(of({ statusCode: 5000 }));
      component.fetchHealthIDDetailsOnConfirmation();
      expect(confirmation.alert).toHaveBeenCalledWith('ABHA issue', 'error');
      expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/nurse-worklist']);
    });

    it('should alert and return to nurse worklist on API error', () => {
      registrar.getHealthIdDetails.and.returnValue(throwError(() => 'down'));
      component.fetchHealthIDDetailsOnConfirmation();
      expect(confirmation.alert).toHaveBeenCalledWith('ABHA issue', 'error');
      expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/nurse-worklist']);
    });
  });

  describe('section update triggers', () => {
    it('idrsChange should toggle IDRS update', () => {
      component.idrsChange(false);
      expect(component.enableIDRSUpdate).toBeFalse();
    });

    it('vitals / examination / ANC / PNC update modes', () => {
      component.updatePatientVitals();
      component.updatePatientExamination();
      component.updatePatientANC();
      component.updatePatientPNC();
      expect(String(component.vitalsMode)).toBe('update');
      expect(String(component.examinationMode)).toBe('update');
      expect(String(component.ancMode)).toBe('update');
      expect(String(component.pncMode)).toBe('update');
    });

    it('updatePatientHistory should skip validation for cancer screening', () => {
      component.visitCategory = 'Cancer Screening';
      component.updatePatientHistory();
      expect(String(component.historyMode)).toBe('update');
    });

    it('updatePatientHistory should validate NCD screening history', () => {
      component.visitCategory = 'NCD screening';
      spyOn(component, 'checkNCDScreeningHistory').and.returnValue(0);
      component.updatePatientHistory();
      expect(component.historyMode).toBeUndefined();
    });

    it('updatePatientHistory should validate obstetric history for others', () => {
      component.visitCategory = 'ANC';
      spyOn(component, 'checkPastObstericHistory').and.returnValue(1);
      component.updatePatientHistory();
      expect(String(component.historyMode)).toBe('update');
    });

    it('updatePatientNcdScreening should notify for required fields except Hypertension', () => {
      component.patientMedicalForm = fb.group({
        idrsScreeningForm: fb.group({ requiredList: [['Hypertension', 'Diabetes']] }),
      });
      component.updatePatientNcdScreening();
      expect(confirmation.notify).toHaveBeenCalledWith('Mandatory fields', ['Diabetes']);
      expect(component.ncdScreeningMode).toBeUndefined();
    });

    it('updatePatientNcdScreening should update when nothing is required', () => {
      component.patientMedicalForm = fb.group({
        idrsScreeningForm: fb.group({ requiredList: [['Hypertension']] }),
      });
      component.updatePatientNcdScreening();
      expect(String(component.ncdScreeningMode)).toBe('update');
    });

    it('updatePatientNcdScreening should update when requiredList is null', () => {
      component.patientMedicalForm = fb.group({
        idrsScreeningForm: fb.group({ requiredList: [null] }),
      });
      component.updatePatientNcdScreening();
      expect(String(component.ncdScreeningMode)).toBe('update');
    });
  });

  it('ngOnDestroy should unsubscribe and reset caches', () => {
    const sub = jasmine.createSpyObj('sub', ['unsubscribe']);
    component.visitDetailMasterDataSubscription = sub;
    component.beneficiaryDetailsSubscription = sub;
    component.ngOnDestroy();
    expect(sub.unsubscribe).toHaveBeenCalledTimes(2);
    expect(doctor.clearCache).toHaveBeenCalled();
    expect(masterdata.reset).toHaveBeenCalled();
  });

  describe('master data and beneficiary', () => {
    it('getBeneficiaryDetails should capture beneficiary and age', () => {
      component.getBeneficiaryDetails();
      beneficiary$.next({ beneficiaryID: '2', ageVal: 30 });
      expect(component.beneficiary.beneficiaryID).toBe('2');
      expect(component.beneficiaryAge).toBe(30);
    });

    it('getBeneficiaryDetails should ignore null emissions', () => {
      component.getBeneficiaryDetails();
      beneficiary$.next(null);
      expect(component.beneficiary).toBeUndefined();
    });

    it('getVisitReasonAndCategory should load nurse and doctor master data', () => {
      component.visitCategory = 'ANC';
      component.getVisitReasonAndCategory();
      expect(masterdata.getVisitDetailMasterData).toHaveBeenCalled();
      visitMaster$.next({ visitCategories: [{ visitCategory: 'ANC', visitCategoryID: 4 }] });
      expect(masterdata.getNurseMasterData).toHaveBeenCalledWith(4, '13');
      expect(masterdata.getDoctorMasterData).toHaveBeenCalledWith(4, '13');
    });

    it('getVisitReasonAndCategory should not load master data without category', () => {
      component.visitCategory = null;
      component.getVisitReasonAndCategory();
      visitMaster$.next({ visitCategories: [] });
      expect(masterdata.getNurseMasterData).not.toHaveBeenCalled();
    });

    it('getVisitCategoryID should resolve id or null', () => {
      component.visitCategoryList = [{ visitCategory: 'PNC', visitCategoryID: 5 }];
      expect(component.getVisitCategoryID('PNC')).toBe(5);
      expect(component.getVisitCategoryID('ANC')).toBeNull();
      component.visitCategoryList = undefined;
      expect(component.getVisitCategoryID('PNC')).toBeNull();
    });

    it('getNurseMasterData / getDoctorMasterData should skip unknown categories', () => {
      component.visitCategoryList = [];
      component.getNurseMasterData('X');
      component.getDoctorMasterData('X');
      expect(masterdata.getNurseMasterData).not.toHaveBeenCalled();
      expect(masterdata.getDoctorMasterData).not.toHaveBeenCalled();
    });
  });

  describe('form value watchers', () => {
    it('getPregnancyStatus should track pregnancy status', () => {
      component.patientMedicalForm = fb.group({
        patientVisitForm: fb.group({
          patientVisitDetailsForm: fb.group({ pregnancyStatus: null }),
        }),
      });
      component.getPregnancyStatus();
      component.patientMedicalForm
        .get('patientVisitForm.patientVisitDetailsForm')
        ?.patchValue({ pregnancyStatus: 'Yes' });
      expect(component.pregnancyStatus).toBe('Yes');
      component.patientMedicalForm
        .get('patientVisitForm.patientVisitDetailsForm')
        ?.patchValue({ pregnancyStatus: '' });
      expect(component.pregnancyStatus).toBeNull();
    });

    it('patchGravidaValue should copy gravida > 1 to total pregnancies', () => {
      component.patientMedicalForm = fb.group({
        patientANCForm: fb.group({ obstetricFormulaForm: fb.group({ gravida_G: null }) }),
        patientHistoryForm: fb.group({ pastObstericHistory: fb.group({ totalNoOfPreg: null }) }),
      });
      component.patchGravidaValue();
      const gravida = component.patientMedicalForm.get('patientANCForm.obstetricFormulaForm.gravida_G');
      const total = component.patientMedicalForm.get('patientHistoryForm.pastObstericHistory.totalNoOfPreg');
      gravida?.setValue(1);
      expect(total?.value).toBeNull();
      gravida?.setValue(3);
      expect(total?.value).toBe(3);
    });

    it('getCurrentVitals should track vitals form value', () => {
      component.patientMedicalForm = fb.group({ patientVitalsForm: fb.group({ weight: null }) });
      component.getCurrentVitals();
      component.patientMedicalForm.get('patientVitalsForm.weight')?.setValue(60);
      expect(component.currentVitals).toEqual({ weight: 60 });
    });

    it('patchCancerFindings should map examination observations', () => {
      const obs = (o: string) => fb.group({ observation: o });
      component.patientMedicalForm = fb.group({
        patientExaminationForm: fb.group({
          signsForm: obs('s'),
          oralExaminationForm: obs('o'),
          abdominalExaminationForm: obs('a'),
          gynecologicalExaminationForm: obs('g'),
        }),
      });
      component.patchCancerFindings();
      component.patientMedicalForm.get('patientExaminationForm.signsForm.observation')?.setValue('s2');
      expect(component.findings).toEqual({
        briefHistory: 's2',
        oralExamination: 'o',
        abdominalExamination: 'a',
        gynecologicalExamination: 'g',
      });
    });

    it('getANCDiagnosis should mirror ANC values into diagnosis form', () => {
      component.patientMedicalForm = fb.group({
        patientANCForm: fb.group({
          obstetricFormulaForm: fb.group({ gravida_G: null }),
          patientANCDetailsForm: fb.group({ lmpDate: null }),
        }),
        patientCaseRecordForm: fb.group({
          generalDiagnosisForm: fb.group({ gravida_G: null, lmpDate: null }),
        }),
      });
      component.getANCDiagnosis();
      component.patientMedicalForm.get('patientANCForm.obstetricFormulaForm.gravida_G')?.setValue(2);
      component.patientMedicalForm.get('patientANCForm.patientANCDetailsForm.lmpDate')?.setValue('d');
      expect(component.patientMedicalForm.get('patientCaseRecordForm.generalDiagnosisForm')?.value).toEqual({
        gravida_G: 2,
        lmpDate: 'd',
      });
    });

    it('getPrimeGravidaStatus should track primiGravida', () => {
      component.patientMedicalForm = fb.group({
        patientANCForm: fb.group({ patientANCDetailsForm: fb.group({ primiGravida: null }) }),
      });
      component.getPrimeGravidaStatus();
      component.patientMedicalForm.get('patientANCForm.patientANCDetailsForm.primiGravida')?.setValue(true);
      expect(component.primeGravidaStatus).toBeTrue();
    });

    it('patchLMPDate should copy LMP to menstrual history and fetosense', () => {
      component.patientMedicalForm = fb.group({
        patientANCForm: fb.group({ patientANCDetailsForm: fb.group({ lmpDate: null }) }),
        patientHistoryForm: fb.group({ menstrualHistory: fb.group({ lMPDate: null }) }),
      });
      component.patchLMPDate();
      component.patientMedicalForm.get('patientANCForm.patientANCDetailsForm.lmpDate')?.setValue('2026-01-01');
      const lmp = component.patientMedicalForm.get('patientHistoryForm.menstrualHistory.lMPDate')?.value;
      expect(lmp).toEqual(new Date('2026-01-01'));
      expect(nurse.setLMPForFetosenseTest).toHaveBeenCalledWith(lmp);
    });

    it('patchGeneralFinding should track chief complaints', () => {
      component.patientMedicalForm = fb.group({
        patientVisitForm: fb.group({ patientChiefComplaintsForm: fb.group({ complaints: [[]] }) }),
      });
      component.patchGeneralFinding();
      component.patientMedicalForm.get('patientVisitForm.patientChiefComplaintsForm.complaints')?.setValue([1]);
      expect(component.findings).toEqual({ complaints: [1] });
    });
  });

  it('sideNavModeChange should toggle the side nav', () => {
    const sidenav = jasmine.createSpyObj('sidenav', ['toggle']);
    component.sideNavModeChange(sidenav);
    expect(['over', 'side']).toContain(sidenav.mode);
    expect(sidenav.toggle).toHaveBeenCalled();
  });

  describe('canDeactivate', () => {
    afterEach(() => sessionStorage.removeItem('wa-test'));

    it('should allow leaving when nothing changed', () => {
      let result: any;
      component.canDeactivate().subscribe((r) => (result = r));
      expect(result).toBeTrue();
      expect(confirmation.confirm).not.toHaveBeenCalled();
    });

    it('should confirm when the form is dirty', () => {
      sessionStorage.setItem('wa-test', '1');
      component.patientMedicalForm.markAsDirty();
      confirmation.confirm.and.returnValue(of(false));
      let result: any;
      component.canDeactivate().subscribe((r) => (result = r));
      expect(confirmation.confirm).toHaveBeenCalledWith('info', 'Leave page?', 'Yes', 'No');
      expect(result).toBeFalse();
    });

    it('should confirm when vitals have unsaved updates', () => {
      component.enableUpdateButtonInVitals = true;
      confirmation.confirm.and.returnValue(of(true));
      component.canDeactivate().subscribe();
      expect(confirmation.confirm).toHaveBeenCalled();
    });
  });

  it('preventSubmitOnEnter should prevent default', () => {
    const e = jasmine.createSpyObj('event', ['preventDefault']);
    component.preventSubmitOnEnter(e);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  describe('openScheduler', () => {
    beforeEach(() => (component.serviceType = 'TM'));

    it('should store the booked slot', () => {
      dialog.open.and.returnValue(dialogClosingWith({ tmSlot: { id: 1 } }));
      component.openScheduler();
      expect(dialog.open).toHaveBeenCalledWith(SchedulerComponent, jasmine.objectContaining({ width: '900px' }));
      expect(component.schedulerData).toEqual({ id: 1 });
      expect(component.schedulerButton).toBe('View TM Schedule');
    });

    it('should clear a previous booking', () => {
      component.schedulerData = { id: 1 };
      dialog.open.and.returnValue(dialogClosingWith({ clear: true }));
      component.openScheduler();
      expect(component.schedulerData).toBeNull();
      expect(component.schedulerFormData).toBeNull();
      expect(component.schedulerButton).toBe('Schedule for TM');
    });

    it('should keep state when the dialog is dismissed', () => {
      component.schedulerData = { id: 1 };
      dialog.open.and.returnValue(dialogClosingWith(undefined));
      component.openScheduler();
      expect(component.schedulerData).toEqual({ id: 1 });
    });
  });

  describe('teleconsultation', () => {
    // Success path sets window.location.href and cannot run in Karma.
    it('startTC should alert on a failed response', () => {
      doctor.invokeSwymedCallSpecialist.and.returnValue(of({ statusCode: 5000, errorMessage: 'no slot' }));
      component.startTC();
      expect(confirmation.alert).toHaveBeenCalledWith('no slot', 'error');
    });

    it('startTC should alert on API error', () => {
      doctor.invokeSwymedCallSpecialist.and.returnValue(throwError(() => 'down'));
      component.startTC();
      expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
    });

    it('updateTCStartTime should send ben and visit code', () => {
      doctor.updateTCStartTime.and.returnValue(of({}));
      component.updateTCStartTime();
      expect(doctor.updateTCStartTime).toHaveBeenCalledWith({ benRegID: '1001', visitCode: '4004' });
    });

    it('provideLogin should open the snackbar on yes', () => {
      confirmation.confirm.and.returnValue(of(true));
      spyOn(component, 'openSnackBar');
      component.provideLogin();
      expect(component.openSnackBar).toHaveBeenCalled();
    });

    it('provideLogin should advise manual login on no', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.provideLogin();
      expect(confirmation.alert).toHaveBeenCalledWith('Login manually');
    });

    it('openSnackBar should start TC after dismissal', () => {
      snackBar.openFromComponent.and.returnValue({ afterDismissed: () => of({}) } as any);
      spyOn(component, 'startTC');
      component.openSnackBar();
      expect(snackBar.openFromComponent).toHaveBeenCalledWith(SpecialistLoginComponent, jasmine.any(Object));
      expect(component.startTC).toHaveBeenCalled();
    });
  });

  describe('getMMUInvestigationDetails', () => {
    beforeEach(() => {
      store['referredVisitCode'] = '9';
      store['referredVisitID'] = '8';
    });

    it('should request investigation data for the referred visit', () => {
      doctor.getMMUData.and.returnValue(of({ statusCode: 200, data: { data: { laboratoryList: [] } } }));
      component.getMMUInvestigationDetails();
      expect(doctor.getMMUData).toHaveBeenCalledWith({
        benRegID: '1001',
        visitCode: '9',
        benVisitID: '8',
        fetchMMUDataFor: 'Investigation',
      });
    });

    // NOTE: the RBS comparison never matches (lower-cased vs 'RBS Test'),
    // so any non-empty lab list sets diabetesSelected to 1.
    it('should set diabetesSelected for any non-empty lab list', () => {
      doctor.getMMUData.and.returnValue(
        of({ statusCode: 200, data: { data: { laboratoryList: [{ procedureName: 'RBS Test' }] } } }),
      );
      component.getMMUInvestigationDetails();
      expect(component.diabetesSelected).toBe(1);
    });

    it('should alert on failed response or error', () => {
      doctor.getMMUData.and.returnValue(of({ statusCode: 5000 }));
      component.getMMUInvestigationDetails();
      doctor.getMMUData.and.returnValue(throwError(() => 'x'));
      component.getMMUInvestigationDetails();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      expect(confirmation.alert).toHaveBeenCalledWith('MMU error', 'error');
    });

    it('should skip the request when referred ids are the string "undefined"', () => {
      store['referredVisitCode'] = 'undefined';
      component.getMMUInvestigationDetails();
      expect(doctor.getMMUData).not.toHaveBeenCalled();
    });
  });

  it('openBenPreviousisitDetails should open the previous visit dialog', () => {
    component.openBenPreviousisitDetails();
    expect(dialog.open).toHaveBeenCalledWith(
      OpenPreviousVisitDetailsComponent,
      jasmine.objectContaining({ data: { previous: true } }),
    );
  });

  // ---------------------------------------------------------------------
  // Batch 2: nurse submit flows
  // ---------------------------------------------------------------------

  describe('nurse submit flows', () => {
    const form = { medical: true };

    // [submit method, validator, nurse service method, expected extra args]
    const flows: [keyof WorkareaComponent, keyof WorkareaComponent, string, () => any[]][] = [
      ['submitNurseQuickConsultVisitDetails', 'checkNurseRequirements', 'postNurseGeneralQCVisitForm', () => [form, component.schedulerData]],
      ['submitNurseANCVisitDetails', 'checkNurseRequirements', 'postNurseANCVisitForm', () => [form, null, 'ANC', 28, component.schedulerData]],
      ['submitNurseNCDcareVisitDetails', 'checkNurseRequirements', 'postNurseNCDCareVisitForm', () => [form, 'ANC', component.beneficiary, component.schedulerData]],
      ['submitNurseCovidVisitDetails', 'checkNurseRequirements', 'postNurseCovidVisitForm', () => [form, 'ANC', component.beneficiary, component.schedulerData]],
      ['submitNurseNCDScreeningVisitDetails', 'checkNCDScreeningRequiredData', 'postNCDScreeningForm', () => [form, 'ANC', component.beneficiary, component.schedulerData]],
      ['submitPatientMedicalDetailsPNC', 'checkNurseRequirements', 'postNursePNCVisitForm', () => [form, 'ANC', component.beneficiary, component.schedulerData]],
      ['submitNurseGeneralOPDVisitDetails', 'checkNurseRequirements', 'postNurseGeneralOPDVisitForm', () => [form, 'ANC', component.beneficiary, component.schedulerData]],
    ];

    beforeEach(() => {
      component.visitCategory = 'ANC';
      component.beneficiary = { ageVal: 28 };
      component.schedulerData = { slot: 1 };
      component.disableSubmitButton = true;
      component.showProgressBar = true;
    });

    flows.forEach(([submit, validator, post, args]) => {
      describe(String(submit), () => {
        let validatorSpy: jasmine.Spy;

        beforeEach(() => {
          nurse[post] = jasmine.createSpy(post);
          validatorSpy = spyOn(component, validator as any).and.returnValue(true);
          spyOn(component, 'navigateToNurseWorklist');
        });

        it('should not submit when validation fails', () => {
          validatorSpy.and.returnValue(false);
          (component as any)[submit](form);
          expect(nurse[post]).not.toHaveBeenCalled();
        });

        it('should save, alert success and go to nurse worklist', () => {
          nurse[post].and.returnValue(of({ statusCode: 200, data: {} }));
          (component as any)[submit](form);
          expect(nurse[post]).toHaveBeenCalledWith(...args());
          expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
          expect(component.navigateToNurseWorklist).toHaveBeenCalled();
        });

        it('should alert the server message and re-enable submit on failure', () => {
          nurse[post].and.returnValue(of({ statusCode: 5000, errorMessage: 'bad data' }));
          (component as any)[submit](form);
          expect(confirmation.alert).toHaveBeenCalledWith('bad data', 'error');
          expect(component.disableSubmitButton).toBeFalse();
          expect(component.showProgressBar).toBeFalse();
          expect(component.navigateToNurseWorklist).not.toHaveBeenCalled();
        });

        it('should treat a 200 with null data as failure', () => {
          nurse[post].and.returnValue(of({ statusCode: 200, data: null, errorMessage: 'empty' }));
          (component as any)[submit](form);
          expect(confirmation.alert).toHaveBeenCalledWith('empty', 'error');
        });

        it('should alert and re-enable submit on API error', () => {
          nurse[post].and.returnValue(throwError(() => 'network'));
          (component as any)[submit](form);
          expect(confirmation.alert).toHaveBeenCalledWith('network', 'error');
          expect(component.disableSubmitButton).toBeFalse();
        });
      });
    });

    describe('submitNurseCancerVisitDetails', () => {
      beforeEach(() => {
        LANG.alerts.info.doctorVisit = 'Send to doctor?';
        nurse.postNurseCancerVisitForm = jasmine.createSpy('postNurseCancerVisitForm');
        spyOn(component, 'checkCancerRequiredData').and.returnValue(true);
        spyOn(component, 'getImageCoordinates').and.returnValue([{ x: 1 }]);
        spyOn(component, 'navigateToNurseWorklist');
      });

      it('should not submit when validation fails', () => {
        (component.checkCancerRequiredData as jasmine.Spy).and.returnValue(false);
        component.submitNurseCancerVisitDetails(form);
        expect(confirmation.confirm).not.toHaveBeenCalled();
      });

      it('should ask about doctor visit and post with the answer', () => {
        confirmation.confirm.and.returnValue(of(true));
        nurse.postNurseCancerVisitForm.and.returnValue(of({ statusCode: 200, data: {} }));
        component.submitNurseCancerVisitDetails(form);
        expect(confirmation.confirm).toHaveBeenCalledWith('info', 'Send to doctor?', 'Yes', 'No');
        expect(nurse.postNurseCancerVisitForm).toHaveBeenCalledWith(form, [{ x: 1 }], true, { slot: 1 });
        expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
        expect(component.navigateToNurseWorklist).toHaveBeenCalled();
        expect(component.showProgressBar).toBeFalse();
      });

      it('should post "not to doctor" when user answers No', () => {
        confirmation.confirm.and.returnValue(of(false));
        nurse.postNurseCancerVisitForm.and.returnValue(of({ statusCode: 200, data: {} }));
        component.submitNurseCancerVisitDetails(form);
        expect(nurse.postNurseCancerVisitForm.calls.mostRecent().args[2]).toBeFalse();
      });

      it('should not post when the confirm dialog is dismissed', () => {
        confirmation.confirm.and.returnValue(of(undefined as any));
        component.submitNurseCancerVisitDetails(form);
        expect(nurse.postNurseCancerVisitForm).not.toHaveBeenCalled();
      });

      it('should navigate and show info on status 9999', () => {
        confirmation.confirm.and.returnValue(of(true));
        nurse.postNurseCancerVisitForm.and.returnValue(of({ statusCode: 9999, errorMessage: 'queued' }));
        component.submitNurseCancerVisitDetails(form);
        expect(component.navigateToNurseWorklist).toHaveBeenCalled();
        expect(confirmation.alert).toHaveBeenCalledWith('queued', 'info');
      });

      it('should alert on failure and on error', () => {
        confirmation.confirm.and.returnValue(of(true));
        nurse.postNurseCancerVisitForm.and.returnValue(of({ statusCode: 5000, errorMessage: 'bad' }));
        component.submitNurseCancerVisitDetails(form);
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        nurse.postNurseCancerVisitForm.and.returnValue(throwError(() => 'down'));
        component.submitNurseCancerVisitDetails(form);
        expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
        expect(component.navigateToNurseWorklist).not.toHaveBeenCalled();
      });
    });
  });

  // ---------------------------------------------------------------------
  // Batch 3: doctor submit / update flows
  // ---------------------------------------------------------------------

  describe('doctor flows', () => {
    beforeEach(() => {
      component.beneficiaryRegID = '1001';
      component.visitID = '3003';
      component.schedulerData = null;
      component.doctorSignatureFlag = true;
      component.patientMedicalForm = fb.group({
        idrsScreeningForm: fb.group({ score: 1 }),
        patientCaseRecordForm: fb.group({
          generalDoctorInvestigationForm: fb.group({ labTest: [[]] }),
        }),
      });
      doctor.updateIDRSDetails = jasmine.createSpy('updateIDRSDetails').and.returnValue(of({}));
      spyOn(component, 'linkCareContextBasedOnTestsPrescribed');
      spyOn(component, 'linkCareContextBasedOnSpecialistScheduled');
      spyOn(component, 'getHealthIDDetails');
      spyOn(component, 'navigateToDoctorWorklist');
      spyOn(component, 'navigateToSpecialistWorklist');
    });

    describe('submitDoctorDiagnosisForm', () => {
      const cases: [string, keyof WorkareaComponent][] = [
        ['Cancer Screening', 'submitCancerDiagnosisForm'],
        ['General OPD (QC)', 'submitQuickConsultDiagnosisForm'],
        ['ANC', 'submitANCDiagnosisForm'],
        ['PNC', 'submitPNCDiagnosisForm'],
        ['General OPD', 'submitGeneralOPDDiagnosisForm'],
        ['NCD care', 'submitNCDCareDiagnosisForm'],
        ['COVID-19 Screening', 'submitCovidDiagnosisForm'],
        ['NCD screening', 'submitNCDScreeningDiagnosisForm'],
      ];
      cases.forEach(([category, method]) => {
        it(`should dispatch ${category} to ${String(method)}`, () => {
          component.visitCategory = category;
          const spy = spyOn(component, method as any);
          component.submitDoctorDiagnosisForm();
          expect(spy).toHaveBeenCalled();
          expect(component.disableSubmitButton).toBeTrue();
        });
      });
    });

    // [submit, validator, doctor service method]
    const flows: [keyof WorkareaComponent, keyof WorkareaComponent, string][] = [
      ['submitANCDiagnosisForm', 'checkNurseRequirements', 'postDoctorANCDetails'],
      ['submitNCDCareDiagnosisForm', 'checkNurseRequirements', 'postDoctorNCDCareDetails'],
      ['submitGeneralOPDDiagnosisForm', 'checkNurseRequirements', 'postDoctorGeneralOPDDetails'],
      ['submitPNCDiagnosisForm', 'checkNurseRequirements', 'postDoctorPNCDetails'],
      ['submitNCDScreeningDiagnosisForm', 'checkNCDScreeningRequiredData', 'postDoctorNCDScreeningDetails'],
    ];

    flows.forEach(([submit, validator, post]) => {
      describe(String(submit), () => {
        let validatorSpy: jasmine.Spy;

        beforeEach(() => {
          doctor[post] = jasmine.createSpy(post);
          validatorSpy = spyOn(component, validator as any).and.returnValue(true);
          spyOn(component, 'checkForPrescribedTests');
        });

        it('should not submit when validation fails', () => {
          validatorSpy.and.returnValue(false);
          (component as any)[submit]();
          expect(doctor[post]).not.toHaveBeenCalled();
        });

        it('should post the case record with visit details and flags', () => {
          doctor[post].and.returnValue(of({ statusCode: 200, data: {} }));
          (component as any)[submit]();
          const args = doctor[post].calls.mostRecent().args;
          expect(args[0]).toBe(component.patientMedicalForm);
          expect(args[1]).toEqual(
            jasmine.objectContaining({ beneficiaryRegID: '1001', benVisitID: '3003', visitCode: '4004' }),
          );
          expect(args[2]).toBeNull();
          expect(args[3]).toBeFalse();
          expect(args[4]).toBeTrue();
          expect(component.checkForPrescribedTests).toHaveBeenCalled();
        });

        it('doctor success should link care context by tests and go to worklist', () => {
          doctor[post].and.returnValue(of({ statusCode: 200, data: {} }));
          (component as any)[submit]();
          expect(component.linkCareContextBasedOnTestsPrescribed).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/doctor-worklist']);
        });

        it('specialist success should link care context for specialist', () => {
          component.isSpecialist = true;
          doctor[post].and.returnValue(of({ statusCode: 200, data: {} }));
          (component as any)[submit]();
          expect(component.linkCareContextBasedOnSpecialistScheduled).toHaveBeenCalled();
        });

        it('should alert and re-enable submit on failure', () => {
          component.disableSubmitButton = true;
          doctor[post].and.returnValue(of({ statusCode: 5000, errorMessage: 'invalid' }));
          (component as any)[submit]();
          expect(confirmation.alert).toHaveBeenCalledWith('invalid', 'error');
          expect(component.disableSubmitButton).toBeFalse();
          expect(router.navigate).not.toHaveBeenCalled();
        });

        it('should alert on API error', () => {
          doctor[post].and.returnValue(throwError(() => 'down'));
          (component as any)[submit]();
          expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
        });
      });
    });

    describe('submitNCDScreeningDiagnosisForm extras', () => {
      beforeEach(() => {
        doctor.postDoctorNCDScreeningDetails = jasmine
          .createSpy('post')
          .and.returnValue(of({ statusCode: 200, data: {} }));
        spyOn(component, 'checkNCDScreeningRequiredData').and.returnValue(true);
        spyOn(component, 'checkForPrescribedTests');
      });

      it('should also save IDRS and clear screening flags', () => {
        sessionStorage.setItem('instFlag', '1');
        sessionStorage.setItem('suspectFlag', '1');
        component.visitCategory = 'NCD screening';
        component.submitNCDScreeningDiagnosisForm();
        expect(doctor.updateIDRSDetails).toHaveBeenCalledWith(
          component.patientMedicalForm.controls['idrsScreeningForm'],
          'NCD screening',
        );
        expect(sessionStorage.getItem('instFlag')).toBeNull();
        expect(sessionStorage.getItem('suspectFlag')).toBeNull();
      });

      it('should ignore IDRS save failures', () => {
        doctor.updateIDRSDetails.and.returnValue(throwError(() => 'idrs down'));
        expect(() => component.submitNCDScreeningDiagnosisForm()).not.toThrow();
        expect(component.linkCareContextBasedOnTestsPrescribed).toHaveBeenCalled();
      });
    });

    describe('submitCovidDiagnosisForm', () => {
      beforeEach(() => {
        doctor.postDoctorCovidDetails = jasmine.createSpy('postDoctorCovidDetails');
        spyOn(component, 'checkNurseRequirements').and.returnValue(1);
      });

      it('doctor with prescribed tests should alert and go to worklist', () => {
        doctor.postGeneralCaseRecordInvestigation.and.returnValue({ laboratoryList: [{}] });
        doctor.postDoctorCovidDetails.and.returnValue(of({ statusCode: 200, data: {} }));
        component.submitCovidDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
        expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
      });

      it('doctor without tests or schedule should offer care-context linking', () => {
        doctor.postGeneralCaseRecordInvestigation.and.returnValue({ laboratoryList: [] });
        doctor.postDoctorCovidDetails.and.returnValue(of({ statusCode: 200, data: {} }));
        component.submitCovidDiagnosisForm();
        expect(component.getHealthIDDetails).toHaveBeenCalledWith('Saved');
      });

      it('specialist should link for specialist', () => {
        component.isSpecialist = true;
        doctor.postGeneralCaseRecordInvestigation.and.returnValue({ laboratoryList: [] });
        doctor.postDoctorCovidDetails.and.returnValue(of({ statusCode: 200, data: {} }));
        component.submitCovidDiagnosisForm();
        expect(component.linkCareContextBasedOnSpecialistScheduled).toHaveBeenCalled();
      });

      it('should alert on failure and error', () => {
        doctor.postGeneralCaseRecordInvestigation.and.returnValue({ laboratoryList: [] });
        doctor.postDoctorCovidDetails.and.returnValue(of({ statusCode: 5000, errorMessage: 'bad' }));
        component.submitCovidDiagnosisForm();
        doctor.postDoctorCovidDetails.and.returnValue(throwError(() => 'down'));
        component.submitCovidDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
      });
    });

    describe('submitCancerDiagnosisForm', () => {
      beforeEach(() => {
        doctor.postDoctorCancerVisitDetails = jasmine.createSpy('postDoctorCancerVisitDetails');
        spyOn(component, 'checkCancerRequiredData').and.returnValue(true);
      });

      it('should not submit when validation fails', () => {
        (component.checkCancerRequiredData as jasmine.Spy).and.returnValue(false);
        component.submitCancerDiagnosisForm();
        expect(doctor.postDoctorCancerVisitDetails).not.toHaveBeenCalled();
      });

      it('doctor without schedule should offer linking and go to worklist', () => {
        doctor.postDoctorCancerVisitDetails.and.returnValue(of({ statusCode: 200, data: {} }));
        component.submitCancerDiagnosisForm();
        expect(doctor.postDoctorCancerVisitDetails).toHaveBeenCalledWith(
          component.patientMedicalForm,
          null,
          false,
          true,
        );
        expect(component.getHealthIDDetails).toHaveBeenCalledWith('Saved');
        expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/doctor-worklist']);
      });

      it('doctor with schedule should alert success and go to worklist', () => {
        component.schedulerData = { slot: 1 };
        doctor.postDoctorCancerVisitDetails.and.returnValue(of({ statusCode: 200, data: {} }));
        component.submitCancerDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
        expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
      });

      it('specialist should always offer linking', () => {
        component.isSpecialist = true;
        component.schedulerData = { slot: 1 };
        doctor.postDoctorCancerVisitDetails.and.returnValue(of({ statusCode: 200, data: {} }));
        component.submitCancerDiagnosisForm();
        expect(component.getHealthIDDetails).toHaveBeenCalled();
      });

      it('should alert on failure and error', () => {
        doctor.postDoctorCancerVisitDetails.and.returnValue(of({ statusCode: 5000, errorMessage: 'bad' }));
        component.submitCancerDiagnosisForm();
        doctor.postDoctorCancerVisitDetails.and.returnValue(throwError(() => 'down'));
        component.submitCancerDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
      });
    });

    describe('quick consult', () => {
      const qcForm = (test: any, radiology: any) =>
        fb.group({
          chiefComplaintList: [[{ chiefComplaint: { chiefComplaintID: 1, chiefComplaint: 'Fever' } }]],
          prescription: fb.group({
            prescribedDrugs: [[{ drugID: 1, createdBy: 'doc' }, { drugID: 2, createdBy: null }]],
          }),
          test: [test],
          radiology: [radiology],
        });

      beforeEach(() => {
        doctor.postGeneralRefer = jasmine.createSpy('postGeneralRefer').and.returnValue({ refer: 1 });
        doctor.postQuickConsultDetails = jasmine.createSpy('postQuickConsultDetails');
        doctor.updateQuickConsultDetails = jasmine.createSpy('updateQuickConsultDetails');
        component.patientMedicalForm = fb.group({
          patientQuickConsultForm: qcForm([{ procedureID: 1 }], [{ procedureID: 2, disabled: true }]),
          patientReferForm: fb.group({ r: 1 }),
          patientFileUploadDetailsForm: fb.group({}),
        });
        spyOn(component, 'checkQuickConsultDoctorData').and.returnValue(1);
      });

      it('mapDoctorQuickConsultDetails should normalise complaints, drugs and tests', () => {
        const result = component.mapDoctorQuickConsultDetails();
        expect(result.chiefComplaintList[0]).toEqual({ chiefComplaintID: 1, chiefComplaint: 'Fever' });
        expect(result.prescription).toEqual([{ drugID: 1, createdBy: 'doc' }]);
        expect(result.labTestOrders).toEqual([{ procedureID: 1 }]);
        expect(result.test).toBeUndefined();
        expect(result.refer).toEqual({ refer: 1 });
        expect(doctor.postGeneralRefer.calls.mostRecent().args[1]).toEqual(
          jasmine.objectContaining({ vanID: 61, visitCode: '4004' }),
        );
      });

      it('mapDoctorQuickConsultDetails should handle only radiology or only tests', () => {
        component.patientMedicalForm.setControl('patientQuickConsultForm', qcForm(null, [{ procedureID: 3 }]));
        expect(component.mapDoctorQuickConsultDetails().labTestOrders).toEqual([{ procedureID: 3 }]);
        component.patientMedicalForm.setControl('patientQuickConsultForm', qcForm([{ procedureID: 4 }], null));
        expect(component.mapDoctorQuickConsultDetails().labTestOrders).toEqual([{ procedureID: 4 }]);
      });

      it('submitQuickConsultDiagnosisForm should not submit when invalid', () => {
        (component.checkQuickConsultDoctorData as jasmine.Spy).and.returnValue(false);
        component.submitQuickConsultDiagnosisForm();
        expect(doctor.postQuickConsultDetails).not.toHaveBeenCalled();
      });

      it('submitQuickConsultDiagnosisForm doctor with tests should alert and go to worklist', () => {
        doctor.postQuickConsultDetails.and.returnValue(of({ statusCode: 200, data: {} }));
        component.submitQuickConsultDiagnosisForm();
        const payload = doctor.postQuickConsultDetails.calls.mostRecent().args[0].quickConsultation;
        expect(payload.labTestOrders.length).toBe(2);
        expect(payload.prescription).toEqual([{ drugID: 1, createdBy: 'doc' }]);
        expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
        expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
      });

      it('submitQuickConsultDiagnosisForm specialist without tests should offer linking', () => {
        component.isSpecialist = true;
        component.patientMedicalForm.setControl('patientQuickConsultForm', qcForm([], []));
        doctor.postQuickConsultDetails.and.returnValue(of({ statusCode: 200, data: {} }));
        component.submitQuickConsultDiagnosisForm();
        expect(component.getHealthIDDetails).toHaveBeenCalledWith('Saved');
      });

      it('submitQuickConsultDiagnosisForm should alert on failure and error', () => {
        doctor.postQuickConsultDetails.and.returnValue(of({ statusCode: 5000, errorMessage: 'bad' }));
        component.submitQuickConsultDiagnosisForm();
        doctor.postQuickConsultDetails.and.returnValue(throwError(() => 'down'));
        component.submitQuickConsultDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
      });

      it('updateQuickConsultDiagnosisForm specialist with tests should go to specialist worklist', () => {
        component.isSpecialist = true;
        doctor.updateQuickConsultDetails.and.returnValue(of({ statusCode: 200, data: { response: 'ok' } }));
        component.updateQuickConsultDiagnosisForm();
        expect(component.navigateToSpecialistWorklist).toHaveBeenCalled();
      });

      it('updateQuickConsultDiagnosisForm doctor without tests should offer linking', () => {
        component.testsPrescribed = null;
        doctor.updateQuickConsultDetails.and.returnValue(of({ statusCode: 200, data: { response: 'ok' } }));
        component.updateQuickConsultDiagnosisForm();
        expect(component.getHealthIDDetails).toHaveBeenCalledWith('ok');
      });

      it('updateQuickConsultDiagnosisForm should alert on failure', () => {
        doctor.updateQuickConsultDetails.and.returnValue(of({ statusCode: 5000, errorMessage: 'bad' }));
        component.updateQuickConsultDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      });
    });

    describe('updateDoctorDiagnosisForm', () => {
      beforeEach(() => {
        doctor.saveSpecialistCancerObservation = jasmine.createSpy('saveSpecialistCancerObservation');
        doctor.updateDoctorDiagnosisDetails = jasmine.createSpy('updateDoctorDiagnosisDetails');
        spyOn(component, 'checkForPrescribedTests');
      });

      it('cancer: specialist save should offer linking', () => {
        store['visitCategory'] = 'Cancer Screening';
        component.isSpecialist = true;
        spyOn(component, 'checkCancerRequiredData').and.returnValue(true);
        doctor.saveSpecialistCancerObservation.and.returnValue(of({ statusCode: 200, data: { response: 'done' } }));
        component.updateDoctorDiagnosisForm();
        expect(doctor.saveSpecialistCancerObservation.calls.mostRecent().args[1]).toEqual(
          jasmine.objectContaining({ vanID: 61, isSpecialist: true }),
        );
        expect(component.getHealthIDDetails).toHaveBeenCalledWith('done');
      });

      it('cancer: should alert on failure', () => {
        store['visitCategory'] = 'Cancer Screening';
        spyOn(component, 'checkCancerRequiredData').and.returnValue(true);
        doctor.saveSpecialistCancerObservation.and.returnValue(of({ statusCode: 5000, errorMessage: 'bad' }));
        component.updateDoctorDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      });

      it('NCD screening: should update IDRS and offer linking without tests', () => {
        store['visitCategory'] = 'NCD screening';
        spyOn(component, 'checkNCDScreeningRequiredData').and.returnValue(true);
        doctor.updateDoctorDiagnosisDetails.and.returnValue(of({ statusCode: 200, data: { response: 'done' } }));
        component.updateDoctorDiagnosisForm();
        expect(doctor.updateIDRSDetails).toHaveBeenCalled();
        expect(component.getHealthIDDetails).toHaveBeenCalledWith('done');
      });

      it('NCD screening: specialist with tests should go to specialist worklist', () => {
        store['visitCategory'] = 'NCD screening';
        component.isSpecialist = true;
        component.testsPrescribed = { laboratoryList: [{}] };
        spyOn(component, 'checkNCDScreeningRequiredData').and.returnValue(true);
        doctor.updateDoctorDiagnosisDetails.and.returnValue(of({ statusCode: 200, data: { response: 'done' } }));
        component.updateDoctorDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('done', 'success');
        expect(component.navigateToSpecialistWorklist).toHaveBeenCalled();
      });

      it('other categories: doctor with schedule should go to doctor worklist', () => {
        store['visitCategory'] = 'ANC';
        component.schedulerData = { slot: 1 };
        spyOn(component, 'checkNurseRequirements').and.returnValue(1);
        doctor.updateDoctorDiagnosisDetails.and.returnValue(of({ statusCode: 200, data: { response: 'done' } }));
        component.updateDoctorDiagnosisForm();
        expect(doctor.updateDoctorDiagnosisDetails.calls.mostRecent().args[1]).toBe('ANC');
        expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
      });

      it('other categories: should alert on failure and error', () => {
        store['visitCategory'] = 'General OPD';
        spyOn(component, 'checkNurseRequirements').and.returnValue(1);
        doctor.updateDoctorDiagnosisDetails.and.returnValue(of({ statusCode: 5000, errorMessage: 'bad' }));
        component.updateDoctorDiagnosisForm();
        doctor.updateDoctorDiagnosisDetails.and.returnValue(throwError(() => 'down'));
        component.updateDoctorDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
      });

      it('should not call the API when validation fails', () => {
        store['visitCategory'] = 'PNC';
        spyOn(component, 'checkNurseRequirements').and.returnValue(0);
        component.updateDoctorDiagnosisForm();
        expect(doctor.updateDoctorDiagnosisDetails).not.toHaveBeenCalled();
      });
    });
  });

  describe('updatePending', () => {
    const step = (label: string) => ({ previouslySelectedStep: { label } });

    beforeEach(() => {
      Object.assign(LANG, {
        ancData: { anc: 'ANC' },
        vitalsDetails: { vitalsDataANC_OPD_NCD_PNC: { vitals: 'Vitals' } },
        ExaminationData: { examination: 'Examination' },
        covidVaccinationStatus: 'Covid vaccination',
      });
      LANG.common.history = 'History';
      LANG.alerts.info.dontForget = "Don't forget to update";
      LANG.alerts.info.changes = 'changes';
      component.newLookupMode = false;
      component.patientMedicalForm = fb.group({
        patientANCForm: fb.group({}),
        patientVisitForm: fb.group({ covidVaccineStatusForm: fb.group({}) }),
        patientVitalsForm: fb.group({}),
        patientExaminationForm: fb.group({}),
        patientHistoryForm: fb.group({}),
        idrsScreeningForm: fb.group({}),
      });
    });

    const dirtyCases: [string, string, string][] = [
      ['ANC', 'patientANCForm', 'ANC'],
      ['History', 'patientHistoryForm', 'History'],
      ['Vitals', 'patientVitalsForm', 'Vitals'],
      ['Examination', 'patientExaminationForm', 'Examination'],
    ];
    dirtyCases.forEach(([label, control, name]) => {
      it(`should remind about unsaved ${label} changes`, () => {
        component.patientMedicalForm.get(control)?.markAsDirty();
        component.updatePending(step(label));
        expect(confirmation.alert).toHaveBeenCalledWith(`Don't forget to update ${name} changes`);
      });

      it(`should stay silent when ${label} is clean`, () => {
        component.updatePending(step(label));
        expect(confirmation.alert).not.toHaveBeenCalled();
      });
    });

    it('should remind about vitals when update button is enabled', () => {
      component.enableUpdateButtonInVitals = true;
      component.updatePending(step('Vitals'));
      expect(confirmation.alert).toHaveBeenCalled();
    });

    it('should remind about IDRS when not updated', () => {
      component.enableIDRSUpdate = false;
      component.updatePending(step('IDRS'));
      expect(confirmation.alert).toHaveBeenCalledWith(`Don't forget to update Screening changes`);
    });

    it('should remind about covid vaccination for 12+ when dirty', () => {
      doctor.covidVaccineAgeGroup = '>=12 years';
      component.patientMedicalForm.get('patientVisitForm.covidVaccineStatusForm')?.markAsDirty();
      component.updatePending(step('Visit Details'));
      expect(confirmation.alert).toHaveBeenCalledWith(`Don't forget to update Covid vaccination changes`);
    });

    it('should not remind about covid vaccination under 12', () => {
      doctor.covidVaccineAgeGroup = '<12 years';
      doctor.enableCovidVaccinationButton = true;
      component.updatePending(step('Visit Details'));
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('new lookup mode should only check visit details', () => {
      component.newLookupMode = true;
      doctor.covidVaccineAgeGroup = '>=12 years';
      doctor.enableCovidVaccinationButton = true;
      component.patientMedicalForm.get('patientANCForm')?.markAsDirty();
      component.updatePending(step('ANC'));
      expect(confirmation.alert).not.toHaveBeenCalled();
      component.updatePending(step('Visit Details'));
      expect(confirmation.alert).toHaveBeenCalled();
    });

    it('unknown steps should not alert', () => {
      component.updatePending(step('Refer'));
      expect(confirmation.alert).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // Batch 4: validation (check* methods)
  // ---------------------------------------------------------------------

  describe('validation', () => {
    /** Language proxy: every key resolves to its dotted path, e.g. "pncData.placeofDelivery" */
    const langProxy = (path: string[] = []): any =>
      new Proxy(function () {}, {
        get: (_t, prop) => {
          if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
            return () => path.join('.');
          if (typeof prop === 'symbol') return undefined;
          return langProxy([...path, prop as string]);
        },
      });
    const notified = () =>
      (confirmation.notify.calls.mostRecent().args[1] as any[]).map(String);

    const req = (v: any = 'x') => [v, Validators.required];
    const diagList = (view: any, conceptID: any) =>
      fb.array([
        fb.group({ viewProvisionalDiagnosisProvided: req(view), conceptID: [conceptID] }),
      ]);
    const vitals = (o: any = {}) =>
      fb.group({
        systolicBP_1stReading: req(120),
        diastolicBP_1stReading: req(80),
        height_cm: req(160),
        weight_Kg: req(60),
        temperature: req(98),
        pulseRate: req(72),
        waistCircumference_cm: req(80),
        rbsCheckBox: [false],
        rbsTestResult: [null],
        ...o,
      });
    const refer = (o: any = {}) =>
      fb.group({
        refrredToAdditionalServiceList: [null],
        referredToInstituteName: [null],
        referredToInstituteID: [null],
        referralReason: req(null),
        referralReasonList: [null],
        ...o,
      });
    const history = (o: any = {}) =>
      fb.group({
        pastObstericHistory: fb.group({ pastObstericHistoryList: fb.array([]) }),
        personalHistory: fb.group({ allergicList: [[]] }),
        comorbidityHistory: fb.group({
          comorbidityConcurrentConditionsList: fb.array([fb.group({ comorbidConditions: req() })]),
        }),
        familyHistory: fb.group({ familyDiseaseList: [[]] }),
        physicalActivityHistory: fb.group({ activityType: req('walk') }),
        ...o,
      });
    const caseRecord = (diag: any = {}, labTest: any[] = []) =>
      fb.group({
        generalDiagnosisForm: fb.group({
          provisionalDiagnosisList: diagList('Fever', 'C1'),
          confirmatoryDiagnosisList: fb.array([]),
          doctorDiagnosis: req('d'),
          ncdScreeningConditionArray: [null],
          ncdScreeningConditionOther: [null],
          diabetesConfirmed: [true],
          hypertensionConfirmed: [true],
          ...diag,
        }),
        generalDoctorInvestigationForm: fb.group({ labTest: [labTest] }),
        diagnosisForm: fb.group({ provisionalDiagnosisPrimaryDoctor: req('p') }),
        provisionalDiagnosisPrimaryDoctor: req('p'),
      });
    const medical = (o: any = {}) =>
      fb.group({
        patientVitalsForm: vitals(),
        patientVisitForm: fb.group({
          patientCovidForm: fb.group({ contactStatus: req(), travelStatus: req(), symptom: req() }),
        }),
        patientReferForm: refer(),
        patientHistoryForm: history(),
        patientCaseRecordForm: caseRecord(),
        patientExaminationForm: fb.group({
          generalExaminationForm: fb.group({
            typeOfDangerSigns: [null],
            lymphnodesInvolved: [null],
            typeOfLymphadenopathy: [null],
            extentOfEdema: [null],
            edemaType: [null],
          }),
        }),
        patientPNCForm: fb.group({ deliveryPlace: req(), deliveryType: req() }),
        patientANCForm: fb.group({
          patientANCDetailsForm: fb.group({ primiGravida: req(true), lmpDate: req('d') }),
        }),
        idrsScreeningForm: fb.group({ requiredList: [null] }),
        patientQuickConsultForm: fb.group({
          chiefComplaintList: req([{ c: 1 }]),
          clinicalObservation: req('obs'),
          provisionalDiagnosisList: diagList('Fever', 'C1'),
          instruction: req('advice'),
        }),
        ...o,
      });
    /** sets the form on the component and returns it */
    const use = (form: FormGroup) => (component.patientMedicalForm = form);

    beforeEach(() => {
      component.current_language_set = langProxy();
      nurse.ismmutc$ = of('no');
      component.attendant = 'nurse';
      component.designation = 'Nurse';
      component.visitCategory = 'General OPD';
      component.beneficiary = { ageVal: 25 };
      component.beneficiaryAge = 25;
      component.schedulerData = null;
    });

    describe('checkNurseRequirements', () => {
      it('should pass a complete form', () => {
        const f = use(medical());
        expect(component.checkNurseRequirements(f)).toBe(1);
        expect(confirmation.notify).not.toHaveBeenCalled();
      });

      it('PNC: should require delivery place and type, and reset submit state', () => {
        component.visitCategory = 'PNC';
        component.disableSubmitButton = true;
        const f = use(medical({ patientPNCForm: fb.group({ deliveryPlace: req(null), deliveryType: req(null) }) }));
        expect(component.checkNurseRequirements(f)).toBe(0);
        expect(notified()).toEqual(['pncData.placeofDelivery', 'pncData.typeofDelivery']);
        expect(String(confirmation.notify.calls.mostRecent().args[0])).toBe('alerts.info.belowFields');
        expect(component.disableSubmitButton).toBeFalse();
      });

      describe('General OPD doctor diagnosis', () => {
        beforeEach(() => (component.attendant = 'doctor'));

        it('should require a provisional diagnosis', () => {
          const f = use(medical({
            patientCaseRecordForm: caseRecord({ provisionalDiagnosisList: diagList(null, null) }),
          }));
          component.checkNurseRequirements(f);
          expect(notified()).toContain('DiagnosisDetails.provisionaldiagnosis');
        });

        it('should require SNOMED codes for typed diagnoses', () => {
          const f = use(medical({
            patientCaseRecordForm: caseRecord({ provisionalDiagnosisList: diagList('Fever', '') }),
          }));
          component.checkNurseRequirements(f);
          expect(notified()).toContain('pleaseSelectprovisionalDiagnosisWithSnomedCode');
        });

        it('PNC doctor: should validate confirmatory diagnoses', () => {
          component.visitCategory = 'PNC';
          const f = use(medical({
            patientCaseRecordForm: caseRecord({
              confirmatoryDiagnosisList: fb.array([
                fb.group({ viewConfirmatoryDiagnosisProvided: 'TB', conceptID: null }),
              ]),
            }),
          }));
          component.checkNurseRequirements(f);
          expect(notified()).toContain('confirmatoryDiagnosisIsNotValid');
        });

        it('should apply the same checks for TC specialists', () => {
          component.attendant = 'tcspecialist';
          component.designation = 'TC Specialist';
          const f = use(medical({
            patientCaseRecordForm: caseRecord({ provisionalDiagnosisList: diagList(null, null) }),
          }));
          component.checkNurseRequirements(f);
          expect(notified()).toContain('DiagnosisDetails.provisionaldiagnosis');
        });
      });

      it('nurse: should require abortion details per pregnancy', () => {
        const preg = fb.group({
          pregOrder: 2,
          pregOutcome: [{ pregOutcome: 'Abortion' }],
          abortionType: [{ complicationValue: 'Induced' }],
          typeofFacility: req(null),
          postAbortionComplication: req(null),
          pregDuration: req(null),
        });
        const f = use(medical({
          patientHistoryForm: history({
            pastObstericHistory: fb.group({ pastObstericHistoryList: fb.array([preg]) }),
          }),
        }));
        component.checkNurseRequirements(f);
        const o = 'historyData.opd_NCD_PNCHistory.obstetric';
        expect(notified()).toEqual([
          `${o}.typeofFacility-${o}.orderofPregnancy 2`,
          `${o}.complicationPostAbortion-${o}.orderofPregnancy 2`,
          `${o}.noOfcompletedWeeks-${o}.orderofPregnancy 2`,
        ]);
      });

      it('COVID: should require contact, travel, symptoms and comorbidities', () => {
        component.visitCategory = 'COVID-19 Screening';
        const f = use(medical({
          patientVisitForm: fb.group({
            patientCovidForm: fb.group({ contactStatus: req(null), travelStatus: req(null), symptom: req(null) }),
          }),
          patientHistoryForm: history({
            comorbidityHistory: fb.group({
              comorbidityConcurrentConditionsList: fb.array([fb.group({ comorbidConditions: req(null) })]),
            }),
          }),
        }));
        component.checkNurseRequirements(f);
        expect(notified()).toEqual([
          'contactHistory',
          'covid.travelHistory',
          'ExaminationData.cancerScreeningExamination.symptoms.symptoms',
          'historyData.ancHistory.combordityANC_OPD_NCD_PNC.comorbidConditions',
        ]);
      });

      it('COVID doctor: should require doctor diagnosis', () => {
        component.visitCategory = 'COVID-19 Screening';
        component.attendant = 'doctor';
        const f = use(medical({ patientCaseRecordForm: caseRecord({ doctorDiagnosis: req(null) }) }));
        component.checkNurseRequirements(f);
        expect(notified()).toContain('doctorDiagnosis');
      });

      describe('ANC', () => {
        beforeEach(() => (component.visitCategory = 'ANC'));

        it('should require primigravida and LMP', () => {
          const f = use(medical({
            patientANCForm: fb.group({
              patientANCDetailsForm: fb.group({ primiGravida: req(null), lmpDate: req(null) }),
            }),
          }));
          component.checkNurseRequirements(f);
          expect(notified()).toEqual([
            'ancData.ancDataDetails.primiGravida',
            'ancData.ancDataDetails.lastMenstrualPeriod',
          ]);
        });

        it('doctor: should require RBS test when RBS is flagged', () => {
          component.attendant = 'doctor';
          component.rbsPresent = 1;
          const f = use(medical());
          component.checkNurseRequirements(f);
          expect(notified()).toEqual(['pleaseSelectRBSTestInInvestigation']);
        });

        it('doctor: RBS requirement is met by an investigation or a vitals result', () => {
          component.attendant = 'doctor';
          component.rbsPresent = 1;
          let f = use(medical({ patientCaseRecordForm: caseRecord({}, [{ procedureName: environment.RBSTest }]) }));
          expect(component.checkNurseRequirements(f)).toBe(1);
          f = use(medical({ patientVitalsForm: vitals({ rbsTestResult: [140] }) }));
          expect(component.checkNurseRequirements(f)).toBe(1);
        });

        it('doctor: should require haemoglobin test when flagged', () => {
          component.attendant = 'doctor';
          component.heamoglobinPresent = 1;
          let f = use(medical());
          component.checkNurseRequirements(f);
          expect(notified()).toEqual(['pleaseSelectHeamoglobinTestInInvestigation']);
          f = use(medical({ patientCaseRecordForm: caseRecord({}, [{ procedureName: environment.haemoglobinTest }]) }));
          expect(component.checkNurseRequirements(f)).toBe(1);
        });
      });

      it('should flag allergies with partial SNOMED mapping', () => {
        const f = use(medical({
          patientHistoryForm: history({
            personalHistory: fb.group({
              allergicList: [[{ allergyType: 'Food', snomedCode: null, snomedTerm: 'Peanut' }]],
            }),
          }),
        }));
        component.checkNurseRequirements(f);
        expect(notified()).toEqual(['allergyNameIsNotValid']);
      });

      it('should require all core vitals', () => {
        const f = use(medical({
          patientVitalsForm: vitals({
            systolicBP_1stReading: req(null),
            diastolicBP_1stReading: req(null),
            height_cm: req(null),
            weight_Kg: req(null),
            temperature: req(null),
            pulseRate: req(null),
          }),
        }));
        component.checkNurseRequirements(f);
        const v = 'vitalsDetails.vitalsDataANC_OPD_NCD_PNC';
        const a = 'vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC';
        expect(notified()).toEqual([
          `${v}.systolicBP`,
          `${v}.diastolicBP`,
          `${a}.height`,
          `${a}.weight`,
          `${v}.temperature`,
          `${v}.pulseRate`,
        ]);
      });

      it('doctor: should require referral reason when referring', () => {
        component.attendant = 'doctor';
        let f = use(medical({ patientReferForm: refer({ refrredToAdditionalServiceList: [[{ s: 1 }]] }) }));
        component.checkNurseRequirements(f);
        expect(notified()).toEqual(['Referdetails.referralReason']);
        f = use(medical({ patientReferForm: refer({ referredToInstituteName: ['CHC'] }) }));
        component.checkNurseRequirements(f);
        expect(notified()).toEqual(['Referdetails.referralReason']);
      });

      it('should require dependent examination fields', () => {
        const f = use(medical());
        const ge = f.get('patientExaminationForm.generalExaminationForm') as FormGroup;
        ge.controls['typeOfDangerSigns'].setErrors({ required: true });
        ge.controls['edemaType'].setErrors({ required: true });
        expect(component.checkNurseRequirements(f)).toBe(0);
        expect(notified().length).toBe(2);
      });

      it('nurse in MMU-TC flow should require a TM schedule', () => {
        nurse.ismmutc$ = of('yes');
        const f = use(medical());
        component.checkNurseRequirements(f);
        expect(notified()).toEqual(['nurseData.scheduleTM']);
        component.schedulerData = { slot: 1 };
        expect(component.checkNurseRequirements(f)).toBe(1);
      });

      it('NCD care doctor: should require condition and "Other" details', () => {
        component.visitCategory = 'NCD care';
        component.attendant = 'doctor';
        let f = use(medical({ patientCaseRecordForm: caseRecord({ ncdScreeningConditionArray: req(null) }) }));
        component.checkNurseRequirements(f);
        expect(notified()).toContain('casesheet.ncdCondition');
        f = use(medical({ patientCaseRecordForm: caseRecord({ ncdScreeningConditionArray: [['Other']] }) }));
        component.checkNurseRequirements(f);
        expect(notified()).toEqual(['nCDConditionOther']);
      });

      it('Cancer doctor: should require provisional diagnosis', () => {
        component.visitCategory = 'Cancer Screening';
        component.attendant = 'doctor';
        const cr = caseRecord();
        (cr.get('diagnosisForm.provisionalDiagnosisPrimaryDoctor'))?.setValue(null);
        const f = use(medical({ patientCaseRecordForm: cr }));
        component.checkNurseRequirements(f);
        expect(notified()).toEqual(['DiagnosisDetails.provisionaldiagnosis']);
      });
    });

    describe('checkCancerRequiredData', () => {
      beforeEach(() => (component.visitCategory = 'Cancer Screening'));

      it('should pass a complete form', () => {
        expect(component.checkCancerRequiredData(use(medical()))).toBeTrue();
      });

      it('should require vitals', () => {
        const f = use(medical({ patientVitalsForm: vitals({ height_cm: req(null), weight_Kg: req(null) }) }));
        expect(component.checkCancerRequiredData(f)).toBeFalse();
        expect(notified().length).toBe(2);
      });

      it('should not require vitals when the vitals form is absent', () => {
        const f = use(medical());
        f.removeControl('patientVitalsForm');
        expect(component.checkCancerRequiredData(f)).toBeTrue();
      });

      it('doctor: should require the primary provisional diagnosis', () => {
        component.attendant = 'doctor';
        const f = use(medical());
        f.get('patientCaseRecordForm.provisionalDiagnosisPrimaryDoctor')?.setValue(null);
        component.checkCancerRequiredData(f);
        expect(notified()).toEqual(['DiagnosisDetails.provisionaldiagnosis']);
      });

      it('doctor: should require referral reason when an institute id is chosen', () => {
        component.attendant = 'doctor';
        const f = use(medical({ patientReferForm: refer({ referredToInstituteID: [7] }) }));
        component.checkCancerRequiredData(f);
        expect(notified()).toEqual(['Referdetails.referralReason']);
      });

      it('nurse in MMU-TC flow should require a schedule', () => {
        nurse.ismmutc$ = of('yes');
        component.checkCancerRequiredData(use(medical()));
        expect(notified()).toEqual(['nurseData.scheduleTM']);
      });
    });

    describe('checkQuickConsultDoctorData', () => {
      beforeEach(() => (component.visitCategory = 'General OPD (QC)'));

      it('should pass a complete form', () => {
        expect(component.checkQuickConsultDoctorData(use(medical()))).toBe(1);
      });

      it('should require chief complaints and clinical observation', () => {
        const f = use(medical());
        f.get('patientQuickConsultForm.chiefComplaintList')?.setValue([]);
        f.get('patientQuickConsultForm.clinicalObservation')?.setValue(null);
        expect(component.checkQuickConsultDoctorData(f)).toBe(0);
        expect(notified().length).toBe(2);
        expect(notified()).toContain('casesheet.clinicalObs');
      });

      it('doctor: should require SNOMED codes on provisional diagnoses', () => {
        component.attendant = 'doctor';
        const f = use(medical());
        f.get('patientQuickConsultForm.provisionalDiagnosisList.0.conceptID')?.setValue(null);
        component.checkQuickConsultDoctorData(f);
        expect(notified()).toEqual(['pleaseSelectprovisionalDiagnosisWithSnomedCode']);
      });

      it('TC specialist: should require advice/instruction', () => {
        component.designation = 'TC Specialist';
        const f = use(medical());
        f.get('patientQuickConsultForm.instruction')?.setValue(null);
        component.checkQuickConsultDoctorData(f);
        expect(notified()).toEqual(['casesheet.sprcAdvice']);
      });

      it('should require referral reason when services are chosen', () => {
        const f = use(medical({ patientReferForm: refer({ refrredToAdditionalServiceList: [[{ s: 1 }]] }) }));
        component.checkQuickConsultDoctorData(f);
        expect(notified()).toEqual(['Referdetails.referralReason']);
      });
    });

    describe('checkNCDScreeningRequiredData', () => {
      beforeEach(() => {
        component.visitCategory = 'NCD screening';
        idrs.diabetesNotPresentInMMU = 1;
      });

      afterEach(() => {
        sessionStorage.removeItem('instFlag');
        sessionStorage.removeItem('suspectFlag');
      });

      const family = (list: any[]) =>
        history({ familyHistory: fb.group({ familyDiseaseList: [list] }) });
      const dm = { diseaseType: { diseaseType: 'Diabetes Mellitus' }, deleted: false, familyMembers: ['Father'] };

      it('should pass a complete form for a beneficiary under 30', () => {
        expect(component.checkNCDScreeningRequiredData(use(medical()))).toBeTrue();
      });

      it('nurse: should require RBS result when diabetes selected and RBS ticked', () => {
        component.diabetesSelected = 1;
        const f = use(medical({ patientVitalsForm: vitals({ rbsCheckBox: [true] }) }));
        component.checkNCDScreeningRequiredData(f);
        expect(notified()).toEqual(['Please perform RBS Test under Vitals']);
      });

      it('30+: should require diabetes family history and physical activity', () => {
        component.beneficiary = { ageVal: 45 };
        const f = use(medical({
          patientHistoryForm: history({ physicalActivityHistory: fb.group({ activityType: req(null) }) }),
        }));
        component.checkNCDScreeningRequiredData(f);
        expect(notified()).toEqual(['pleaseSelectDiabetesMellitusInFamilyHistory', 'physicalActivity']);
      });

      it('30+: should pass with diabetes in family history', () => {
        component.beneficiary = { ageVal: 45 };
        expect(component.checkNCDScreeningRequiredData(use(medical({ patientHistoryForm: family([dm]) })))).toBeTrue();
      });

      it('should require family members for each listed disease', () => {
        const f = use(medical({ patientHistoryForm: family([{ ...dm, familyMembers: [] }]) }));
        component.checkNCDScreeningRequiredData(f);
        expect(notified()).toEqual(['familyMemberInFamilyHistory']);
      });

      it('should ignore deleted or empty family entries', () => {
        const f = use(medical({
          patientHistoryForm: family([{ diseaseType: null, deleted: false }, { ...dm, deleted: true, familyMembers: [] }]),
        }));
        expect(component.checkNCDScreeningRequiredData(f)).toBeTrue();
      });

      it('should include IDRS required fields except Hypertension', () => {
        const f = use(medical({ idrsScreeningForm: fb.group({ requiredList: [['Hypertension', 'Q1']] }) }));
        component.checkNCDScreeningRequiredData(f);
        expect(notified()).toEqual(['Q1']);
      });

      describe('doctor', () => {
        beforeEach(() => (component.attendant = 'doctor'));

        it('should require RBS investigation or vitals when RBS is flagged', () => {
          component.rbsPresent = 1;
          component.diabetesSelected = 1;
          let f = use(medical({ patientVitalsForm: vitals({ rbsCheckBox: [true] }) }));
          component.checkNCDScreeningRequiredData(f);
          expect(notified()).toContain('Please select RBS Test under Vitals or Investigation');
          f = use(medical());
          component.checkNCDScreeningRequiredData(f);
          expect(notified()).toContain('Please select RBS Test under Investigation');
        });

        it('should require provisional diagnosis only when enabled', () => {
          const f = use(medical({
            patientCaseRecordForm: caseRecord({ provisionalDiagnosisList: diagList(null, null) }),
          }));
          expect(component.checkNCDScreeningRequiredData(f)).toBeTrue();
          component.enableProvisionalDiag = true;
          component.checkNCDScreeningRequiredData(f);
          expect(notified()).toEqual(['DiagnosisDetails.provisionaldiagnosis']);
        });

        it('should require a higher healthcare centre for suspected cases', () => {
          sessionStorage.setItem('instFlag', 'true');
          sessionStorage.setItem('suspectFlag', 'true');
          component.checkNCDScreeningRequiredData(use(medical()));
          expect(notified()).toEqual(['Referdetails.higherhealthcarecenter']);
        });

        it('TC specialist: should require final diagnosis', () => {
          component.designation = 'TC Specialist';
          const f = use(medical({ patientCaseRecordForm: caseRecord({ diabetesConfirmed: [null] }) }));
          component.checkNCDScreeningRequiredData(f);
          expect(notified()).toContain('pleaseSelectFinalDiagnosis');
        });
      });

      it('should require temperature only when NCD temperature is enabled', () => {
        const f = use(medical({ patientVitalsForm: vitals({ temperature: req(null), waistCircumference_cm: req(null) }) }));
        component.checkNCDScreeningRequiredData(f);
        expect(notified()).toEqual(['vitalsDetails.vitalsCancerscreening_QC.waistCircumference']);
        component.ncdTemperature = true;
        component.checkNCDScreeningRequiredData(f);
        expect(notified().length).toBe(2);
      });
    });

    describe('checkPastObstericHistory', () => {
      const withPregnancy = (preg: FormGroup) =>
        medical({
          patientHistoryForm: history({
            pastObstericHistory: fb.group({ pastObstericHistoryList: fb.array([preg]) }),
          }),
        });

      it('should pass when there are no abortions', () => {
        const preg = fb.group({ pregOrder: 1, pregOutcome: [{ pregOutcome: 'Live Birth' }] });
        expect(component.checkPastObstericHistory(withPregnancy(preg))).toBe(1);
      });

      it('should require abortion type and duration', () => {
        const preg = fb.group({
          pregOrder: 1,
          pregOutcome: [{ pregOutcome: 'Abortion' }],
          abortionType: req(null),
          typeofFacility: [null],
          postAbortionComplication: [null],
          pregDuration: req(null),
        });
        expect(component.checkPastObstericHistory(withPregnancy(preg))).toBe(0);
        expect(notified().length).toBe(2);
      });

      it('should flag partially mapped allergies', () => {
        const f = medical({
          patientHistoryForm: history({
            personalHistory: fb.group({
              allergicList: [[{ allergyType: 'Drug', snomedCode: '123', snomedTerm: null }]],
            }),
          }),
        });
        expect(component.checkPastObstericHistory(f)).toBe(0);
        expect(notified()).toEqual(['allergyNameIsNotValid']);
      });
    });

    describe('checkNCDScreeningHistory', () => {
      const withFamily = (list: any[]) =>
        medical({ patientHistoryForm: history({ familyHistory: fb.group({ familyDiseaseList: [list] }) }) });

      it('under 30 should pass without diabetes history', () => {
        component.beneficiaryAge = 25;
        expect(component.checkNCDScreeningHistory(withFamily([]))).toBe(1);
      });

      it('30+ should require diabetes in family history', () => {
        component.beneficiaryAge = 40;
        expect(component.checkNCDScreeningHistory(withFamily([]))).toBe(0);
        expect(notified()).toEqual(['pleaseSelectDiabetesMellitusInFamilyHistory']);
        expect(String(confirmation.notify.calls.mostRecent().args[0])).toBe('alerts.info.mandatoryFields');
      });

      it('should require family members for listed diseases', () => {
        component.beneficiaryAge = 40;
        const f = withFamily([{ diseaseType: { diseaseType: 'Diabetes Mellitus' }, deleted: false, familyMembers: null }]);
        component.checkNCDScreeningHistory(f);
        expect(notified()).toEqual(['familyMemberInFamilyHistory']);
      });
    });
  });

  // ---------------------------------------------------------------------
  // Batch 5: initialisation and visit-type handling
  // ---------------------------------------------------------------------

  describe('handleVisitType', () => {
    beforeEach(() => {
      component.patientMedicalForm = fb.group({
        patientVisitForm: fb.group({ patientChiefComplaintsForm: fb.group({}) }),
      });
    });

    const shown = (): string[] =>
      (['showHistory', 'showVitals', 'showExamination', 'showAnc', 'showPNC', 'showNCDScreening', 'showQuickConsult', 'showCaseRecord', 'showRefer'] as const)
        .filter((k) => (component as any)[k]);
    const controls = () => Object.keys(component.patientMedicalForm.controls).sort();

    // [category, sections shown in nurse mode, sections shown in view mode, controls added in view mode]
    const cases: [string, string[], string[], string[]][] = [
      ['General OPD (QC)', ['showVitals'], ['showQuickConsult', 'showRefer'], ['patientQuickConsultForm', 'patientReferForm']],
      ['Cancer Screening', ['showHistory', 'showVitals', 'showExamination'], ['showHistory', 'showVitals', 'showExamination', 'showCaseRecord', 'showRefer'], ['patientCaseRecordForm', 'patientExaminationForm', 'patientHistoryForm', 'patientReferForm', 'patientVitalsForm']],
      ['General OPD', ['showHistory', 'showVitals', 'showExamination'], ['showHistory', 'showVitals', 'showExamination', 'showCaseRecord', 'showRefer'], ['patientCaseRecordForm', 'patientExaminationForm', 'patientHistoryForm', 'patientReferForm', 'patientVitalsForm']],
      ['NCD screening', ['showHistory', 'showVitals', 'showNCDScreening'], ['showHistory', 'showVitals', 'showNCDScreening', 'showCaseRecord', 'showRefer'], ['idrsScreeningForm', 'patientCaseRecordForm', 'patientHistoryForm', 'patientReferForm', 'patientVitalsForm']],
      ['PNC', ['showHistory', 'showVitals', 'showExamination', 'showPNC'], ['showHistory', 'showVitals', 'showExamination', 'showPNC', 'showCaseRecord', 'showRefer'], ['patientCaseRecordForm', 'patientExaminationForm', 'patientHistoryForm', 'patientPNCForm', 'patientReferForm', 'patientVitalsForm']],
      ['ANC', ['showHistory', 'showVitals', 'showExamination', 'showAnc'], ['showHistory', 'showVitals', 'showExamination', 'showAnc', 'showCaseRecord', 'showRefer'], ['patientANCForm', 'patientCaseRecordForm', 'patientExaminationForm', 'patientHistoryForm', 'patientReferForm', 'patientVitalsForm']],
      ['COVID-19 Screening', ['showHistory', 'showVitals'], ['showHistory', 'showVitals', 'showCaseRecord', 'showRefer'], ['patientCaseRecordForm', 'patientHistoryForm', 'patientReferForm', 'patientVitalsForm']],
      ['NCD care', ['showHistory', 'showVitals'], ['showHistory', 'showVitals', 'showCaseRecord', 'showRefer'], ['patientCaseRecordForm', 'patientHistoryForm', 'patientReferForm', 'patientVitalsForm']],
    ];

    cases.forEach(([category, nurseSections, viewSections, viewControls]) => {
      it(`${category}: new visit should show nurse sections only`, () => {
        component.handleVisitType(category);
        expect(shown().sort()).toEqual([...nurseSections].sort());
        expect(component.showCaseRecord).toBeFalse();
        expect(component.visitMode).toBeUndefined();
      });

      it(`${category}: view mode should add doctor sections and modes`, () => {
        component.handleVisitType(category, 'view');
        expect(shown().sort()).toEqual([...viewSections].sort());
        expect(controls()).toEqual(['patientVisitForm', ...viewControls].sort());
        expect(String(component.referMode)).toBe('view');
      });
    });

    it('should reset sections when switching category', () => {
      component.handleVisitType('ANC', 'view');
      component.handleVisitType('General OPD (QC)');
      expect(shown()).toEqual(['showVitals']);
      expect(component.patientMedicalForm.contains('patientANCForm')).toBeFalse();
    });

    it('should do nothing for an empty category', () => {
      spyOn(component, 'hideAll');
      component.handleVisitType(null);
      expect(component.hideAll).not.toHaveBeenCalled();
    });

    it('ANC should wire LMP, primigravida and gravida watchers', () => {
      spyOn(component, 'patchLMPDate');
      spyOn(component, 'getPrimeGravidaStatus');
      spyOn(component, 'patchGravidaValue');
      component.handleVisitType('ANC');
      expect(component.patchLMPDate).toHaveBeenCalled();
      expect(component.getPrimeGravidaStatus).toHaveBeenCalled();
      expect(component.patchGravidaValue).toHaveBeenCalled();
    });
  });

  describe('ngOnInit / getVisitType', () => {
    it('new visit: should build the visit form and react to category selection', () => {
      store['nurseFlag'] = 9;
      fixture.detectChanges();
      expect(component.newLookupMode).toBeTrue();
      expect(component.patientMedicalForm.contains('patientVisitForm')).toBeTrue();
      expect(nurse.clearNCDTemp).toHaveBeenCalled();
      expect(masterdata.getVisitDetailMasterData).toHaveBeenCalled();
      expect(component.nurseFlag).toBe(9);

      spyOn(component, 'handleVisitType');
      component.patientMedicalForm
        .get('patientVisitForm.patientVisitDetailsForm.visitCategory')
        ?.setValue('General OPD');
      expect(masterdata.reset).toHaveBeenCalled();
      expect(component.visitCategory).toBe('General OPD');
      expect(component.handleVisitType).toHaveBeenCalledWith('General OPD');
      expect(component.schedulerButton).toBe('Schedule for TM');
    });

    it('existing visit: should open the category in view mode', () => {
      store['visitCategory'] = 'General OPD';
      spyOn(component, 'handleVisitType');
      fixture.detectChanges();
      expect(component.newLookupMode).toBeFalse();
      expect(component.handleVisitType).toHaveBeenCalledWith('General OPD', 'view');
    });

    it('should read the doctor signature status', () => {
      store['userID'] = '77';
      doctor.checkUsersignatureExist.and.returnValue(of({ statusCode: 200, data: { signStatus: true } }));
      fixture.detectChanges();
      expect(doctor.checkUsersignatureExist).toHaveBeenCalledWith('77');
      expect(component.doctorSignatureFlag).toBeTrue();
    });

    it('should keep signature flag false when lookup fails', () => {
      doctor.checkUsersignatureExist.and.returnValue(of({ statusCode: 5000, data: null }));
      fixture.detectChanges();
      expect(component.doctorSignatureFlag).toBeFalse();
    });

    it('should mirror nurse flags for lung assessment and provisional diagnosis', () => {
      nurse.enableLAssessment$ = of(true);
      nurse.enableProvisionalDiag$ = of(true);
      nurse.ncdTemp$ = of(undefined);
      fixture.detectChanges();
      expect(component.enableLungAssessment).toBeTrue();
      expect(component.enableProvisionalDiag).toBeTrue();
      expect(component.ncdTemperature).toBeFalse();
    });

    it('setVitalsUpdateButtonValue should treat undefined as false', () => {
      doctor.enableVitalsUpdateButton$ = of(undefined);
      component.setVitalsUpdateButtonValue();
      expect(component.enableUpdateButtonInVitals).toBeFalse();
      doctor.enableVitalsUpdateButton$ = of(true);
      component.setVitalsUpdateButtonValue();
      expect(component.enableUpdateButtonInVitals).toBeTrue();
    });
  });
});
