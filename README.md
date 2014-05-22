# DVR Scheduler

This project is...

## Stack & Tool

[ExpressJS](http://expressjs.com/): power RESTful APIs
[AngularJS](https://angularjs.org/): build the client app (not started)
[Interval-Query](https://github.com/toberndo/interval-query): hold schedule data
[Grunt](http://gruntjs.com/): manage project tasks
[Mocha](http://visionmedia.github.io/mocha/): unit & integration test
[istanbul](http://gotwarlost.github.io/istanbul/): coverage report
[protractor](https://github.com/angular/protractor): end to end test (not started)
[supertest](https://github.com/visionmedia/supertest): test RESTful APIs
[groc](https://github.com/nevir/groc): documentation

## Setup
```
git clone https://github.com/GPRN/dvr_scheduler.git
cd dvr_scheduler
npm install -g grunt-cli
npm install
```

## Run the Test

unit test:
```
grunt test
```
unit test files that start with "sam":
```
grunt test --file=sam
```

coverage test:
```
grunt cov
```
coverage test files that start with "sam":
```
grunt cov --file=sam
```
