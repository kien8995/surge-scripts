/*
Surge configuration reference comments, thanks @congcong.

Example↓↓↓
----------------------------------------

[Script]
Sub_info = type=generic,timeout=10,script-path=https://raw.githubusercontent.com/mieqq/mieqq/master/sub_info_panel.js,script-update-interval=0,argument=url=[URL encode Airport node link]&reset_day=1&title=AmyInfo&icon=bonjour&color=#007aff

[Panel]
Sub_info = script-name=Sub_info,update-interval=600

----------------------------------------

First encode the node subscription link with traffic information, and replace the [airport node link] after "url=" with the encoded link.

(You really can’t use this shortcut to generate panels and scripts, https://www.icloud.com/shortcuts/3f24df391d594a73abd04ebdccd92584)

Optional parameter &reset_day, the following number is replaced with the date when the traffic is reset every month. For example, write 1 on the 1st and 8 on the 8th. For example, "&reset_day=8", if this parameter is not added, the traffic reset information will not be displayed.

Optional parameter &expire. If the airport link does not have expire information, you can manually pass in the expire parameter, such as "&expire=2022-02-01". Note that it must follow the format of yyyy-MM-dd. If you do not want to display expiration information, you can also add &expire=false to cancel the display.

The optional parameter "title=xxx" can customize the title.

The optional parameter "icon=xxx" can customize the icon, and the content is any valid SF Symbol Name, such as bolt.horizontal.circle.fill. For details, you can download the app https://apps.apple.com/cn/app/sf -symbols-browser/id1491161336

Optional parameter "color=xxx" When using the icon field, you can pass in the color field to control the icon color, and the field content is the HEX encoding of the color. Such as: color=#007aff
----------------------------------------

Some servers do not support head access, you can add the parameter &method=get
*/

let args = getArgs();

let url = args.url;

$httpClient.head(url, function (error, response, data) {
    body = {
        title: `${args.title}`,
        content: `header: ${response.headers}`,
        icon: "globe.asia.australia.fill",
    };
    $done(body);
});

// (async () => {
//     let info = await getDataInfo(args.url);
//     if (!info) $done();
//     let resetDayLeft = getRmainingDays(parseInt(args["reset_day"]));

//     let used = info.download + info.upload;
//     let total = info.total;
//     let expire = args.expire || info.expire;
//     let content = [`Usage: ${bytesToSize(used)} | ${bytesToSize(total)}`];

//     if (resetDayLeft) {
//         content.push(`Reset: ${resetDayLeft} days remaining`);
//     }
//     if (expire && expire !== "false") {
//         if (/^[\d.]+$/.test(expire)) expire *= 1000;
//         content.push(`Expiration: ${formatTime(expire)}`);
//     }

//     let now = new Date();
//     let hour = now.getHours();
//     let minutes = now.getMinutes();
//     hour = hour > 9 ? hour : "0" + hour;
//     minutes = minutes > 9 ? minutes : "0" + minutes;

//     $done({
//         title: `${args.title} | ${hour}:${minutes}`,
//         content: content.join("\n"),
//         icon: args.icon || "airplane.circle",
//         "icon-color": args.color || "#007aff",
//     });
// })();

function getArgs() {
    return Object.fromEntries(
        $argument
            .split("&")
            .map((item) => item.split("="))
            .map(([k, v]) => [k, decodeURIComponent(v)])
    );
}

function getUserInfo(url) {
    if (!isValidUrl(url)) return Promise.reject(new Error("Invalid URL"));

    let method = args.method || "head";
    let request = { headers: { "User-Agent": "Quantumult%20X" }, url };
    return new Promise((resolve, reject) =>
        $httpClient[method](request, (err, resp) => {
            if (err != null) {
                reject(err);
                return;
            }
            if (resp.status !== 200) {
                reject(resp.status);
                return;
            }
            let header = Object.keys(resp.headers).find(
                (key) => key.toLowerCase() === "subscription-userinfo"
            );
            if (header) {
                resolve(resp.headers[header]);
                return;
            }
            reject(
                "The link response header does not contain traffic information"
            );
        })
    );
}

async function getDataInfo(url) {
    const [err, data] = await getUserInfo(url)
        .then((data) => [null, data])
        .catch((err) => [err, null]);
    if (err) {
        console.log(err);
        return;
    }

    return Object.fromEntries(
        data
            .match(/\w+=[\d.eE+-]+/g)
            .map((item) => item.split("="))
            .map(([k, v]) => [k, Number(v)])
    );
}

function getRmainingDays(resetDay) {
    if (!resetDay) return;

    let now = new Date();
    let today = now.getDate();
    let month = now.getMonth();
    let year = now.getFullYear();
    let daysInMonth;

    if (resetDay > today) {
        daysInMonth = 0;
    } else {
        daysInMonth = new Date(year, month + 1, 0).getDate();
    }

    return daysInMonth - today + resetDay;
}

function bytesToSize(bytes) {
    if (bytes === 0) return "0B";
    let k = 1024;
    sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    let i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function formatTime(time) {
    let dateObj = new Date(time);
    let year = dateObj.getFullYear();
    let month = dateObj.getMonth() + 1;
    let day = dateObj.getDate();
    return year + "year" + month + "month" + day + "day";
}

function isValidUrl(urlString) {
    try {
        return Boolean(new URL(urlString));
    } catch (e) {
        return false;
    }
}
