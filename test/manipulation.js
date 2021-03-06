var assert = require('assert');
var LocalTime = require('../localtime');

describe('manipulation', function () {
    LocalTime.load(["tzdata/northamerica"], function () {
        it('adding day', function () {
            var time = new LocalTime(2019, 8, 11, 7, 23, 15, "America/Denver");
            time.setDay(time.getDay() + 1);
            assert.equal(time.toString(), "2019-08-12 07:23:15 MDT -06:00");
        });
        it('subtracting day', function () {
            var time = new LocalTime(2019, 8, 11, 7, 23, 15, "America/Denver");
            time.setDay(time.getDay() - 1);
            assert.equal(time.toString(), "2019-08-10 07:23:15 MDT -06:00");
        });
        it('subtracting day to 0', function () {
            var time = new LocalTime(2020, 12, 6, 0, 0, 0, "America/Denver");
            time.setDay(time.getDay() - 6);
            assert.equal(time.toString(), "2020-11-30 00:00 MST -07:00");
        });
        it('adding 42 days', function () {
            var time = new LocalTime(2019, 8, 11, 7, 23, 15, "America/Denver");
            time.setDay(time.getDay() + 42);
            assert.equal(time.toString(), "2019-09-22 07:23:15 MDT -06:00");
        });
        it('subtracting 42 days', function () {
            var time = new LocalTime(2019, 8, 11, 7, 23, 15, "America/Denver");
            time.setDay(time.getDay() - 42);
            assert.equal(time.toString(), "2019-06-30 07:23:15 MDT -06:00");
        });
        it('adding days past day light saving', function () {
            var time = new LocalTime(2019, 2, 24, 7, 23, 15, "America/Denver");
            time.setDay(time.getDay() + 42);
            assert.equal(time.toString(), "2019-04-07 07:23:15 MDT -06:00");
        });
        it('subtracting days past day light saving', function () {
            var time = new LocalTime(2019, 4, 7, 7, 23, 15, "America/Denver");
            time.setDay(time.getDay() - 42);
            assert.equal(time.toString(), "2019-02-24 07:23:15 MST -07:00");
        });
        it('getting day of year', function () {
            var time = new LocalTime(2019, 6, 30, 7, 23, 15, "America/Denver");
            assert.equal(time.getDayOfYear(), 181);
        });
        it('getting day of leap year', function () {
            var time = new LocalTime(2020, 6, 30, 7, 23, 15, "America/Denver");
            assert.equal(time.getDayOfYear(), 182);
        });
        it('from day of year', function () {
            var time = LocalTime.fromDayOfYear(2019, 181, 7, 23, 15, "America/Denver");
            assert.equal(time.toString(), "2019-06-30 07:23:15 MDT -06:00");
        });
        it('from day of leap year', function () {
            var time = LocalTime.fromDayOfYear(2020, 182, 7, 23, 15, "America/Denver");
            assert.equal(time.toString(), "2020-06-30 07:23:15 MDT -06:00");
        });
    });
});