import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  it('hides unknown error details from clients', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const filter = new AllExceptionsFilter();
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/api/bookings' }),
        getResponse: () => ({ status }),
      }),
    };

    filter.catch(new Error('database password leaked'), host as never);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal Server Error',
        message: 'Internal server error',
        path: '/api/bookings',
        statusCode: 500,
      }),
    );
  });
});
