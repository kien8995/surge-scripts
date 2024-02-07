var tlist = {
    1: ["Mid-Autumn Festival", "2022-09-10"],
    2: ["National Day", "2022-10-01"],
    3: ["New Year's Day", "2023-01-01"],
    4: ["Spring Festival", "2023-01-22"],
    5: ["Lanxiao", "2023-02-05"],
    6: ["Qingming", "2023-04-05"],
    7: ["Labor", "2023-05-01"],
    8: ["Dragon Boat Festival", "2023-06-22"],
    9: ["Mid-Autumn Festival", "2023-09-29"],
    10: ["National Day", "2023-10-01"],
    11: ["New Year's Day", "2024-01-01"],
};
let tnow = new Date();
let tnowf =
    tnow.getFullYear() + "-" + (tnow.getMonth() + 1) + "-" + tnow.getDate();

/* Calculate the number of days between two dates, excluding today, for example: 2016-12-13 to 2016-12-15, the difference is 2 days
 * @param startDateString
 * @param endDateString
 * @returns
 */
function dateDiff(startDateString, endDateString) {
    var separator = "-"; //日期分隔符
    var startDates = startDateString.split(separator);
    var endDates = endDateString.split(separator);
    var startDate = new Date(startDates[0], startDates[1] - 1, startDates[2]);
    var endDate = new Date(endDates[0], endDates[1] - 1, endDates[2]);
    return parseInt((endDate - startDate) / 1000 / 60 / 60 / 24).toString();
}

//Calculate the interval between the time corresponding to the input serial number and the current number of days
function tnumcount(num) {
    let dnum = num;
    return dateDiff(tnowf, tlist[dnum][1]);
}

//Get the closest date
function now() {
    for (var i = 1; i <= Object.getOwnPropertyNames(tlist).length; i++) {
        if (Number(dateDiff(tnowf, tlist[i.toString()][1])) >= 0) {
            //console.log("The most recent date is:" + tlist[i.toString()][0]);
            //console.log("List length:" + Object.getOwnPropertyNames(tlist).length);
            //console.log("Time gap:" + Number(dateDiff(tnowf, tlist[i.toString()][1])));
            return i;
        }
    }
}

//If it is 0 days, send emoji;
let nowlist = now();
function today(day) {
    let daythis = day;
    if (daythis == "0") {
        datenotice();
        return "🎉";
    } else {
        return daythis + " day";
    }
}

//Send notification on reminder day
function datenotice() {
    if (
        $persistentStore.read("timecardpushed") != tlist[nowlist][1] &&
        tnow.getHours() >= 6
    ) {
        $persistentStore.write(tlist[nowlist][1], "timecardpushed");
        $notification.post(
            "holiday wishes",
            "",
            "Today is" +
                tlist[nowlist][1] +
                "Day " +
                tlist[nowlist][0] +
                "   🎉"
        );
    } else if ($persistentStore.read("timecardpushed") == tlist[nowlist][1]) {
        //console.log("Notified on the day");
    }
}

//>The icons switch to tortoise, rabbit, alarm clock, and gift box in sequence.
function icon_now(num) {
    if (num <= 7 && num > 3) {
        return "hare";
    } else if (num <= 3 && num > 0) {
        return "timer";
    } else if (num == 0) {
        return "gift";
    } else {
        return "tortoise";
    }
}

$done({
    title: title_random(tnumcount(Number(nowlist))),
    icon: icon_now(tnumcount(Number(nowlist))),
    content:
        tlist[nowlist][0] +
        ":" +
        today(tnumcount(nowlist)) +
        "," +
        tlist[Number(nowlist) + Number(1)][0] +
        ":" +
        tnumcount(Number(nowlist) + Number(1)) +
        "day," +
        tlist[Number(nowlist) + Number(2)][0] +
        ":" +
        tnumcount(Number(nowlist) + Number(2)) +
        "day",
});

function title_random(num) {
    let r = Math.floor(Math.random() * 10 + 1);
    let dic = {
        1: "How many days are left until the holiday?",
        2: "Hold on, it's almost time for a holiday!",
        3: "I'm so tired from work. What's for dinner next?",
        4: "If I work hard, I can still work 24 hours overtime!",
        5: "What to do today: eat, avoid: lose weight",
        6: "Lie down and wait for the holiday",
        7: "The only way to make money from the boss is by fishing",
        8: "Let's fish together",
        9: "Looking forward to the next holiday",
        10: "The little turtle crawls slowly",
    };
    return num == 0 ? "Happy holidays and all the best" : dic[r];
}
