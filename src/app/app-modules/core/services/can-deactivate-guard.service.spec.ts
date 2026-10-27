import { of } from 'rxjs';
import { CanDeactivateGuardService } from './can-deactivate-guard.service';

describe('CanDeactivateGuardService', () => {
  const guard = new CanDeactivateGuardService();

  it('should return true when component has no canDeactivate', () => {
    expect(guard.canDeactivate({} as any)).toBeTrue();
  });

  it('should delegate to component.canDeactivate (boolean)', () => {
    expect(guard.canDeactivate({ canDeactivate: () => false })).toBeFalse();
  });

  it('should delegate to component.canDeactivate (observable)', () => {
    const obs = of(true);
    expect(guard.canDeactivate({ canDeactivate: () => obs })).toBe(obs);
  });
});
