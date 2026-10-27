import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { HttpServiceService } from '../services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ConfirmatoryDiagnosisDirective } from './confirmatory-diagnosis.directive';
import { DiagnosisSearchComponent } from '../components/diagnosis-search/diagnosis-search.component';

describe('ConfirmatoryDiagnosisDirective', () => {
  const fb = new FormBuilder();
  const lang$ = new BehaviorSubject<any>({ confirmDiagnosis: 'Confirmatory' });
  let dialog: jasmine.SpyObj<MatDialog>;
  let el: { nativeElement: { nodeName: string } };
  let formArray: FormArray;
  let directive: ConfirmatoryDiagnosisDirective;

  const row = (term: string | null = null) =>
    fb.group({ conceptID: null, term: null, viewConfirmatoryDiagnosisProvided: term });

  const create = () => {
    const d = new ConfirmatoryDiagnosisDirective(
      fb,
      el as any,
      dialog,
      { currentLangugae$: lang$.asObservable() } as HttpServiceService,
      {} as SessionStorageService,
    );
    d.diagnosisListForm = formArray.at(formArray.length - 1);
    d.previousSelected = [{ term: 'old' }];
    return d;
  };

  beforeEach(() => {
    spyOn(console, 'log');
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    el = { nativeElement: { nodeName: 'INPUT' } };
    formArray = fb.array([row('fev')]);
    directive = create();
    directive.ngOnInit();
  });

  const closeWith = (result: any) =>
    dialog.open.and.returnValue({ afterClosed: () => of(result) } as any);

  it('should not open the dialog for search terms of 2 chars or less', () => {
    formArray.at(0).patchValue({ viewConfirmatoryDiagnosisProvided: 'ab' });
    directive.openDialog();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should open the search dialog with term and previous selection', () => {
    closeWith(null);
    directive.openDialog();
    expect(dialog.open).toHaveBeenCalledWith(DiagnosisSearchComponent, {
      width: '800px',
      data: {
        searchTerm: 'fev',
        addedDiagnosis: [{ term: 'old' }],
        diagonasisType: 'Confirmatory',
      },
    });
  });

  it('should leave the form untouched when dialog is cancelled', () => {
    closeWith(undefined);
    directive.openDialog();
    expect(formArray.length).toBe(1);
    expect(formArray.at(0).value.term).toBeNull();
    expect(formArray.dirty).toBeFalse();
  });

  it('should fill the current row for a single selection', () => {
    closeWith([{ term: 'Fever', conceptID: 'C1' }]);
    directive.openDialog();
    const g = formArray.at(0) as FormGroup;
    expect(formArray.length).toBe(1);
    expect(g.controls['term'].value).toBe('Fever');
    expect(g.controls['conceptID'].value).toBe('C1');
    expect(g.controls['viewConfirmatoryDiagnosisProvided'].value).toBe('Fever');
    expect(g.controls['viewConfirmatoryDiagnosisProvided'].disabled).toBeTrue();
    expect(g.dirty).toBeTrue();
  });

  it('should add rows for multiple selections', () => {
    closeWith([
      { term: 'Fever', conceptID: 'C1' },
      { term: 'Cough', conceptID: 'C2' },
      { term: 'Cold', conceptID: 'C3' },
    ]);
    directive.openDialog();
    expect(formArray.length).toBe(3);
    expect(formArray.getRawValue().map((r: any) => r.conceptID)).toEqual([
      'C1',
      'C2',
      'C3',
    ]);
  });

  it('should fill from the last row when earlier rows exist', () => {
    formArray = fb.array([row('x'), row('cou')]);
    directive = create();
    directive.ngOnInit();
    closeWith([{ term: 'Cough', conceptID: 'C2' }]);
    directive.openDialog();
    expect(formArray.length).toBe(2);
    expect(formArray.at(0).value.term).toBeNull();
    expect(formArray.at(1).getRawValue().term).toBe('Cough');
  });

  it('should throw when the search field is empty', () => {
    formArray.at(0).patchValue({ viewConfirmatoryDiagnosisProvided: null });
    expect(() => directive.openDialog()).toThrow();
  });

  it('click should open dialog only for non-input hosts', () => {
    spyOn(directive, 'openDialog');
    directive.onClick();
    expect(directive.openDialog).not.toHaveBeenCalled();
    el.nativeElement.nodeName = 'BUTTON';
    directive.onClick();
    expect(directive.openDialog).toHaveBeenCalled();
  });

  it('enter key should open dialog', () => {
    spyOn(directive, 'openDialog');
    directive.onKeyDown();
    expect(directive.openDialog).toHaveBeenCalled();
  });

  it('should throw if opened before the language set is loaded', () => {
    directive = create();
    directive.currentLanguageSet = undefined;
    expect(() => directive.openDialog()).toThrow();
  });

  it('should refresh the language set on ngDoCheck', () => {
    lang$.next({ confirmDiagnosis: 'Updated' });
    directive.ngDoCheck();
    expect(directive.currentLanguageSet.confirmDiagnosis).toBe('Updated');
  });
});
