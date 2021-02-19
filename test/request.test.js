const { describe, it, before, afterEach } = require('mocha');
const assert = require('assert');
const Events = require('events');
const Request = require('../src/request');
const { createSandbox } = require('sinon');

const timeout = 15;

describe('Request helpers', () => {
    let sandbox;
    let request;

    before(() => {
        sandbox = createSandbox();
        request = new Request();
    });

    afterEach(() => sandbox.restore());

    it(`should throw a timeout error when function has spen more than ${timeout}ms`, async () => {
        const exceededTimeout = timeout + 10;
        sandbox.stub(request, request.get.name)
            .callsFake(() => new Promise(r => setTimeout(r, exceededTimeout)));

        const call = request.makeRequest({
            url: 'http://testing.com',
            method: 'get',
            timeout
        });

        await assert.rejects(call, { message: 'Error at [http://testing.com] :(' });
    });

    it('should return ok when promise time is ok', async () => {
        const expected = { ok: 'ok' };

        sandbox.stub(request, request.get.name)
            .callsFake(async () => {
                await new Promise(r => setTimeout(r))
                return expected;
            });

        const call= () => request.makeRequest({
            url: 'http://testing.com',
            method: 'get',
            timeout
        });

        await assert.doesNotReject(call());
        assert.deepStrictEqual(await call(), expected);
    });

    it('should return a json objetct after a request', async () => {
        const data = [
            Buffer.from('{"ok": '),
            Buffer.from('"ok"'),
            Buffer.from('}')
        ];
        const responseEvent = new Events();
        const httpEvent = new Events();

        const https = require('https');
        sandbox.stub(https, https.get.name)
            .yields(responseEvent)
            .returns(httpEvent);

        const expected = { ok: 'ok' };
        const pendingPromise = request.get('https://testing.com');
        
        responseEvent.emit('data', data[0]);
        responseEvent.emit('data', data[1]);
        responseEvent.emit('data', data[2]);
        responseEvent.emit('end');

        const result = await pendingPromise;
        assert.deepStrictEqual(result, expected);
    });
});