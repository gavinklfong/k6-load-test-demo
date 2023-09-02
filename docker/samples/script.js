// 1. init
import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { describe, expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js';
import Papa from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

const CURRENCY_PAIRS = [
    {base: 'AUD', counter: 'CAD'},
    {base: 'AUD', counter: 'NZD'},
    {base: 'CAD', counter: 'CHF'},
    {base: 'CAD', counter: 'JPY'},
    {base: 'CHF', counter: 'JPY'},
    {base: 'EUR', counter: 'CAD'},
    {base: 'EUR', counter: 'CHF'}
];

export const options = {
    // stages: [
    //     { duration: '5s', target: 3 },
        // { duration: '10s', target: 10 },
        // { duration: '5s', target: 5 },
    //   ],
};

const baseCurrencies = new SharedArray('baseCurrencies', function () {
    const data = open('/scripts/resources/baseCurrencies.csv');
    return Papa.parse(data, {header: false, skipEmptyLines: true}).data;
  });

const currencyPairs = new SharedArray('currencyPairs', function () {
    const data = open('/scripts/resources/currencyPairs.csv');
    return Papa.parse(data, {header: true, skipEmptyLines: true}).data;
  });

const rateBookingReqs = new SharedArray('rateBookingReqs', function () {
    const data = open('/scripts/resources/rateBookingReqs.csv');
    return Papa.parse(data, {header: true, skipEmptyLines: true}).data;
  });

export function setup() {
    // 2. setup
    console.log("setup");
    return { "url": 'http://forex-trade-app:8080' };
}

export default (config) => {
    // 3. VU code
    // const res = http.get('http://forex-trade-app:8080/rates/latest');
    // console.log(JSON.stringify(res.json('1.timestamp')));
    // console.log(res.json('1.timestamp'));
    // let rate1 = res.json('1');
    // console.log(`counter currency: ${rate1.counterCurrency}`);
    // check(res, { 'status was 200': (r) => r.status == 200 });
    
    let baseCurrency = baseCurrencies[randomIntBetween(0, baseCurrencies.length - 1)];
    getRatesByBaseCurrency(config.url, baseCurrency);

    let currencyPair = currencyPairs[randomIntBetween(0, currencyPairs.length - 1)];
    getRatesByCurrencyPair(config.url, currencyPair.baseCurrency, currencyPair.counterCurrency);

    let rateBookingReq = rateBookingReqs[randomIntBetween(0, rateBookingReqs.length - 1)];
    bookRate(config.url, rateBookingReq);
    sleep(1);
}

export function teardown(config) {
    // 4. teardown
    console.log("teardown");
    console.log(JSON.stringify(config));
}

const getRates0 = (url, baseCurrency) => {
    const res = http.get(http.url`${url}/rates/latest/${baseCurrency}`);
    check(res, { 'status was 200': (r) => r.status == 200 });
}

const getRatesByBaseCurrency = (url, baseCurrency) => {
    describe(`Get Rates By Base Currency - ${baseCurrency}`, () => {
        let res = http.get(http.url`${url}/rates/latest/${baseCurrency}`);
        expect(res.status, "response status").to.equal(200);
        expect(res).to.have.validJsonBody();
    })
}

const getRatesByCurrencyPair = (url, baseCurrency, counterCurrency) => {
    describe(`Get Rates By Pair Currency - ${baseCurrency}, ${counterCurrency}`, () => {
        let res = http.get(http.url`${url}/rates/latest/${baseCurrency}/${counterCurrency}`);
        expect(res.status, "response status").to.equal(200);
        expect(res).to.have.validJsonBody();
    })
}

const bookRate = (url, rateBookingReq) => {
    describe(`Book Rate By Pair Currency - ${rateBookingReq.baseCurrency}, ${rateBookingReq.counterCurrency}`, () => {
        let res = http.post(http.url`${url}/rates/book`, JSON.stringify(rateBookingReq), {
            headers: { 'Content-Type': 'application/json' },
          });
        expect(res.status, "response status").to.equal(200);
        expect(res).to.have.validJsonBody();
    })
}