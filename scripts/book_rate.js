import { check } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import Papa from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Read rate booking request from CSV and convert to JSON array
// the value is stored in a read-only shared memory which is available to all virtual users
const rateBookingReqs = new SharedArray('rateBookingReqs', function () {
  const data = open('./resources/rateBookingReqs.csv');
  return Papa.parse(data, {header: true, skipEmptyLines: true}).data;
});

export default () => {
    // Randomly pick a request body from the JSON array
    const rateBookingReq = rateBookingReqs[randomIntBetween(0, rateBookingReqs.length - 1)];

    // Submit API request
    const res = http.post(`http://localhost:8080/rates/book`, JSON.stringify(rateBookingReq), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {'response code was 200': (res) => res.status == 200});
}