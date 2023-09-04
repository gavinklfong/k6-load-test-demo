// 1. init
import http from 'k6/http';
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { describe, expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js';
import Papa from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// export const options = {
//     stages: [
//         { duration: '5s', target: 10 },
//         { duration: '30s', target: 30 },
//         { duration: '5s', target: 10 },
//       ],
// };

const currencyPairs = new SharedArray('currencyPairs', function () {
    const data = open('./resources/currencyPairs.csv');
    return Papa.parse(data, {header: true, skipEmptyLines: true}).data;
  });

export function setup() {
    // 2. setup
    console.log("setup");
    return { 
        url: 'http://localhost:8080',
        minPauseInSecond: 1,
        maxPauseInSecond: 3
    };
}

// Default Flow
export default (config) => {
    // 3. VU code
    let currencyPair = currencyPairs[randomIntBetween(0, currencyPairs.length - 1)];
    describe(`Get Rates By Pair Currency`, () => {
        let res = http.get(`${config.url}/rates/latest/${currencyPair.baseCurrency}/${currencyPair.counterCurrency}`);
        expect(res.status, 'response status').to.equal(200);
        expect(res).to.have.validJsonBody();
    })
    sleep(randomIntBetween(config.minPauseInSecond, config.maxPauseInSecond));   
}
