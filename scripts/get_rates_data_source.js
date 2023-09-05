import { check } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import Papa from 'https://jslib.k6.io/papaparse/5.1.1/index.js';


// Read currency pairs from CSV and convert to JSON array
// the currency pairs is stored in a read-only shared memory which is available to all virtual users
const currencyPairs = new SharedArray('currencyPairs', function () {
    const data = open('./resources/currencyPairs.csv');
    return Papa.parse(data, {header: true, skipEmptyLines: true}).data;
  });


export default () => {
    // Randomly pick a currency pair from the JSON array
    let currencyPair = currencyPairs[randomIntBetween(0, currencyPairs.length - 1)];

    // Send API request
    let res = http.get(`http://localhost:8080/rates/latest/${currencyPair.baseCurrency}/${currencyPair.counterCurrency}`);
    check(res, {'response code was 200': (res) => res.status == 200});
}