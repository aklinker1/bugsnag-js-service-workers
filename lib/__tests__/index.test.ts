import { OnErrorCallback } from '@bugsnag/core';
import chance from 'chance';
import { postEvent } from '../http';
import type BugsnagClient from '../index';

jest.mock('../http');
const postEventMock = jest.mocked(postEvent);

const addEventListenerSpy = jest.spyOn(self, 'addEventListener');

const rand = chance();

function sleep(ms = 0) {
  return new Promise(res => setTimeout(res, ms));
}

describe('Windowless Bugsnag Client', () => {
  let Bugsnag: typeof BugsnagClient;

  function resetBugsnag() {
    jest.isolateModules(() => {
      Bugsnag = require('../index').default;
    });
  }

  beforeEach(resetBugsnag);

  describe('config', () => {
    describe('apiKey', () => {
      it('should be passed via the event when sending the event to bugsnag', () => {
        const apiKey = rand.string();
        Bugsnag.start(apiKey);
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(event).toMatchObject({
          apiKey,
        });
      });
    });

    describe('appType', () => {
      it('should be passed via the event when sending the event to bugsnag', () => {
        const appType = rand.string();

        Bugsnag.start({
          apiKey: rand.string(),
          appType,
        });
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(event.app?.type).toBe(appType);
      });
    });

    describe('appVersion', () => {
      it('should be passed via the event when sending the event to bugsnag', () => {
        const appVersion = rand.string();

        Bugsnag.start({
          apiKey: rand.string(),
          appVersion,
        });
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(event.app?.version).toBe(appVersion);
      });
    });

    describe('autoDetectErrors', () => {
      it.each([undefined, true])('should listen for global errors when %s', autoDetectErrors => {
        Bugsnag.start({
          apiKey: rand.string(),
          autoDetectErrors,
        });

        expect(addEventListenerSpy).toBeCalledWith('error', expect.any(Function));
        expect(addEventListenerSpy).toBeCalledWith('unhandledrejection', expect.any(Function));
      });

      it('should not listen for global errors when false', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          autoDetectErrors: false,
        });

        expect(addEventListenerSpy).not.toBeCalled();
      });
    });

    describe('context', () => {
      it('should be passed via the event when sending the event to bugsnag', () => {
        const context = rand.string();

        Bugsnag.start({
          apiKey: rand.string(),
          context,
        });
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(event.context).toBe(context);
      });
    });

    describe('enabledBreadcrumbTypes', () => {
      it('should accept all types of breadcrumbs when undefined', () => {
        Bugsnag.start({
          apiKey: rand.string(),
        });
        console.log(rand.string());
        Bugsnag.leaveBreadcrumb(rand.string(), undefined, 'error');
        Bugsnag.leaveBreadcrumb(rand.string(), undefined, 'manual');
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(event.breadcrumbs).toHaveLength(3);
        expect(event.breadcrumbs[0]).toMatchObject({ type: 'manual' });
        expect(event.breadcrumbs[1]).toMatchObject({ type: 'error' });
        expect(event.breadcrumbs[2]).toMatchObject({ type: 'log' });
      });

      it('should not add error breadcrumbs when notify is called if "error" is excluded from the list', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          enabledBreadcrumbTypes: ['log', 'manual'],
        });
        console.log(rand.string());
        Bugsnag.leaveBreadcrumb(rand.string(), undefined, 'error');
        Bugsnag.leaveBreadcrumb(rand.string(), undefined, 'manual');
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(event.breadcrumbs).toHaveLength(2);
        expect(event.breadcrumbs[0]).toMatchObject({ type: 'manual' });
        expect(event.breadcrumbs[1]).toMatchObject({ type: 'log' });
      });

      it('should not add log breadcrumbs when console methods are called if "log" is excluded from the list', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          enabledBreadcrumbTypes: ['error', 'manual'],
        });
        console.log(rand.string());
        Bugsnag.leaveBreadcrumb(rand.string(), undefined, 'error');
        Bugsnag.leaveBreadcrumb(rand.string(), undefined, 'manual');
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(event.breadcrumbs).toHaveLength(2);
        expect(event.breadcrumbs[0]).toMatchObject({ type: 'manual' });
        expect(event.breadcrumbs[1]).toMatchObject({ type: 'error' });
      });
    });

    describe('enabledErrorTypes', () => {
      it('should not override autoDetectErrors', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          autoDetectErrors: false,
          enabledErrorTypes: {
            unhandledExceptions: true,
            unhandledRejections: true,
          },
        });

        expect(addEventListenerSpy).not.toBeCalled();
      });

      it.each([undefined, true])(
        'should setup error listeners when unhandledExceptions=%s',
        unhandledExceptions => {
          Bugsnag.start({
            apiKey: rand.string(),
            enabledErrorTypes: {
              unhandledExceptions,
            },
          });

          expect(addEventListenerSpy).toBeCalledWith('error', expect.any(Function));
        },
      );

      it('should not setup error listeners when unhandledExceptions=false', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          enabledErrorTypes: {
            unhandledExceptions: false,
          },
        });

        expect(addEventListenerSpy).not.toBeCalledWith('error', expect.any(Function));
      });

      it.each([undefined, true])(
        'should setup unhandledrejection listeners when unhandledRejections=%s',
        unhandledRejections => {
          Bugsnag.start({
            apiKey: rand.string(),
            enabledErrorTypes: {
              unhandledRejections,
            },
          });

          expect(addEventListenerSpy).toBeCalledWith('unhandledrejection', expect.any(Function));
        },
      );

      it('should not setup unhandledrejection listeners when unhandledRejections=false', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          enabledErrorTypes: {
            unhandledRejections: false,
          },
        });

        expect(addEventListenerSpy).not.toBeCalledWith('unhandledrejection', expect.any(Function));
      });
    });

    describe('enabledReleaseStages', () => {
      it('should send events to bugsnag when undefined', () => {
        Bugsnag.start(rand.string());
        Bugsnag.notify(rand.string());

        expect(postEventMock).toBeCalled();
      });

      it('should not send events to bugsnag when the release stage is not included in this list', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          releaseStage: 'development',
          enabledReleaseStages: ['staging', 'production'],
        });
        Bugsnag.notify(rand.string());

        expect(postEventMock).not.toBeCalled();
      });

      it.each(['staging', 'production'])(
        "should send events to bugsnag when the release stage is %s and it's included in this list",
        releaseStage => {
          Bugsnag.start({
            apiKey: rand.string(),
            releaseStage,
            enabledReleaseStages: ['staging', 'production'],
          });
          Bugsnag.notify(rand.string());

          expect(postEventMock).toBeCalled();
        },
      );
    });

    describe('endpoints', () => {
      it('should be passed via the config when sending the event to bugsnag', () => {
        const endpoints = {
          notify: rand.string(),
          sessions: rand.string(),
        };

        Bugsnag.start({
          apiKey: rand.string(),
          endpoints,
        });
        Bugsnag.notify(rand.string());

        const config = postEventMock.mock.calls[0][2];
        expect(config.endpoints).toBe(endpoints);
      });
    });

    describe('featureFlags', () => {
      it('should initialize the internal feature flags to match when calling start()', () => {
        const featureFlags = [
          {
            name: 'flag1',
            variant: 'red',
          },
          {
            name: 'flag2',
          },
        ];

        Bugsnag.start({
          apiKey: rand.string(),
          featureFlags,
        });
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        // @ts-expect-error
        expect(event.toJSON().featureFlags).toEqual([
          {
            featureFlag: 'flag1',
            variant: 'red',
          },
          {
            featureFlag: 'flag2',
          },
        ]);
      });
    });

    describe('generateAnonymousId', () => {
      const storageKey = 'bugsnag-user-id';

      beforeEach(() => {
        localStorage.removeItem(storageKey);
      });

      it.each([true, undefined])(
        "should generate an id when %s and one doesn't already exist",
        generateAnonymousId => {
          Bugsnag.start({
            apiKey: rand.string(),
            generateAnonymousId,
          });

          const storedValue = localStorage.getItem(storageKey);
          const internalValue = Bugsnag.getUser().id;
          expect(storedValue).toHaveLength(10);
          expect(internalValue).toEqual(storedValue);
        },
      );

      it.each([true, undefined])(
        'should not generate an id when %s and one already exists',
        generateAnonymousId => {
          Bugsnag.start({
            apiKey: rand.string(),
            generateAnonymousId,
          });
          const initialUserId = Bugsnag.getUser().id;

          resetBugsnag();
          Bugsnag.start({
            apiKey: rand.string(),
            generateAnonymousId,
          });

          const secondUserId = Bugsnag.getUser().id;
          expect(secondUserId).toEqual(initialUserId);
        },
      );

      it('should not generate an id when false', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          generateAnonymousId: false,
        });

        expect(localStorage.getItem(storageKey)).toBeNull();
        expect(Bugsnag.getUser().id).toBeUndefined();
      });
    });

    describe('logger', () => {
      it('should not log anything when null', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          logger: null,
        });
        Bugsnag.notify(rand.string());

        const config = postEventMock.mock.calls[0][2];
        expect(config.logger).toBeFalsy();
      });

      it('should use console.* to log when undefined', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          logger: undefined,
        });
        Bugsnag.notify(rand.string());

        const config = postEventMock.mock.calls[0][2];
        expect(config.logger).toBeDefined();
      });

      it('should use a custom logger when passed', () => {
        const logger = {
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        };

        Bugsnag.start({
          apiKey: rand.string(),
          logger,
        });
        Bugsnag.notify(rand.string());

        const config = postEventMock.mock.calls[0][2];
        expect(config.logger).toBe(logger);
      });
    });

    describe('maxBreadcrumbs', () => {
      it('should effect the total number of breadcrumbs sent to bugsnag', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          maxBreadcrumbs: 2,
        });

        Bugsnag.leaveBreadcrumb('1');
        Bugsnag.leaveBreadcrumb('2');
        Bugsnag.leaveBreadcrumb('3');
        Bugsnag.leaveBreadcrumb('4');

        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(event.breadcrumbs).toHaveLength(2);
        expect(event.breadcrumbs[0]).toMatchObject({ message: '4' });
        expect(event.breadcrumbs[1]).toMatchObject({ message: '3' });
      });

      it("should default to 25, matching @bugsnag/js's default", () => {
        Bugsnag.start({
          apiKey: rand.string(),
        });

        for (let i = 0; i < 30; i++) {
          Bugsnag.leaveBreadcrumb(`i=${i}`);
        }

        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(event.breadcrumbs).toHaveLength(25);
      });
    });

    describe('metadata', () => {
      it('should be passed via the event when sending the event to bugsnag', () => {
        const metadata = {
          test: {
            key: 'value',
          },
        };

        Bugsnag.start({
          apiKey: rand.string(),
          metadata,
        });
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        // @ts-expect-error
        expect(event._metadata).toMatchObject(metadata);
      });
    });

    describe('onBreadcrumb', () => {
      it('should be run when leaving a breadcrumb', () => {
        const cb1 = jest.fn();
        const cb2 = jest.fn().mockReturnValue(true);

        Bugsnag.start({
          apiKey: rand.string(),
          onBreadcrumb: [cb1, cb2],
        });
        Bugsnag.leaveBreadcrumb(rand.string());
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(cb1).toBeCalledTimes(1);
        expect(cb2).toBeCalledTimes(1);
        expect(event.breadcrumbs).toHaveLength(1);
      });

      it('should be able to prevent leaving a breadcrumb by returning false', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          onBreadcrumb: () => false,
        });
        Bugsnag.leaveBreadcrumb(rand.string());
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        expect(event.breadcrumbs).toHaveLength(0);
      });
    });

    describe('onError', () => {
      it('should be run when calling notify()', () => {
        const cb1 = jest.fn();
        const cb2 = jest.fn().mockResolvedValue(undefined);

        Bugsnag.start({
          apiKey: rand.string(),
          onError: [cb1, cb2],
        });
        Bugsnag.notify(rand.string());

        expect(cb1).toBeCalledTimes(1);
        expect(cb2).toBeCalledTimes(1);
      });

      it.each<OnErrorCallback>([
        () => false,
        () => Promise.resolve(false),
        async () => false,
        (_, cb) => cb(Error('test')),
        (_, cb) => cb(null, false),
        async (_, cb) => {
          await Promise.resolve();
          cb(Error('test'));
        },
        async (_, cb) => {
          await Promise.resolve();
          cb(null, false);
        },
      ])('should be able to prevent sending data to bugsnag', async onError => {
        Bugsnag.start({
          apiKey: rand.string(),
          onError,
        });

        Bugsnag.notify(rand.string());
        await sleep(1);

        expect(postEventMock).not.toBeCalled();
      });

      it.each<OnErrorCallback>([
        () => true,
        () => Promise.resolve(true),
        () => undefined,
        () => {},
        () => Promise.resolve(undefined),
        async () => true,
        (_, cb) => cb(null),
        (_, cb) => cb(null, true),
        async (_, cb) => {
          await Promise.resolve();
          cb(null);
        },
        async (_, cb) => {
          await Promise.resolve();
          cb(null, true);
        },
      ])('should not prevent sending data to bugsnag', async onError => {
        Bugsnag.start({
          apiKey: rand.string(),
          onError,
        });

        Bugsnag.notify(rand.string());
        await sleep(1);

        expect(postEventMock).toBeCalledTimes(1);
      });
    });

    describe('plugins', () => {
      const plugin1 = {
        load: jest.fn(),
        destroy: jest.fn(),
      };
      const plugin2 = {
        load: jest.fn(),
      };

      it('should load them when calling start()', () => {
        Bugsnag.start({
          apiKey: rand.string(),
          plugins: [plugin1, plugin2],
        });

        expect(plugin1.load).toBeCalledWith(Bugsnag);
        expect(plugin2.load).toBeCalledWith(Bugsnag);
      });

      it('should not load them yet when calling createClient()', () => {
        Bugsnag.createClient({
          apiKey: rand.string(),
          plugins: [plugin1, plugin2],
        });

        expect(plugin1.load).not.toBeCalled();
        expect(plugin2.load).not.toBeCalled();
      });

      it('should load them when calling startSession()', () => {
        const client = Bugsnag.createClient({
          apiKey: rand.string(),
          plugins: [plugin1, plugin2],
        });

        client.startSession();

        expect(plugin1.load).toBeCalledWith(client);
        expect(plugin2.load).toBeCalledWith(client);
      });

      it('should destroy them when calling pauseSession()', () => {
        const client = Bugsnag.createClient({
          apiKey: rand.string(),
          plugins: [plugin1, plugin2],
        });

        client.pauseSession();

        expect(plugin1.destroy).toBeCalled();
      });

      it('should load them again when calling resumeSession()', () => {
        const client = Bugsnag.createClient({
          apiKey: rand.string(),
          plugins: [plugin1, plugin2],
        });

        client.startSession();
        client.pauseSession();
        jest.clearAllMocks();
        client.resumeSession();

        expect(plugin1.load).toBeCalledWith(client);
        expect(plugin2.load).toBeCalledWith(client);
      });
    });

    describe('redactedKeys', () => {
      it('should replace any value for metadata values for matching key with "[REDACTED]"', () => {
        const input = {
          section: {
            'redacted-key-1': rand.natural(),
            'redacted-key-a': { 'redacted-key-1': rand.string() },
            'other-key-1': rand.string(),
            'other-key-2': [rand.string(), { 'redacted-key-b': rand.string() }],
          },
        };
        const expected = {
          section: {
            'redacted-key-1': '[REDACTED]',
            'redacted-key-a': '[REDACTED]',
            'other-key-1': input.section['other-key-1'],
            'other-key-2': [input.section['other-key-2'][0], { 'redacted-key-b': '[REDACTED]' }],
          },
        };
        Bugsnag.start({
          apiKey: rand.string(),
          metadata: input,
          redactedKeys: ['redacted-key-1', /redacted-key-[a-z]/],
        });
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        // @ts-expect-error
        expect(event._metadata).toMatchObject(expected);
      });
    });

    describe('releaseStage', () => {
      it('should be passed via the event.app and config when sending the event to bugsnag', () => {
        const releaseStage = rand.string();

        Bugsnag.start({
          apiKey: rand.string(),
          releaseStage,
        });
        Bugsnag.notify(rand.string());

        const event = postEventMock.mock.calls[0][0];
        const config = postEventMock.mock.calls[0][2];
        expect(event.app.releaseStage).toBe(releaseStage);
        expect(config.releaseStage).toBe(releaseStage);
      });
    });

    describe('user', () => {
      it('should be passed via the event when sending the event to bugsnag', () => {
        const user = {
          name: rand.string(),
          email: rand.email(),
        };

        Bugsnag.start({
          apiKey: rand.string(),
          user,
        });
        Bugsnag.notify(rand.string());

        const config = postEventMock.mock.calls[0][2];
        expect(config.user).toEqual({ ...user, id: expect.any(String) });
      });

      it('should use the specified id instead of generating one', () => {
        const user = {
          id: rand.string(),
          name: rand.string(),
          email: rand.email(),
        };

        Bugsnag.start({
          apiKey: rand.string(),
          user,
        });
        Bugsnag.notify(rand.string());

        const config = postEventMock.mock.calls[0][2];
        expect(config.user).toEqual(user);
      });
    });
  });

  describe('internal logger', () => {
    it('should not log anything when null', () => {
      Bugsnag.start({
        apiKey: rand.string(),
        logger: null,
      });
      Bugsnag.notify(rand.string());

      const config = postEventMock.mock.calls[0][2];
      expect(config.logger).toBeFalsy();
    });

    it('should use the unmodified console.* to log otherwise', () => {
      Bugsnag.start({
        apiKey: rand.string(),
        logger: rand.pickone([undefined, console]),
      });
      Bugsnag.notify(rand.string());

      const internalLogger = postEventMock.mock.calls[0][1];
      expect(internalLogger).toBeDefined();
      expect(internalLogger?.debug).not.toEqual(console.debug); // because console.debug isn't the original at this point
    });
  });
});
