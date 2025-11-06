import 'reflect-metadata';

process.env.TZ = 'UTC';

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
