import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ServicePointComponent } from './service-point.component';
import { ServicePointService } from './service-point.service';
import { RegistrarService } from '../registrar/shared/services/registrar.service';
import { ConfirmationService } from '../core/services/confirmation.service';
import { HttpServiceService } from '../core/services/http-service.service';
import { SetLanguageComponent } from '../core/components/set-language.component';

describe('ServicePointComponent', () => {
  let fixture: ComponentFixture<ServicePointComponent>;
  let component: ServicePointComponent;
  let routeData$: BehaviorSubject<any>;
  let router: jasmine.SpyObj<Router>;
  let confirmation: jasmine.SpyObj<ConfirmationService>;
  let spService: jasmine.SpyObj<ServicePointService>;
  let registrar: jasmine.SpyObj<RegistrarService>;
  let storage: jasmine.SpyObj<SessionStorageService>;
  let store: Record<string, any>;

  const LANG = {
    alerts: {
      info: {
        IssuesInFetchingDemographics: 'demographics issue',
        IssuesInFetchingLocationDetails: 'location issue',
      },
    },
    coreComponents: { issuesInGettingLocationTryToReLogin: 'relogin' },
  };

  const VANS = [
    { vanID: 1, vanSession: '3', facilityID: 9, servicePointID: 5, servicePointName: 'SP1' },
    { vanID: 1, vanSession: '1' },
    { vanID: 2, vanSession: '2' },
  ];

  const ok = (data: any) => of({ statusCode: 200, data });

  beforeEach(async () => {
    store = { providerServiceID: '13', userID: '77', designation: 'Nurse' };
    routeData$ = new BehaviorSubject<any>({
      servicePoints: { statusCode: 200, data: { UserVanSpDetails: VANS } },
    });
    router = jasmine.createSpyObj('Router', ['navigate']);
    confirmation = jasmine.createSpyObj('ConfirmationService', ['alert']);
    spService = jasmine.createSpyObj('ServicePointService', ['getMMUDemographics']);
    registrar = jasmine.createSpyObj('RegistrarService', [
      'getDistrictList',
      'getSubDistrictList',
      'getVillageList',
    ]);
    storage = jasmine.createSpyObj('SessionStorageService', ['getItem', 'setItem', 'removeItem']);
    storage.getItem.and.callFake((k: string) => store[k] ?? null);
    storage.setItem.and.callFake((k: string, v: any) => (store[k] = v));

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ServicePointComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { data: routeData$ } },
        { provide: ServicePointService, useValue: spService },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: RegistrarService, useValue: registrar },
        {
          provide: HttpServiceService,
          useValue: { currentLangugae$: of(LANG) },
        },
        { provide: SetLanguageComponent, useValue: {} },
        { provide: SessionStorageService, useValue: storage },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ServicePointComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ServicePointComponent);
    component = fixture.componentInstance;
    spyOn(console, 'log');
  });

  describe('ngOnInit / getServicePoint', () => {
    it('should load ids, language and de-duplicated vans', () => {
      fixture.detectChanges();
      expect(component.serviceProviderId).toBe('13');
      expect(component.userId).toBe('77');
      expect(component.currentLanguageSet).toEqual(LANG);
      expect(component.vansList.map((v: any) => v.vanID)).toEqual([1, 2]);
    });

    it('should alert without redirect on session expiry (5002)', () => {
      routeData$.next({ servicePoints: { statusCode: 5002, errorMessage: 'expired' } });
      fixture.detectChanges();
      expect(confirmation.alert).toHaveBeenCalledWith('expired', 'error');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should alert and redirect to /service on other failures', () => {
      routeData$.next({ servicePoints: { statusCode: 5000, errorMessage: 'fail' } });
      fixture.detectChanges();
      expect(confirmation.alert).toHaveBeenCalledWith('fail', 'error');
      expect(router.navigate).toHaveBeenCalledWith(['/service']);
    });

    it('should alert and redirect when data is null', () => {
      routeData$.next({ servicePoints: { statusCode: 200, data: null, errorMessage: 'none' } });
      fixture.detectChanges();
      expect(router.navigate).toHaveBeenCalledWith(['/service']);
    });

    it('should alert on route data error', () => {
      (TestBed.inject(ActivatedRoute) as any).data = throwError(() => 'boom');
      fixture.detectChanges();
      expect(confirmation.alert).toHaveBeenCalledWith('boom', 'error');
    });
  });

  it('resetLocalStorage should remove session keys', () => {
    component.resetLocalStorage();
    ['sessionID', 'serviceLineDetails', 'vanType', 'location', 'servicePointID', 'servicePointName'].forEach(
      (k) => expect(storage.removeItem).toHaveBeenCalledWith(k),
    );
  });

  describe('getServiceLineDetails', () => {
    beforeEach(() => fixture.detectChanges());

    it('should store van details and load demographics after 500ms', fakeAsync(() => {
      spService.getMMUDemographics.and.returnValue(of({ statusCode: 500 }));
      component.servicePointForm.controls.vanID.setValue(1 as any);
      component.getServiceLineDetails();
      expect(JSON.parse(store['serviceLineDetails']).vanID).toBe(1);
      expect(store['facilityID']).toBe(9);
      expect(store['servicePointID']).toBe(5);
      expect(store['servicePointName']).toBe('SP1');
      expect(store['sessionID']).toBe('3');
      expect(spService.getMMUDemographics).not.toHaveBeenCalled();
      tick(500);
      expect(spService.getMMUDemographics).toHaveBeenCalled();
    }));

    it('should throw when the selected van is not in the list', () => {
      component.servicePointForm.controls.vanID.setValue(99 as any);
      expect(() => component.getServiceLineDetails()).toThrow();
    });
  });

  describe('demographics', () => {
    beforeEach(() => fixture.detectChanges());

    const location = {
      stateMaster: [{ stateID: 1, stateName: 'Assam' }],
      otherLoc: { stateID: 1 },
    };

    it('getDemographics should save location and load districts', () => {
      spService.getMMUDemographics.and.returnValue(ok(location));
      registrar.getDistrictList.and.returnValue(ok([{ districtID: 2 }]));
      component.getDemographics();
      expect(JSON.parse(store['location'])).toEqual(location);
      expect(component.servicePointForm.controls.stateName.value).toBe('Assam');
      expect(registrar.getDistrictList).toHaveBeenCalledWith(1);
      expect(component.districtList).toEqual([{ districtID: 2 }]);
    });

    it('getDemographics should alert on a failed response', () => {
      spService.getMMUDemographics.and.returnValue(of({ statusCode: 5000 }));
      component.getDemographics();
      expect(confirmation.alert).toHaveBeenCalledWith('relogin', 'error');
    });

    it('saveDemographicsToStorage should alert on null or empty state list', () => {
      component.saveDemographicsToStorage(null);
      component.saveDemographicsToStorage({ stateMaster: [] });
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      expect(store['location']).toBeUndefined();
    });

    it('fetchDistrictsOnStateSelection should alert on failure', () => {
      registrar.getDistrictList.and.returnValue(of({ statusCode: 5000 }));
      component.fetchDistrictsOnStateSelection(1);
      expect(confirmation.alert).toHaveBeenCalledWith('demographics issue', 'error');
    });

    it('fetchSubDistrictsOnDistrictSelection should set name and load blocks', () => {
      component.districtList = [{ districtID: 2, districtName: 'Kamrup' }];
      registrar.getSubDistrictList.and.returnValue(ok([{ blockID: 3 }]));
      component.fetchSubDistrictsOnDistrictSelection(2);
      expect(component.servicePointForm.controls.districtName.value).toBe('Kamrup');
      expect(component.subDistrictList).toEqual([{ blockID: 3 }]);
    });

    it('fetchSubDistrictsOnDistrictSelection should alert on failure', () => {
      registrar.getSubDistrictList.and.returnValue(of(null as any));
      component.fetchSubDistrictsOnDistrictSelection(null);
      expect(confirmation.alert).toHaveBeenCalledWith('demographics issue', 'error');
    });

    it('onSubDistrictChange should set block name and load villages', () => {
      component.subDistrictList = [{ blockID: 3, blockName: 'Block A' }];
      registrar.getVillageList.and.returnValue(ok([{ districtBranchID: 4 }]));
      component.onSubDistrictChange(3);
      expect(component.servicePointForm.controls.blockName.value).toBe('Block A');
      expect(component.villageList).toEqual([{ districtBranchID: 4 }]);
    });

    it('onSubDistrictChange should alert on failure', () => {
      registrar.getVillageList.and.returnValue(of({ statusCode: 500 }));
      component.onSubDistrictChange(3);
      expect(confirmation.alert).toHaveBeenCalledWith('location issue', 'error');
    });

    it('onDistrictBranchSelection should set village name only when found', () => {
      component.villageList = [{ districtBranchID: 4, villageName: 'V1' }];
      component.onDistrictBranchSelection(4);
      expect(component.servicePointForm.controls.villageName.value).toBe('V1');
      component.onDistrictBranchSelection(99);
      expect(component.servicePointForm.controls.villageName.value).toBe('V1');
    });
  });

  describe('navigation', () => {
    const routes: [string, string][] = [
      ['Registrar', '/registrar/registration'],
      ['Nurse', '/nurse-doctor/nurse-worklist'],
      ['Doctor', '/nurse-doctor/doctor-worklist'],
      ['Lab Technician', '/lab'],
      ['Pharmacist', '/pharmacist'],
      ['Radiologist', '/nurse-doctor/radiologist-worklist'],
      ['Oncologist', '/nurse-doctor/oncologist-worklist'],
    ];
    routes.forEach(([designation, path]) => {
      it(`should route ${designation} to ${path}`, () => {
        component.routeToDesignation(designation);
        expect(router.navigate).toHaveBeenCalledWith([path]);
      });
    });

    it('should not navigate for an unknown designation', () => {
      component.routeToDesignation('Admin');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('saveLocationDataToStorage should store location and go to worklist', () => {
      component.servicePointForm.patchValue({
        stateID: '1',
        stateName: 'Assam',
        districtBranchID: '4',
        villageName: 'V1',
      });
      component.saveLocationDataToStorage();
      const saved = JSON.parse(store['locationData']);
      expect(saved.stateName).toBe('Assam');
      expect(saved.subDistrictID).toBe('4');
      expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/nurse-worklist']);
    });
  });

  it('ngDoCheck should refresh the language set', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANG);
  });
});
