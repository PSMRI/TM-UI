import { BehaviorSubject, Observable } from 'rxjs';
import { SetLanguageComponent } from './set-language.component';
import { HttpServiceService } from '../services/http-service.service';

describe('SetLanguageComponent', () => {
  it('should take the current language set', () => {
    const lang$ = new BehaviorSubject<any>({ hello: 'Hello' });
    const comp = new SetLanguageComponent({
      currentLangugae$: lang$.asObservable(),
    } as HttpServiceService);
    comp.setLanguage();
    expect(comp.currentLanguageObject).toEqual({ hello: 'Hello' });
  });

  it('should not track later language changes (unsubscribes immediately)', () => {
    const lang$ = new BehaviorSubject<any>({ v: 1 });
    const comp = new SetLanguageComponent({
      currentLangugae$: lang$.asObservable(),
    } as HttpServiceService);
    comp.setLanguage();
    lang$.next({ v: 2 });
    expect(comp.currentLanguageObject).toEqual({ v: 1 });
  });

  it('should log and keep undefined on stream error', () => {
    spyOn(console, 'log');
    const comp = new SetLanguageComponent({
      currentLangugae$: new Observable((s) => s.error('boom')),
    } as any);
    comp.setLanguage();
    expect(comp.currentLanguageObject).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith('boom');
  });
});
