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

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
  scenarios: {
    getRates: {
      executor: 'constant-arrival-rate',

      // How long the test lasts
      duration: '2m',

      // How many iterations per timeUnit
      rate: 30,

      // Start `rate` iterations per second
      timeUnit: '1s',

      // Pre-allocate VUs
      preAllocatedVUs: 50,
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