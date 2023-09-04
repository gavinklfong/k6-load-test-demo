// 1. init
import { sleep, check } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import Papa from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// export const options = {
//     stages: [
//         { duration: '5s', target: 10 },
//         { duration: '30s', target: 30 },
//         { duration: '5s', target: 10 },
//       ],
// };


const baseCurrencies = new SharedArray('baseCurrencies', function () {
    const data = open('./resources/baseCurrencies.csv');
    return Papa.parse(data, {header: false, skipEmptyLines: true}).data;
  });

const currencyPairs = new SharedArray('currencyPairs', function () {
    const data = open('./resources/currencyPairs.csv');
    return Papa.parse(data, {header: true, skipEmptyLines: true}).data;
  });

const rateBookingReqs = new SharedArray('rateBookingReqs', function () {
    const data = open('./resources/rateBookingReqs.csv');
    return Papa.parse(data, {header: true, skipEmptyLines: true}).data;
  });

// 2. setup  
export const setup = () => {
    return { 
        url: 'http://localhost:8080',
        minPauseInSecond: 1,
        maxPauseInSecond: 3
    };
}

// 3. VU code - repeated executed per VU
export default (config) => {  
    let baseCurrency = obtainBaseCurrency();
    let res = http.get(`${config.url}/rates/latest/${baseCurrency}`);
    check(res, {'response code was 200': (res) => res.status == 200});
    pause(config);

    let currencyPair = obtainCurrencyPair();
    res = http.get(`${config.url}/rates/latest/${currencyPair.baseCurrency}/${currencyPair.counterCurrency}`);
    check(res, {'response code was 200': (res) => res.status == 200});
    pause(config);

    let rateBookingReq = obtainRateBookingReq();
    let rateBookingResult = http.post(`${config.url}/rates/book`, JSON.stringify(rateBookingReq), {
        headers: { 'Content-Type': 'application/json' },
      });
    check(rateBookingResult, {'response code was 200': (res) => res.status == 200});
    pause(config);
    
    let dealReq = buildDealReq(rateBookingReq, rateBookingResult);
    res = http.post(`${config.url}/deals`, JSON.stringify(dealReq), {
        headers: { 'Content-Type': 'application/json' },
      });
    check(res, {'response code was 200': (res) => res.status == 200});
    pause(config);
}

// 4. teardown 
export const teardown = (config) => {
    // console.log("teardown");
    // console.log(JSON.stringify(config));
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

const buildDealReq = (rateBookingReq, rateBookingResult) => {
    return {
        baseCurrency: rateBookingReq.baseCurrency,
        counterCurrency: rateBookingReq.counterCurrency,
        baseCurrencyAmount: rateBookingReq.baseCurrencyAmount,
        tradeAction: rateBookingReq.tradeAction,
        rate: rateBookingResult.json('rate'),
        customerId: rateBookingReq.customerId,
        rateBookingRef: rateBookingResult.json('bookingRef')
    }
}