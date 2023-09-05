import { check } from 'k6';
import http from 'k6/http';

export default () => {    
    let res = http.get(`http://localhost:8080/rates/latest/GBP/USD`);
    check(res, {'response code was 200': (res) => res.status == 200});
}