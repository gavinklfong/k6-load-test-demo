import http from 'k6/http';
import { describe, expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js';

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


module.exports = {
    getRatesByBaseCurrency,
    getRatesByCurrencyPair,
    bookRate,
    submitDeal,
    buildDealReq
}
