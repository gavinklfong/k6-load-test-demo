// 1. init
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import Papa from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { 
    getRatesByBaseCurrency,
    getRatesByCurrencyPair,
    bookRate,
    submitDeal,
    buildDealReq
} from '/scripts/modules/forexRequst.js';

export const options = {
    stages: [
        { duration: '5s', target: 10 },
        { duration: '30s', target: 30 },
        { duration: '5s', target: 10 },
      ],
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

export function teardown(config) {
    // 4. teardown
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