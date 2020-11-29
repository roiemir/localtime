(function () {

    function failRecord(record) {
        console.log("Record parse failed: " + record.join(" "));
    }

    function LocalTime(year, month, day, hour, minute, second, ms, zone) {
        if (year instanceof LocalTime) {
            this.time = year.time;
            this.year = year.year;
            this.month = year.month;
            this.day = year.day;
            this.hour = year.hour;
            this.minute = year.minute;
            this.second = year.second;
            this.ms = year.ms;
            this.offset = year.offset;
            this.tz = year.tz;
            this.zone = year.zone;

            if (typeof month === "string" && this.zone !== month) {
                this.setTimezone(month);
            }
        }
        else if (typeof year === "string") {
            // Parse time in timezone
            // Expected format YYYY-MM-DD[ HH[:MM[:SS[.MSEC]][ TZ][ OFFSET]
            var parts = year.split(" ");
            var date = parts[0].split("-").map(function (x) { return parseInt(x); });
            if (date.length === 3) {
                var time = parts.length > 1 ? parts[1].split(":") : [];
                if (time.length <= 3) {
                    this.year = date[0];
                    this.month = date[1];
                    this.day = date[2];
                    if (time.length === 0) {
                        this.hour = 0;
                        this.minute = 0;
                        this.second = 0;
                        this.ms = 0;
                    }
                    else {
                        this.hour = parseInt(time[0]);
                        if (time.length === 1) {
                            this.minute = 0;
                            this.second = 0;
                            this.ms = 0;
                        } else {
                            this.minute = parseInt(time[1]);
                            if (time.length === 2) {
                                this.second = 0;
                                this.ms = 0;
                            } else {
                                var sec = time[2].split(".");
                                this.second = parseInt(sec[0]);
                                if (sec.length === 1) {
                                    this.ms = 0;
                                }
                                else {
                                    this.ms = parseInt((sec[1] + '00').slice(0, 4));
                                }
                            }
                        }
                    }
                    if (parts.length > 2) {
                        this.tz = parts[2];
                    }
                    this.zone = month;
                    evaluateUtc(this)
                }
            }

        }
        else if (month == null || typeof month === "string") {
            // LocalTime(date/number, zone)
            if (year == null) {
                year = new Date();
            }
            else if (typeof year === "number") {
                year = new Date(year);
            }
            if (!(year instanceof Date) || isNaN(year)) {
                return;
            }

            this.time = year.getTime();
            this.setTimezone(month);
        }
        else if (typeof year === "number" &&
            typeof month === "number" &&
            typeof day === "number") {
            this.year = year;
            this.month = month;
            this.day = day;
            if (typeof hour === "string" || hour == null) {
                zone = hour;
                this.hour = 0;
                this.minute = 0;
                this.second = 0;
                this.ms = 0;
            }
            else if (typeof minute === "string" || minute == null) {
                this.hour = hour;
                zone = minute;
                this.minute = 0;
                this.second = 0;
                this.ms = 0;
            }
            else if (typeof second === "string" || second == null) {
                this.hour = hour;
                this.minute = minute;
                zone = second;
                this.second = 0;
                this.ms = 0;
            }
            else if (typeof ms === "string" || ms == null) {
                this.hour = hour;
                this.minute = minute;
                this.second = second;
                zone = ms;
                this.ms = 0;
            }
            else {
                this.hour = hour;
                this.minute = minute;
                this.second = second;
                this.ms = ms;
            }

            this.zone = zone;
            evaluateUtc(this);
        }
    }

    LocalTime.prototype.setTimezone = function (zone) {
        var date = new Date(this.time);

        if (zone == null) {
            this.year = date.getFullYear();
            this.month = date.getMonth() + 1;
            this.day = date.getDate();
            this.hour = date.getHours();
            this.minute = date.getMinutes();
            this.second = date.getSeconds();
            this.ms = date.getMilliseconds();
            this.offset = -date.getTimezoneOffset()*60;
            this.tz = formatUtcTimezone(this.offset);
            return true;
        }

        this.year = date.getUTCFullYear();
        this.month = date.getUTCMonth() + 1;
        this.day = date.getUTCDate();
        this.hour = date.getUTCHours();
        this.minute = date.getUTCMinutes();
        this.second = date.getUTCSeconds();
        this.ms = date.getUTCMilliseconds();
        this.offset = 0;

        var data = getTimezoneData(zone);
        if (data) {
            this.zone = zone;
            /*var n = 0;
            var line = data.lines[0];
            offsetTime(this, line.stdoff);
            var rule = evaluateRule(this, line.rule);
            if (rule && rule.save) {
                offsetTime(this, rule.save);
            }
            while (line.until) {
                if (line.until.day == null) {
                    if (this.year < line.until.year) {
                        break;
                    }
                    if (this.year === line.until.year) {
                        if (line.until.month != null && this.month < line.until.month) {
                            break;
                        }
                    }
                }
                else {
                    var td = getTimeForDay(line.until.year, line.until.month, line.until.day);
                    if (this.year < td.year) {
                        break;
                    }
                    if (this.year === td.year) {
                        if (this.month < td.month) {
                            break;
                        }
                        if (this.month === td.month) {
                            if (this.day < td.day) {
                                break;
                            }

                            if (this.day === td.day) {
                                if (line.until.time == null) {
                                    break;
                                }
                                if (typeof line.until.time === "number") {
                                    if (timeOffset(this) < line.until.time) {
                                        break;
                                    }
                                }
                                else if (line.until.time.std != null) {
                                    var save = rule ? rule.save : 0;
                                    offsetTime(this, -save);
                                    if (timeOffset(this) < line.until.time.std) {
                                        offsetTime(this, save);
                                        break;
                                    }
                                    offsetTime(this, save);
                                }
                                else if (line.until.time.utc != null) {
                                    var offset = this.offset;
                                    offsetTime(this, -offset);
                                    if (timeOffset(this) < line.until.time.utc) {
                                        offsetTime(this, offset);
                                        break;
                                    }
                                    offsetTime(this, offset);
                                }
                            }
                        }
                    }
                }
                if (rule && rule.save) {
                    offsetTime(this, -rule.save);
                }
                n++;
                line = data.lines[n];
                if (line.stdoff !== this.offset) {
                    offsetTime(this, line.stdoff - this.offset);
                }
                rule = evaluateRule(this, line.rule);
                if (rule && rule.save) {
                    offsetTime(this, rule.save);
                }
            }*/

            var n = 0;
            var line = data.lines[0];
            while (line.until && line.until.utc <= this.time) {
                n++;
                line = data.lines[n];
            }

            offsetTime(this, line.stdoff);
            var rule = evaluateRule(this, line.rule);
            if (rule && rule.save) {
                offsetTime(this, rule.save);
            }

            this.tz = line.format.split("%s").join(rule && rule.letters ? rule.letters : "S");

            return true;
        }
        return false;
    };

    LocalTime.prototype.getTime = function () {
        return this.time;
    };

    LocalTime.prototype.valueOf = function () {
        return this.time;
    };

    LocalTime.prototype.getMilliseconds = function () { return this.ms; };
    LocalTime.prototype.getSeconds = function () { return this.second; };
    LocalTime.prototype.getMinutes = function () { return this.minute; };
    LocalTime.prototype.getHours = function () { return this.hour; };
    LocalTime.prototype.getDay = function () { return this.day; };
    LocalTime.prototype.getDayOfWeek = function () { return new Date(this.year, this.month - 1, this.day).getDay(); };
    var dayInMilliseconds = 60000*60*24;
    LocalTime.prototype.getDayOfYear = function () {
        var yearStart = new LocalTime(this.year, 1, 1, this.zone);
        return Math.floor(
            ((this.time - yearStart) + ((this.offset - yearStart.offset) * 1000)) / dayInMilliseconds) + 1;
    };
    LocalTime.prototype.getWeek = function (firstDay) {
        var dayOfYear = this.getDayOfYear() - 1;
        var weekDay = (7 + this.getDayOfWeek() - (firstDay || 0)) % 7;
        var week = (dayOfYear - weekDay + 10) / 7;
        return Math.floor(week);
    };
    LocalTime.prototype.getMonth = function () { return this.month; };
    LocalTime.prototype.getYear = function ()  { return this.year; };

    LocalTime.prototype.setMinutes = function (minute, second, ms) {
        if (ms != null) {
            var r = ms % 1000;
            second += (ms - r) / 1000;
            if (r < 0) {
                this.ms = 1000 + r;
                second--;
            }
            else {
                this.ms = r;
            }
        }
        var offset = 0;
        if (minute != null) {
            offset += (minute - this.minute)*60;
        }
        if (second != null) {
            offset += (second - this.second);
        }
        if (offset) {
            modifyTime(this, offset);
            evaluateUtc(this);
        }
    };
    LocalTime.prototype.setHours = function (hour, minute, second, ms) {
        if (ms != null) {
            var r = ms % 1000;
            second += (ms - r) / 1000;
            if (r < 0) {
                this.ms = 1000 + r;
                second--;
            }
            else {
                this.ms = r;
            }
        }
        var offset = 0;
        if (hour != null) {
            offset += (hour - this.hour)*3600;
        }
        if (minute != null) {
            offset += (minute - this.minute)*60;
        }
        if (second != null) {
            offset += (second - this.second);
        }
        if (offset) {
            modifyTime(this, offset);
            evaluateUtc(this);
        }
    };

    LocalTime.prototype.setDay = function (day) {
        if (day) {
            modifyTime(this, (day-this.day)*24*60*60);
            evaluateUtc(this);
        }
    };

    LocalTime.prototype.toString = function () {
        var absOffset = Math.abs(this.offset);
        var result = ('000' + this.year).slice(-4) + "-" +
            ('0' + this.month).slice(-2) + "-" +
            ('0' + this.day).slice(-2) + " " +
            ('0' + this.hour).slice(-2) + ":" +
            ('0' + this.minute).slice(-2);

        if (this.ms > 0) {
            result += ":" + ('0' + this.second).slice(-2) + "." + ('00' + this.ms).slice(-3);
        }
        else if (this.second > 0) {
            result += ":" + ('0' + this.second).slice(-2)
        }

        result += " " +
            (this.tz || "UTC") +
            (this.offset < 0 ? " -" : " +") +
            (absOffset >= 360000 ? Math.floor(absOffset/3600) : ('0' + Math.floor(absOffset/3600)).slice(-2)) + ":" +
            ('0' + Math.floor(absOffset/60)%60).slice(-2);
        return result;
    };

    function extractLetters(format, tz) {
        var n = format.indexOf('%');
        if (n >= 0) {
            var r = tz.length - (format.length - n - 2);
            if (tz.lastIndexOf(format.slice(0, n), 0) === 0 &&
                tz.indexOf(format.slice(n + 2), r) === r) {
                return tz.slice(n, r);
            }
        }
        return null;
    }

    function matchLetters(format, tz) {
        var n = format.indexOf('%');
        if (n >= 0) {
            return format.slice(0, n) === tz.slice(0, n) &&
                format.slice(n + 2) === tz.slice(tz.length - (format.length - n - 2));
        }
        return format === tz;
    }

    function formatUtcTimezone(offset) {
        var absOffset = Math.abs(offset);
        if (absOffset % 3600 === 0) {
            if (absOffset >= 360000) {
                return (offset < 0 ? "UTC-" : "UTC+") + (absOffset / 3600);
            }
            else {
                return (offset < 0 ? "UTC-" : "UTC+") + ("0" + (absOffset / 3600)).slice(-2);
            }
        }
        if (absOffset >= 360000) {
            return (offset < 0 ? "UTC-" : "UTC+") + (absOffset / 3600) + ":" + ('0' + Math.floor(absOffset/60)%60).slice(-2);
        }
        else {
            return (offset < 0 ? "UTC-" : "UTC+") + ("0" + (absOffset / 3600)).slice(-2) + ":" + ('0' + Math.floor(absOffset/60)%60).slice(-2);
        }
    }

    function compareTimes(a, b) {
        var d = a.year - b.year;
        if (d !== 0) {
            return d;
        }
        d = a.month - b.month;
        if (d !== 0) {
            return d;
        }
        d = a.day - b.day;
        if (d !== 0) {
            return d;
        }
        d = a.hour - b.hour;
        if (d !== 0) {
            return d;
        }
        d = a.minute - b.minute;
        if (d !== 0) {
            return d;
        }
        return a.second - b.second;
    }

    function evaluateUtc(time) {
        if (!time.zone) {
            var date = new Date(time.year, time.month - 1, time.day, time.hour, time.minute, time.second, time.ms);
            time.time = date.getTime();
            time.offset = -date.getTimezoneOffset()*60;
            time.tz = formatUtcTimezone(time.offset);
            return true;
        }
        else if (time.zone === "UTC") {
            time.time = Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute, time.second, time.ms);
            time.offset = 0;
            time.tz = "UTC";
        }
        var data = getTimezoneData(time.zone);
        if (data) {
            /*var n = 0;
            var line = data.lines[0];
            // TODO - will not work with u time
            var ruleSave = findRuleSave(time.year, line.rule, time.tz ? extractLetters(line.format, time.tz) : null);
            if (ruleSave) {
                offsetTime(time, -ruleSave);
            }
            var rule = evaluateRule(time, line.rule);
            if (ruleSave) {
                offsetTime(time, ruleSave);
            }
            while (line.until) {
                if (line.until.day == null) {
                    if (time.year < line.until.year) {
                        break;
                    }
                    if (time.year === line.until.year) {
                        if (line.until.month != null && time.month < line.until.month) {
                            break;
                        }
                    }
                }
                else {
                    var td = getTimeForDay(line.until.year, line.until.month, line.until.day);
                    if (time.year < td.year) {
                        break;
                    }
                    if (time.year === td.year) {
                        if (time.month < td.month) {
                            break;
                        }
                        if (time.month === td.month) {
                            if (time.day < td.day) {
                                break;
                            }

                            if (time.day === td.day) {
                                if (line.until.time == null) {
                                    break;
                                }
                                if (typeof line.until.time === "number") {
                                    if (timeOffset(time) < line.until.time) {
                                        break;
                                    }
                                }
                                else if (line.until.time.std != null) {
                                    var save = rule ? rule.save : 0;
                                    offsetTime(time, -save);
                                    if (timeOffset(time) < line.until.time.std) {
                                        offsetTime(time, save);
                                        break;
                                    }
                                    offsetTime(time, save);
                                }
                                else if (line.until.time.utc != null) {
                                    var offset = time.offset;
                                    offsetTime(time, -offset);
                                    if (timeOffset(time) < line.until.time.utc) {
                                        offsetTime(time, offset);
                                        break;
                                    }
                                    offsetTime(time, offset);
                                }
                            }
                        }
                    }
                }
                n++;
                line = data.lines[n];
                ruleSave = findRuleSave(time.year, line.rule, time.tz ? extractLetters(line.format, time.tz) : null);
                if (ruleSave) {
                    offsetTime(time, -ruleSave);
                }
                rule = evaluateRule(time, line.rule);
                if (ruleSave) {
                    offsetTime(time, ruleSave);
                }
            }*/

            var n = 0;
            var line = data.lines[0];
            while (line.change &&
                compareTimes(line.change, time) < 0) {
                n++;
                line = data.lines[n];
            }
            if (line.change && n < data.lines.length) {
                var next = data.lines[n + 1];
                if (next.offdiff) {
                    var change = {
                        year: line.change.year,
                        month: line.change.month,
                        day: line.change.day,
                        hour: line.change.hour,
                        minute: line.change.minute,
                        second: line.change.second
                    };
                    offsetTime(change, next.offdiff);
                    if (compareTimes(change, time) <= 0) {
                        // Both this line and next line match time - should check clock name
                        if (matchLetters(next.format, time.tz)) {
                            line = next;
                        }
                    }
                }
            }

            var ruleSave = findRuleSave(time.year, line.rule, time.tz ? extractLetters(line.format, time.tz) : null);
            if (ruleSave) {
                offsetTime(time, -ruleSave);
            }
            var rule = evaluateRule(time, line.rule);
            if (ruleSave) {
                offsetTime(time, ruleSave);
            }

            time.tz = line.format.split("%s").join(rule && rule.letters ? rule.letters : "S");

            var offset = time.offset = line.stdoff + (rule ? rule.save : 0);
            offsetTime(time, -offset);
            time.time = new Date(Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute, time.second, time.ms)).getTime();
            offsetTime(time, offset);

            return true;
        }
        return false;
    }

    TimezoneData = {
        zones: {},
        rulesets: {}
    };

    function getTimezoneData(zone) {
        var data = TimezoneData.zones[zone.toLowerCase()];
        if (!data) {
            return null;
        }
        if (!data.evaluated) {
            var n = 0;
            var thisoff, lastoff = null;
            var line = data.lines[0];
            while (line.until) {
                var t = getTimeForDay(line.until.year, line.until.month, line.until.day);
                t.hour = 0;
                t.minute = 0;
                t.second = 0;
                line.change = {
                    year: t.year,
                    month: t.month,
                    day: t.day,
                    hour: t.hour,
                    minute: t.minute,
                    second: t.second
                };
                var time = line.until.time;
                if (time == null) {
                    time = 0;
                }
                thisoff = line.stdoff;
                if (time.utc) {
                    offsetTime(t, time.utc);
                    offsetTime(line.change, line.stdoff);
                    var rule = evaluateRule(line.change, line.rule);
                    if (rule && rule.save) {
                        thisoff += rule.save;
                    }
                    offsetTime(line.change, time.utc);//-line.stdoff+time.utc);
                }
                else if (time.std) {
                    offsetTime(t, -line.stdoff+time.std);
                    var rule = evaluateRule(t, line.rule);
                    if (rule && rule.save) {
                        offsetTime(line.change, rule.save);
                        thisoff += rule.save;
                    }
                }
                else {
                    offsetTime(line.change, time - 1);
                    var rule = evaluateRule(t, line.rule);
                    offsetTime(t, -line.stdoff);
                    offsetTime(line.change, 1);
                    if (rule && rule.save) {
                        thisoff += rule.save;
                        offsetTime(line.change, rule.save);
                        offsetTime(t, -rule.save);
                    }
                    offsetTime(t, time);
                }

                if (lastoff != null && thisoff !== lastoff) {
                    line.offdiff = thisoff - lastoff;
                }
                line.until.utc = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second);

                lastoff = thisoff;
                n++;
                line = data.lines[n];
            }
            thisoff = line.stdoff;
            var rule = evaluateRule(t, line.rule);
            if (rule && rule.save) {
                thisoff += rule.save;
            }
            if (lastoff != null && thisoff !== lastoff) {
                line.offdiff = thisoff - lastoff;
            }
            data.evaluated = true;
        }
        return data;
    }

    function findRuleSave(year, rule, letters) {
        if (letters && typeof rule === "string") {
            var ruleset = TimezoneData.rulesets[rule];

            var reset = 0;
            // Trying to find the rule matching the letters in order to apply its save time
            for (var n = 0; n < ruleset.length; n++) {
                var c = ruleset[n];
                if (c.from === "min" || c.from <= year) {
                    if (c.to === "max" || (c.to === "only" && year === c.from) || c.to >= year) {
                        if (c.letters === letters) {
                            if (c.save) {
                                return c.save;
                            }
                        }
                    }
                }
            }
        }
        return 0;
    }

    function evaluateRule(time, rule) {
        if (!rule) {
            return null;
        }
        if (typeof rule === "number") {
            return {
                save: rule
            };
        }
        var ruleset = TimezoneData.rulesets[rule];

        var sel = null;
        for (var n = 0; n < ruleset.length; n++) {
            var c = ruleset[n];
            if (c.from === "min" || c.from <= time.year) {
                if (c.to === "max" || (c.to === "only" && time.year === c.from) || c.to >= time.year) {
                    if (sel && sel.month > c.month) {
                        // Rule c was already passed
                        continue;
                    }
                    var td = getTimeForDay(time.year, c.month, c.on);
                    if (td.year < time.year) {
                        sel = c;
                    } else if (td.year === time.year) {
                        var save = 0;
                        if (sel && sel.save) {
                            save = sel.save;
                            offsetTime(time, save);
                        }
                        if (td.month < time.month) {
                            sel = c;
                        } else if (td.month === time.month) {
                            if (td.day < time.day) {
                                sel = c;
                            } else if (td.day === time.day) {
                                if (typeof c.at === "number") {
                                    if (c.at <= timeOffset(time)) {
                                        sel = c;
                                    }
                                } else if (c.at.std != null) {
                                    offsetTime(time, -save);
                                    save = 0;
                                    if (c.at.std <= timeOffset(time)) {
                                        sel = c;
                                    }
                                }
                                else if (c.at.utc != null) {
                                    var offset = this.offset;
                                    offsetTime(time, -offset);
                                    if (c.at.utc <= timeOffset(time)) {
                                        sel = c;
                                    }
                                    offsetTime(time, offset);
                                }

                            }
                        }
                        if (save) {
                            offsetTime(time, -save);
                        }
                    }
                }
            }
        }

        if (sel) {
            return {
                save: sel.save,
                letters: sel.letters
            };
        }
        return null;
    }

    function getTimeForDay(year, month, day) {
        if (day != null) {
            if (typeof day === "number") {
                return {year: year, month: month, day: day};
            }
            if (day.last != null) {
                var d = new Date(year, month, 0);
                if (d.getDay() >= day.last) {
                    d.setDate(d.getDate() - d.getDay() + day.last);
                } else {
                    d.setDate(d.getDate() - d.getDay() - 7 + day.last);
                }
                return {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate()};
            }
            if (day.to != null) {
                var d = new Date(year, month - 1, day.to);
                if (d.getDay() >= day.day) {
                    d.setDate(d.getDate() - d.getDay() + day.day);
                } else {
                    d.setDate(d.getDate() - d.getDay() - 7 + day.day);
                }
                return {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate()};
            }
            if (day.from != null) {
                var d = new Date(year, month - 1, day.from);
                if (d.getDay() <= day.day) {
                    d.setDate(d.getDate() - d.getDay() + day.day);
                } else {
                    d.setDate(d.getDate() - d.getDay() + 7 + day.day);
                }
                return {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate()};
            }
        }
        return {year: year, month: month || 1, day: 1};
    }

    function timeOffset(time) {
        return time.hour*3600+time.minute*60+time.second;
    }

    function offsetTime(time, offset) {
        if (!offset) {
            return;
        }
        time.offset = (time.offset || 0) + offset;
        modifyTime(time, offset);
    }

    function modifyTime(time, offset) {
        var s = offset % 60;
        offset = (offset - s) / 60;
        time.second += s;
        if (time.second >= 60) {
            time.second -= 60;
            offset++;
        }
        else if (time.second < 0) {
            time.second += 60;
            offset--;
        }
        s = offset % 60;
        offset = (offset - s) / 60;
        time.minute += s;
        if (time.minute >= 60) {
            time.minute -= 60;
            offset++;
        }
        else if (time.minute < 0) {
            time.minute += 60;
            offset--;
        }
        s = offset %24;
        offset = (offset - s) / 24;
        time.hour += s;
        if (time.hour >= 24) {
            time.hour -= 24;
            offset++;
        }
        else if (time.hour < 0) {
            time.hour += 24;
            offset--;
        }

        time.day += offset;

        if (time.day <= 0) {
            do {
                time.day += new Date(time.year, time.month - 1, 0).getDate();
                if (time.month === 1) {
                    time.year--;
                    time.month = 12;
                }
                else {
                    time.month--;
                }
            } while (time.day <= 0);
        }
        else {
            var monthDays = new Date(time.year, time.month, 0).getDate();
            while (time.day > monthDays) {
                time.day -= monthDays;
                if (time.month === 12) {
                    time.year++;
                    time.month = 1;
                }
                else {
                    time.month++;
                }
                monthDays = new Date(time.year, time.month, 0).getDate();
            }
        }
    }

    LocalTime.fromDayOfYear = function (year, dayOfYear, hour, minute, second, ms, zone) {
        if (typeof hour === "string" || hour == null) {
            zone = hour;
            hour = 0;
            minute = 0;
            second = 0;
            ms = 0;
        }
        else if (typeof minute === "string" || minute == null) {
            zone = minute;
            minute = 0;
            second = 0;
            ms = 0;
        }
        else if (typeof second === "string" || second == null) {
            zone = second;
            second = 0;
            ms = 0;
        }
        else if (typeof ms === "string" || ms == null) {
            zone = ms;
            ms = 0;
        }

        var result = new LocalTime(year, 1, 1, hour, minute, second, ms, zone);
        if (dayOfYear > 1) {
            result.setDay(dayOfYear);
        }
        return result;
    };

    LocalTime.fromWeek = function (year, week, day, hour, minute, second, ms, zone, firstDay) {
        if (typeof day === "string" || day == null) {
            zone = day;
            firstDay = hour || 0;
            day = 0;
            hour = 0;
            minute = 0;
            second = 0;
            ms = 0;
        }
        else if (typeof hour === "string" || hour == null) {
            zone = hour;
            firstDay = minute || 0;
            hour = 0;
            minute = 0;
            second = 0;
            ms = 0;
        }
        else if (typeof minute === "string" || minute == null) {
            zone = minute;
            firstDay = second || 0;
            minute = 0;
            second = 0;
            ms = 0;
        }
        else if (typeof second === "string" || second == null) {
            zone = second;
            firstDay = ms || 0;
            second = 0;
            ms = 0;
        }
        else if (typeof ms === "string" || ms == null) {
            firstDay = zone || 0;
            zone = ms;
            ms = 0;
        }

        var yearStart = new LocalTime(year, 1, 1, zone);
        var weekDay = yearStart.getDayOfWeek();
        var ordinalDay = week * 7 - 7 - (7 - weekDay + firstDay > 3 ? weekDay : weekDay - 7) + day;
        var month = 1;
        var monthDays = new Date(year, month, 0).getDate();
        while (monthDays < ordinalDay) {
            ordinalDay -= monthDays;
            month++;
            monthDays = new Date(year, month, 0).getDate();
        }
        return new LocalTime(year, month, ordinalDay + 1, hour, minute, second, ms, zone);
    };

    LocalTime.load = function (source, callback) {
        if (!source) {
            callback();
            return;
        }
        if (source.constructor === Array) {
            var s = source.pop();
            LocalTime.load(s, function (err) {
                if (err) {
                    callback(err);
                }
                else if (source.length === 0) {
                    callback();
                }
                else {
                    LocalTime.load(source, callback);
                }
            });
            return;
        }

        function isWhitespace(ch) {
            return (ch === ' ' || ch === '\r' || ch === '\t' ||
                /*ch === '\n' || */ch === '\v' || ch === '\u00A0');
        }
        function parse(line) {
            var record = [];
            var n = 0;
            while (n < line.length) {
                var ch = line[n];
                if (ch === '#') {
                    break;
                }
                else if (ch === '"') {
                    n++;
                    var e = n;
                    while (e < line.length && line[e] !== '"') {
                        e++;
                    }
                    record.push(line.slice(n, e));
                    n = e + 1;
                }
                else if (isWhitespace(ch)) {
                    n++;
                }
                else {
                    var e = n + 1;
                    while (e < line.length && !isWhitespace(line[e])) {
                        e++;
                    }
                    if (e > n) {
                        record.push(line.slice(n, e));
                        n = e + 1;
                    }
                }
            }
            return record;
        }

        function parseTime(time) {
            var pos = true;
            var result = [0, 0, 0];

            function makeValue() {
                if (pos) {
                    return result[0]*3600 + result[1]*60 + result[2];
                }
                else {
                    return -(result[0]*3600 + result[1]*60 + result[2]);
                }
            }

            var r = 0;
            var n = 0;
            if (time[0] === "-") {
                pos = false;
                n++;
            }
            else if (time[0] === "+") {
                n++;
            }
            while (n < time.length) {
                var ch = time[n];
                if (ch === ":") {
                    if (r === 2) {
                        return null;
                    }
                    r++;
                }
                else if (ch === ".") {
                    break; // Not reading fractionals
                }
                else {
                    var i = "0123456789".indexOf(ch);
                    if (i < 0) {
                        if (n === time.length - 1) {
                            ch = ch.toLowerCase();
                            switch (ch) {
                                case 'u':
                                case 'g':
                                case 'z':
                                    return {utc: makeValue()};
                                case 's':
                                    return {std: makeValue()};
                                case 'w':
                                    return makeValue();
                                default:
                                    break;
                            }
                        }
                        return null; // Unexpected character
                    }
                    result[r] = result[r]*10 + i;
                }
                n++;
            }

            return makeValue();
        }

        function parseMonth(name) {
            if (name.length > 0) {
                name = name.toLowerCase();
                switch (name[0]) {
                    case 'j':
                        if (name[1] === "a" && "january".lastIndexOf(name, 0) === 0) {
                            return 1;
                        }
                        else if (name[1] === "u") {
                            if (name[2] === "n" && "june".lastIndexOf(name, 0) === 0) {
                                return 6;
                            }
                            else if (name[2] === "l" && "july".lastIndexOf(name, 0) === 0) {
                                return 7;
                            }
                        }
                        return null;
                    case 'f':
                        if ("february".lastIndexOf(name, 0) === 0) {
                            return 2;
                        }
                        return null;
                    case 'm':
                        if (name[1] === "a") {
                            if (name[2] === "r" && "march".lastIndexOf(name, 0) === 0) {
                                return 3;
                            }
                            else if (name === "may") {
                                return 5;
                            }
                        }
                        return null;
                    case 'a':
                        if (name[1] === "p" && "april".lastIndexOf(name, 0) === 0) {
                            return 4;
                        }
                        else if ("august".lastIndexOf(name, 0) === 0) {
                            return 8;
                        }
                        return null;
                    case 's':
                        if ("september".lastIndexOf(name, 0) === 0) {
                            return 9;
                        }
                        return null;
                    case 'o':
                        if ("october".lastIndexOf(name, 0) === 0) {
                            return 10;
                        }
                        return null;
                    case 'n':
                        if ("november".lastIndexOf(name, 0) === 0) {
                            return 11;
                        }
                        return null;
                    case 'd':
                        if ("december".lastIndexOf(name, 0) === 0) {
                            return 12;
                        }
                        return null;
                    default:
                        return null;
                }
            }
            return null;
        }

        function parseDayName(name) {
            if (name.length > 0 ) {
                switch (name[0]) {
                    case 's':
                        if (name[1] === "u" && "sunday".lastIndexOf(name, 0) === 0) {
                            return 0;
                        }
                        if (name[1] === "a" && "saturday".lastIndexOf(name, 0) === 0) {
                            return 6;
                        }
                        return null;
                    case 'm':
                        if ("monday".lastIndexOf(name, 0) === 0) {
                            return 1;
                        }
                        return null;
                    case 't':
                        if (name[1] === "u" && "tuesday".lastIndexOf(name, 0) === 0) {
                            return 2;
                        }
                        if (name[1] === "h" && "thursday".lastIndexOf(name, 0) === 0) {
                            return 4;
                        }
                        return null;
                    case 'w':
                        if ("wednesday".lastIndexOf(name, 0) === 0) {
                            return 3;
                        }
                        return null;
                    case 'f':
                        if ("friday".lastIndexOf(name, 0) === 0) {
                            return 5;
                        }
                        return null;
                    default:
                        return null;
                }
            }
            return null;
        }
        function parseDay(name) {
            var number = parseInt(name);
            if (number > 0) {
                return number;
            }
            name = name.toLowerCase();
            if (name.slice(0, 4) === "last") {
                var day = parseDayName(name.slice(4));
                if (day == null) {
                    return null;
                }
                return {last: day};
            }
            var i = name.indexOf('=');
            if (i > 0) {
                var day = parseDayName(name.slice(0, i - 1));
                if (day == null) {
                    return null;
                }
                number = parseInt(name.slice(i + 1));
                if (number > 0) {
                    if (name[i - 1] === ">") {
                        return {
                            day: day,
                            from: number
                        };
                    }
                    else if (name[i - 1] === "<") {
                        return {
                            day: day,
                            to: number
                        };
                    }
                }
            }
            return null;
        }

        function applyZoneLine(zone, record) {
            var stdoff = parseTime(record[0]);
            if (stdoff != null) {
                var rule = null;
                if (record[1] !== "-") {
                    // Time rule
                    rule = parseTime(record[1]);
                    if (rule == null) {
                        // Named rule
                        rule = record[1];
                    }
                }
                var line = {
                    stdoff: stdoff,
                    rule: rule,
                    format: record[2],
                    until: null
                };

                if (record.length > 3) {
                    // Until start
                    line.until = {};
                    line.until.year = parseInt(record[3]);
                    if (record.length > 4) {
                        // Month
                        line.until.month = parseMonth(record[4]);
                        if (record.length > 5) {
                            // Day
                            line.until.day = parseDay(record[5]);
                            if (record.length > 6) {
                                // Time
                                line.until.time = parseTime(record[6]);
                            }
                        }
                    }
                }

                zone.push(line);

                return line.until != null;
            }
            return false;
        }

        function applyRule(ruleset, record) {
            var from = record[2].toLowerCase();
            if ("maximum".lastIndexOf(from, 0) === 0) {
                from = "max";
            }
            else if ("minimum".lastIndexOf(from, 0) === 0) {
                from = "min";
            }
            else {
                from = parseInt(from);
                if (!isFinite(from)) {
                    failRecord(record);
                    return;
                }
            }
            var to = record[3].toLowerCase();
            if ("maximum".lastIndexOf(to, 0) === 0) {
                to = "max";
            }
            else if ("minimum".lastIndexOf(to, 0) === 0) {
                to = "min";
            }
            else if ("only".lastIndexOf(to, 0) === 0) {
                to = "only";
            }
            else {
                to = parseInt(to);
                if (!isFinite(to)) {
                    failRecord(record);
                    return;
                }
            }
            var month = parseMonth(record[5]);
            if (month == null) {
                failRecord(record);
                return;
            }
            var on = parseDay(record[6]);
            if (on == null) {
                failRecord(record);
                return;
            }
            var at = parseTime(record[7]);
            if (at == null) {
                failRecord(record);
                return;
            }
            var save = parseTime(record[8]);
            if (save == null) {
                failRecord(record);
                return;
            }
            ruleset.push({
                from: from,
                to: to,
                month: month,
                on: on,
                at: at,
                save: save,
                letters: record[9] === "-" ? null : record[9]
            });
        }

        load(source, function (err, result) {
            var rulesets = {};
            if (err) {
                callback(err);
                return;
            }
            var lines = result.split('\n');
            var n = 0;
            while (n < lines.length) {
                var record = parse(lines[n]);
                if (record.length > 0) {
                    var type = record[0].toLowerCase()
                    if (type === "rule") {
                        var ruleset = rulesets[record[1]];
                        if (!ruleset) {
                            rulesets[record[1]] = ruleset = [];
                        }
                        applyRule(ruleset, record);
                    }
                    else if (type === "zone") {
                        var zone = {
                            name: record[1],
                            lines: []
                        };
                        TimezoneData.zones[record[1].toLowerCase()] = zone;
                        var continuing = applyZoneLine(zone.lines, record.slice(2));
                        while (continuing) {
                            n++;
                            record = parse(lines[n]);
                            if (record.length === 0) {
                                continue;
                            }
                            continuing = applyZoneLine(zone.lines, record);
                        }
                    }
                }
                n++;
            }

            for (var key in rulesets) {
                TimezoneData.rulesets[key] = rulesets[key];
            }

            callback();
        });
    };

    LocalTime.import = function (zoneData) {
        for (var key in zoneData.rulesets) {
            TimezoneData.rulesets[key] = zoneData.rulesets[key];
        }

        for (var key in zoneData.zones) {
            TimezoneData.zones[key] = zoneData.zones[key];
        }
    };

    LocalTime.export = function (zones) {
        function copyDay(day) {
            if (day == null) {
                return null;
            }

            if (typeof day === "number") {
                return day;
            } else {
                return {
                    last: day.last,
                    day: day.day,
                    from: day.from,
                    to: day.to
                };
            }
        }

        function copyTime(time) {
            if (time == null) {
                return null;
            }
            if (typeof time === "number") {
                return time;
            }
            else {
                return {
                    utc: time.utc,
                    std: time.std
                };
            }
        }

        if (typeof zones === "string") {
            zones = [zones];
        }
        var result = {rulesets:{}, zones: {}};
        for (var i = 0; i < zones.length; i++) {
            var zone = zones[i].toLowerCase();
            var data = TimezoneData.zones[zone];
            var resultZone = {
                name: data.name,
                lines: []
            };
            result.zones[zone] = resultZone;

            for (var l = 0; l < data.lines.length; l++) {
                var line = data.lines[l];
                var until = null;
                if (line.until) {
                    until = {
                        year: line.until.year,
                        month: line.until.month,
                        day: copyDay(line.until.day),
                        time: copyTime(line.until.time)
                    };

                }
                if (line.rule && !result.rulesets[line.rule]) {
                    var ruleset = TimezoneData.rulesets[line.rule];
                    var resultRuleset = [];
                    for (var r = 0; r < ruleset.length; r++) {
                        var rule = ruleset[r];
                        resultRuleset.push({
                            from: rule.from,
                            to: rule.to,
                            month: rule.month,
                            on: copyDay(rule.on),
                            at: copyTime(rule.at),
                            save: copyTime(rule.save),
                            letters: rule.letters
                        });
                    }
                    result.rulesets[line.rule] = resultRuleset;
                }
                resultZone.lines.push({
                    stdoff: line.stdoff,
                    rule: line.rule,
                    format: line.format,
                    until: until
                });
            }
        }

        return result;
    };

    var load;
    if (typeof XMLHttpRequest !== "undefined") {
        this.LocalTime = LocalTime;

        load = function (source, callback) {
            var request = new XMLHttpRequest();
            request.withCredentials = true;
            request.onreadystatechange = function() {
                if (request.readyState == 4) {
                    if (request.status >= 200 && request.status < 300) {
                        callback(null, request.response);
                    }
                    else {
                        callback("Failed");
                    }
                }
            };
            request.open("GET", source, true); // true for asynchronous
            request.send(null);
        };
    }
    else {
        if (typeof module !== "undefined" && module.exports) {
            module.exports = LocalTime;
        }

        load = (function (fs, path) {
            return function (source, callback) {
                try {
                    callback(null, fs.readFileSync(path.join(__dirname, source), "utf8"));
                }
                catch (err) {
                    callback(err);
                }
            };
        })(require('fs'), require('path'));
    }

    /*LocalTime.load(["tzdata/northamerica", "tzdata/asia"], function () {
        //var time = new LocalTime(new Date("2019-03-10T08:00Z"), "America/Denver");
        //var time2 = new LocalTime(time);
        //time2.setHours(0);
//        console.log(new LocalTime(new Date("1963-12-31T16:30Z"), "Asia/Jakarta").toString());
        //console.log(new LocalTime("2015-03-08 01:00 CDT -04:00", "America/Havana").toString());
        console.log(new LocalTime(new Date("2005-03-26T22:00Z"), "Asia/Tbilisi").toString());
        //console.log(new Date(new LocalTime("1991-03-31 02:00 +05/+06 +06:00", "Asia/Dushanbe")).toISOString());
    });*/

    //console.log(new LocalTime(2019, 7, 28, 13, 8, 0, 1).toString());
})();