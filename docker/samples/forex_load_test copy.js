// 1. init
import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { describe, expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js';
import Papa from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// export const options = {
//     stages: [
//         { duration: '5s', target: 10 },
//         { duration: '30s', target: 30 },
//         { duration: '5s', target: 10 },
//       ],
// };


export const options = {    
    scenarios: {
        browseForexRates: {
            executor: 'constant-vus',
            exec: 'browseForexRates',
            vus: 30,
            duration: '30s',
        },
        browseForexRatesAndBookRate: {
            executor: 'constant-vus',
            exec: 'browseForexRatesAndBookRate',
            vus: 20,
            duration: '20s',
        },
        browseForexRatesAndSubmitDeal: {
            executor: 'constant-vus',
            exec: 'browseForexRatesAndSubmitDeal',
            vus: 100,
            duration: '20s',
        }        
    },
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
    return { 
        url: 'http://forex-trade-app:8080',
        minPauseInSecond: 1,
        maxPauseInSecond: 3
    };
}

// Default Flow
export default (config) => {
    // 3. VU code    
    let baseCurrency = obtainBaseCurrency();
    getRatesByBaseCurrency(config.url, baseCurrency);
    pause(config);

    let currencyPair = obtainCurrencyPair();
    getRatesByCurrencyPair(config.url, currencyPair.baseCurrency, currencyPair.counterCurrency);
    pause(config);

    let rateBookingReq = obtainRateBookingReq();
    let rateBookingResult = bookRate(config.url, rateBookingReq);    
    pause(config);

    let dealReq = buildDealReq(rateBookingReq, rateBookingResult);
    submitDeal(config.url, dealReq);
    pause(config);
}


export const browseForexRates = (config) => {
    let baseCurrency = obtainBaseCurrency();
    getRatesByBaseCurrency(config.url, baseCurrency);
    pause(config);

    let currencyPair = obtainCurrencyPair();
    getRatesByCurrencyPair(config.url, currencyPair.baseCurrency, currencyPair.counterCurrency);
    pause(config);
}

export const browseForexRatesAndBookRate = (config) => {
    let baseCurrency = obtainBaseCurrency();
    getRatesByBaseCurrency(config.url, baseCurrency);
    pause(config);

    let currencyPair = obtainCurrencyPair();
    getRatesByCurrencyPair(config.url, currencyPair.baseCurrency, currencyPair.counterCurrency);
    pause(config);

    let rateBookingReq = obtainRateBookingReq();
    let rateBookingResult = bookRate(config.url, rateBookingReq);   
    pause(config);
}

export const browseForexRatesAndSubmitDeal = (config) => {
    // 3. VU code    
    let baseCurrency = obtainBaseCurrency();
    getRatesByBaseCurrency(config.url, baseCurrency);
    pause(config);

    let currencyPair = obtainCurrencyPair();
    getRatesByCurrencyPair(config.url, currencyPair.baseCurrency, currencyPair.counterCurrency);
    pause(config);

    let rateBookingReq = obtainRateBookingReq();
    let rateBookingResult = bookRate(config.url, rateBookingReq);    
    pause(config);

    let dealReq = buildDealReq(rateBookingReq, rateBookingResult);
    submitDeal(config.url, dealReq);
    pause(config);
}

export function teardown(config) {
    // 4. teardown
    // console.log("teardown");
    // console.log(JSON.stringify(config));
}

const getRates0 = (url, baseCurrency) => {
    const res = http.get(http.url`${url}/rates/latest/${baseCurrency}`);
    check(res, { 'status was 200': (r) => r.status == 200 });
}

const getRatesByBaseCurrency = (url, baseCurrency) => {
    describe(`Get Rates By Base Currency`, () => {
        let res = http.get(http.url`${url}/rates/latest/${baseCurrency}`);
        expect(res.status, 'response status').to.equal(200);
        expect(res).to.have.validJsonBody();
    })
}

const getRatesByCurrencyPair = (url, baseCurrency, counterCurrency) => {
    describe(`Get Rates By Pair Currency`, () => {
        let res = http.get(http.url`${url}/rates/latest/${baseCurrency}/${counterCurrency}`);
        expect(res.status, 'response status').to.equal(200);
        expect(res).to.have.validJsonBody();
    })
}

const bookRate = (url, rateBookingReq) => {

    let res = http.post(http.url`${url}/rates/book`, JSON.stringify(rateBookingReq), {
        headers: { 'Content-Type': 'application/json' },
      });

    describe(`Book Rate`, () => {
        expect(res.status, 'response status').to.equal(200);
        expect(res).to.have.validJsonBody();
    })

    return { 
        rateBookingRef: res.json('bookingRef'),
        rate: res.json('rate')
    };
}

const submitDeal = (url, dealReq) => {
    describe(`Submit Deal`, () => {
        let res = http.post(http.url`${url}/deals`, JSON.stringify(dealReq), {
            headers: { 'Content-Type': 'application/json' },
          });
        expect(res.status, 'response status').to.equal(200);
        expect(res).to.have.validJsonBody();
    })
}

const buildDealReq = (rateBookingReq, rateBookingResult) => {
    return {
        baseCurrency: rateBookingReq.baseCurrency,
        counterCurrency: rateBookingReq.counterCurrency,
        baseCurrencyAmount: rateBookingReq.baseCurrencyAmount,
        tradeAction: rateBookingReq.tradeAction,
        rate: rateBookingResult.rate,
        customerId: rateBookingReq.customerId,
        rateBookingRef: rateBookingResult.rateBookingRef
    }
}

const pause = (config) => {
    sleep(randomIntBetween(config.minPauseInSecond, config.maxPauseInSecond));   
}

const obtainBaseCurrency = () => {
    return baseCurrencies[randomIntBetween(0, baseCurrencies.length - 1)];
}

const obtainCurrencyPair = () => {
    return currencyPairs[randomIntBetween(0, currencyPairs.length - 1)];
}

const obtainRateBookingReq = () => {
    return rateBookingReqs[randomIntBetween(0, rateBookingReqs.length - 1)];
}