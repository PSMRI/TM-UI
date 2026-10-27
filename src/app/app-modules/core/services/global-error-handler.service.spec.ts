import { GlobalErrorHandler } from './global-error-handler.service';

describe('GlobalErrorHandler', () => {
  it('should log and re-throw the error', () => {
    const handler = new GlobalErrorHandler();
    spyOn(console, 'log');
    const err = new Error('boom');
    expect(() => handler.handleError(err)).toThrow(err);
    expect(console.log).toHaveBeenCalledWith(err);
  });
});
