import { SpinnerService, SpinnerState } from './spinner.service';

describe('SpinnerService', () => {
  let service: SpinnerService;
  let states: SpinnerState[];

  beforeEach(() => {
    service = new SpinnerService();
    states = [];
    service.spinnerState.subscribe((s) => states.push(s));
  });

  it('setLoading / getLoading should round-trip', () => {
    expect(service.getLoading()).toBeFalse();
    service.setLoading(true);
    expect(service.getLoading()).toBeTrue();
  });

  it('show should emit only for the first concurrent request', () => {
    service.show();
    service.show();
    expect(states).toEqual([{ show: true }]);
    expect(service.temp.length).toBe(2);
  });

  it('hide should emit false only when all requests are done', () => {
    service.show();
    service.show();
    service.hide();
    expect(states).toEqual([{ show: true }]);
    service.hide();
    expect(states).toEqual([{ show: true }, { show: false }]);
  });

  it('hide with nothing pending should still emit false', () => {
    service.hide();
    expect(service.temp.length).toBe(0);
    expect(states).toEqual([{ show: false }]);
  });

  it('clear should reset and emit false', () => {
    service.show();
    service.show();
    service.clear();
    expect(service.temp.length).toBe(0);
    expect(states[states.length - 1]).toEqual({ show: false });
  });
});
