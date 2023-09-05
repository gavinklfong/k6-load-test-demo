# K6 Load Test Demo - Forex Trading API

This is a set of k6 load test script. The purpose is to demonstrate how to build load tests using k6.

The load test simulates request volume on the Forex trading APIs.

Make sure that you have install k6 CLI and docker runtime on your local environment

Follow the steps below to run the test -

1. start Forex trade app in dockr container - `docker run --rm -p 8080:8080 --name forex-trade-app whalebig27/reactive-spring-forex-trade`
2. change directory into scripts folder - `cd scripts`
3. run load test script - `k6 run forex_api_default_flow.js`
