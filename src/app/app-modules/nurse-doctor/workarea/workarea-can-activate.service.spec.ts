import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { WorkareaCanActivate } from './workarea-can-activate.service';

describe('WorkareaCanActivate (nurse-doctor)', () => {
  let store: Record<string, any>;
  let guard: WorkareaCanActivate;

  const VISIT_KEYS = [
    'visitCode',
    'beneficiaryGender',
    'benFlowID',
    'visitCategory',
    'beneficiaryRegID',
    'visitID',
    'beneficiaryID',
    'nurseFlag',
  ];
  const REGISTRATION_KEYS = [
    'beneficiaryGender',
    'beneficiaryRegID',
    'beneficiaryID',
    'benFlowID',
  ];

  const fill = (keys: string[]) => keys.forEach((k) => (store[k] = 'x'));

  beforeEach(() => {
    store = {};
    guard = new WorkareaCanActivate({
      getItem: (k: string) => store[k] ?? null,
    } as SessionStorageService);
  });

  describe('with a visit category', () => {
    it('should allow when every visit key is present', () => {
      fill(VISIT_KEYS);
      expect(guard.canActivate()).toBeTrue();
    });

    VISIT_KEYS.filter((k) => k !== 'visitCategory').forEach((missing) => {
      it(`should block when ${missing} is missing`, () => {
        fill(VISIT_KEYS);
        delete store[missing];
        expect(guard.canActivate()).toBeFalse();
      });
    });

    it('should treat empty strings as missing', () => {
      fill(VISIT_KEYS);
      store['nurseFlag'] = '';
      expect(guard.canActivate()).toBeFalse();
    });
  });

  describe('without a visit category (new registration)', () => {
    it('should allow when beneficiary keys are present', () => {
      fill(REGISTRATION_KEYS);
      expect(guard.canActivate()).toBeTrue();
    });

    REGISTRATION_KEYS.forEach((missing) => {
      it(`should block when ${missing} is missing`, () => {
        fill(REGISTRATION_KEYS);
        delete store[missing];
        expect(guard.canActivate()).toBeFalse();
      });
    });

    it('should block when session is empty', () => {
      expect(guard.canActivate()).toBeFalse();
    });
  });
});
