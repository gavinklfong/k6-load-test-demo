import { check, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import Papa from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Read currency pairs from CSV and convert to JSON array
const currencyPairs = new SharedArray('currencyPairs', function () {
  const data = open('./resources/currencyPairs.csv');
  return Papa.parse(data, {header: true, skipEmptyLines: true}).data;
});

// Read rate booking request from CSV and convert to JSON array
const rateBookingReqs = new SharedArray('rateBookingReqs', function () {
  const data = open('./resources/rateBookingReqs.csv');
  return Papa.parse(data, {header: true, skipEmptyLines: true}).data;
});

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
  scenarios: {
    getRates: {
      executor: 'ramping-arrival-rate',

      // Start iterations per `timeUnit`
      startRate: 100,

      // Start `startRate` iterations per minute
      timeUnit: '1s',

      // Pre-allocate necessary VUs.
      preAllocatedVUs: 50,

      stages: [
        // Start from 100 to 700 iterations per `timeUnit` within 30 seconds
        { target: 700, duration: '30s' },

        // Stay at the same volume for 10 seconds
        { target: 700, duration: '10s' },

        // ramp-down to 1000 iterations per `timeUnit` in 10 seconds
        { target: 100, duration: '10s' },
      ],
    },
  },
};

export default () => {

    // Get rate
    let currencyPair = currencyPairs[randomIntBetween(0, currencyPairs.length - 1)];
    let getRateRes = http.get(
      `http://forex-app:8080/rates/latest/${currencyPair.baseCurrency}/${currencyPair.counterCurrency}`,
      {tags: { name: "Get_Forex_Rates"}}
    );
    check(getRateRes, {'Get Rate - response code was 200': (res) => res.status == 200}, {name: "Get_Forex_Rates"});

}

