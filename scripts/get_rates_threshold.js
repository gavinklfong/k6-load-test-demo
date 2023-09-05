import { check } from 'k6';
import http from 'k6/http';

export const options = {
    thresholds: {
      http_req_failed: ['rate<0.01'], // http errors should be less than 1%
      http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    },
  };

export default () => {    
    let res = http.get(`http://localhost:8080/rates/latest/GBP/USD`);
    check(res, {'response code was 200': (res) => res.status == 200});
}