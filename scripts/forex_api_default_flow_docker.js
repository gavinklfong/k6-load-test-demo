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
  stages: [
    { duration: '5s', target: 30 },
    { duration: '60s', target: 30 },
    { duration: '10s', target: 5 },
  ]
};

export default () => {

    // Get rate
    let currencyPair = currencyPairs[randomIntBetween(0, currencyPairs.length - 1)];
    let getRateRes = http.get(
      `http://forex-app:8080/rates/latest/${currencyPair.baseCurrency}/${currencyPair.counterCurrency}`,
      {tags: { name: "Get_Forex_Rates"}}
    );
    check(getRateRes, {'Get Rate - response code was 200': (res) => res.status == 200}, {name: "Get_Forex_Rates"});
    sleep(randomIntBetween(1, 3));

    // Book rate
    const rateBookingReq = rateBookingReqs[randomIntBetween(0, rateBookingReqs.length - 1)];
    const rateBookingRes = http.post(`http://forex-app:8080/rates/book`, JSON.stringify(rateBookingReq), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: "Book_Forex_Rate"}
    });
    check(rateBookingRes, {'Book Rate - response code was 200': (res) => res.status == 200}, 
          {name: "Book_Forex_Rate"});
    sleep(randomIntBetween(1, 3));

    // Submit trade deal
    const dealReq = buildDealReq(rateBookingReq, rateBookingRes.json());
    const submitDealRes = http.post(`http://forex-app:8080/deals`, JSON.stringify(dealReq), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: "Submit_Forex_Deal"}
    });
    check(submitDealRes, {'Submit Trade Deal - response code was 200': (res) => res.status == 200}, 
          {name: "Submit_Forex_Deal"});
    sleep(randomIntBetween(1, 3));
}

const buildDealReq = (rateBookingReq, rateBookingRes) => {
  return {
      baseCurrency: rateBookingReq.baseCurrency,
      counterCurrency: rateBookingReq.counterCurrency,
      baseCurrencyAmount: rateBookingReq.baseCurrencyAmount,
      tradeAction: rateBookingReq.tradeAction,
      rate: rateBookingRes.rate,
      customerId: rateBookingReq.customerId,
      rateBookingRef: rateBookingRes.bookingRef
  }
}