var assert = require('assert');
var LocalTime = require('../localtime');

describe('week', function () {
    LocalTime.load(["tzdata/northamerica"], function () {
        it('getting week last day', function () {
            var time = new LocalTime(2019, 8, 10, "America/Denver");
            assert.equal(time.getWeek(), 32);
        });

        it('getting week first day', function () {
            var time = new LocalTime(2019, 8, 11, "America/Denver");
            assert.equal(time.getWeek(), 33);
        });

        it('getting week starting monday last day', function () {
            var time = new LocalTime(2019, 8, 11, "America/Denver");
            assert.equal(time.getWeek(1), 32);
        });

        it('getting week starting monday first day', function () {
            var time = new LocalTime(2019, 8, 12, "America/Denver");
            assert.equal(time.getWeek(1), 33);
        });

        it('getting date from week last day', function () {
            var time = LocalTime.fromWeek(2019, 32, 6, "America/Denver");
            assert.equal(time.toString(), "2019-08-10 00:00 MDT -06:00");
        });

        it('getting date from week first day', function () {
            var time = LocalTime.fromWeek(2019, 33, 0, "America/Denver");
            assert.equal(time.toString(), "2019-08-11 00:00 MDT -06:00");
        });

    });
});
