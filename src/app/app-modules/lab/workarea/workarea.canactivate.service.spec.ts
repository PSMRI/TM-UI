import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { WorkareaCanActivate } from './workarea.canactivate.service';

describe('WorkareaCanActivate (lab)', () => {
  let store: Record<string, any>;
  let guard: WorkareaCanActivate;

  const KEYS = [
    'visitCode',
    'benFlowID',
    'visitCategory',
    'beneficiaryRegID',
    'visitID',
    'beneficiaryID',
    'doctorFlag',
    'nurseFlag',
  ];

  const activate = () => guard.canActivate({} as any, {} as any);

  beforeEach(() => {
    store = {};
    KEYS.forEach((k) => (store[k] = '1'));
    guard = new WorkareaCanActivate({
      getItem: (k: string) => store[k] ?? null,
    } as SessionStorageService);
  });

  it('should allow when every required key is present', () => {
    expect(activate()).toBeTrue();
  });

  KEYS.forEach((missing) => {
    it(`should block when ${missing} is missing`, () => {
      delete store[missing];
      expect(activate()).toBeFalse();
    });
  });

  it('should block when a flag is 0 (falsy)', () => {
    store['doctorFlag'] = 0;
    expect(activate()).toBeFalse();
  });

  it('should block on an empty session', () => {
    store = {};
    expect(activate()).toBeFalse();
  });
});
