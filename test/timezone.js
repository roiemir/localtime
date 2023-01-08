var assert = require('assert');
var LocalTime = require('../localtime');

var conversions = [
    ["America/Denver", "2019-03-10T08:00Z", "2019-03-10 01:00 MST -07:00"],
    ["America/Denver", "2019-03-10T09:00Z", "2019-03-10 03:00 MDT -06:00"],
    ["America/Denver", "2019-11-03T06:00Z", "2019-11-03 00:00 MDT -06:00"],
    ["America/Denver", "2019-11-03T07:00Z", "2019-11-03 01:00 MDT -06:00"],
    ["America/Denver", "2019-11-03T08:00Z", "2019-11-03 01:00 MST -07:00"],
    ["Asia/Jerusalem", "2019-03-28T23:00Z", "2019-03-29 01:00 IST +02:00"],
    ["Asia/Jerusalem", "2019-03-29T00:00Z", "2019-03-29 03:00 IDT +03:00"],
    ["Asia/Jerusalem", "2019-10-26T22:00Z", "2019-10-27 01:00 IDT +03:00"],
    ["Asia/Jerusalem", "2019-10-26T23:00Z", "2019-10-27 01:00 IST +02:00"],
    ["Asia/Jerusalem", "2008-03-27T23:00Z", "2008-03-28 01:00 IST +02:00"],
    ["Asia/Jerusalem", "2008-03-28T00:00Z", "2008-03-28 03:00 IDT +03:00"],
    ["Asia/Jerusalem", "2008-10-04T22:00Z", "2008-10-05 01:00 IDT +03:00"],
    ["Asia/Jerusalem", "2008-10-04T23:00Z", "2008-10-05 01:00 IST +02:00"],
    ["America/Havana", "2015-03-08T04:00Z", "2015-03-07 23:00 CST -05:00"],
    ["America/Havana", "2015-03-08T05:00Z", "2015-03-08 01:00 CDT -04:00"],
    ["America/Havana", "2015-11-01T04:00Z", "2015-11-01 00:00 CDT -04:00"],
    ["America/Havana", "2015-11-01T05:00Z", "2015-11-01 00:00 CST -05:00"],
    //["Europe/Lisbon",  "2021-07-22T09:00Z", "2021-07-22 10:00 WEDT +01:00"], // NOT WORKING - should fix
    ["Asia/Jerusalem",   "2022-12-31T21:59Z", "2022-12-31 23:59 IST +02:00"],
    ["Asia/Jerusalem",   "2022-12-31T22:00Z", "2023-01-01 00:00 IST +02:00"],
    //["Asia/Tbilisi",   "1991-03-30T22:00Z", "1991-03-31 02:00 +03/+04+04:00"], // not sure about this one
    //["Asia/Tbilisi",   "1991-03-30T21:00Z", "1991-03-31 01:00 +04/+05+04:00"],
    ["Asia/Dushanbe",  "1991-03-30T19:00Z", "1991-03-31 01:00 +06/+07 +06:00"], // Doesn't work backwards
    ["Asia/Dushanbe",  "1991-03-30T20:00Z", "1991-03-31 02:00 +05/+06 +06:00"], // Doesn't work backwards
    ["Asia/Famagusta", "2017-10-29T00:00Z", "2017-10-29 03:00 +03 +03:00"],
    ["Asia/Famagusta", "2017-10-29T01:00Z", "2017-10-29 03:00 EEST +02:00"],
    ["Asia/Tbilisi",   "2005-03-26T22:00Z", "2005-03-27 01:00 +03/+04 +03:00"],
    ["Asia/Tbilisi",   "2005-03-26T23:00Z", "2005-03-27 03:00 +04 +04:00"],
    ["Asia/Jakarta",   "1963-12-31T16:00Z", "1963-12-31 23:30 +0730 +07:30"],
    ["Asia/Jakarta",   "1963-12-31T16:30Z", "1963-12-31 23:30 WIB +07:00"] // Doesn't work backwards
];

function testConversion(conversion) {
    it('should convert ' + conversion[1] + ' at ' + conversion[0] + ' to ' + conversion[2], function () {
        time = new LocalTime(new Date(conversion[1]), conversion[0]);
        assert.equal(time.toString(), conversion[2]);
    });

    it('should convert ' + conversion[2] + ' at ' + conversion[0] + ' to ' + conversion[1], function () {
        var time = new LocalTime(conversion[2], conversion[0]);
        assert.equal(new Date(time.time).toISOString(), new Date(conversion[1]).toISOString());
    });
}

describe('timezones', function () {
    LocalTime.load(["tzdata/northamerica", "tzdata/europe", "tzdata/asia"], function () {
        for (var i = 0; i < conversions.length; i++) {
            testConversion(conversions[i]);
        }
    });
});