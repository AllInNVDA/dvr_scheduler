# DVR Scheduler

This project is...

## Stack & Tools

[ExpressJS](http://expressjs.com/): to power RESTful APIs and the client app

[AngularJS](https://angularjs.org/): to build the client app

[Interval-Query](https://github.com/toberndo/interval-query): to hold schedule data

[Grunt](http://gruntjs.com/): to manage project tasks

[Mocha](http://mochajs.org/): for unit & integration testing

[istanbul](http://gotwarlost.github.io/istanbul/): for coverage report

[supertest](https://github.com/visionmedia/supertest): for RESTful APIs testing

[groc](https://github.com/nevir/groc): for documentation

## Setup
```
git clone https://github.com/GPRN/dvr_scheduler.git
cd dvr_scheduler
npm install -g grunt-cli
npm install -g bower
npm install
bower install
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
## Run the client app
```
grunt serve
```
Users will be asked to prioritize conflict programs. To test this feature, search "news" for conflict programs.
