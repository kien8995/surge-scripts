let params = getParams($argument);

!(async () => {
    /* Time acquisition */
    let traffic = await httpAPI("/v1/traffic", "GET");
    let dateNow = new Date();
    let dateTime = Math.floor(traffic.startTime * 1000);
    let startTime = timeTransform(dateNow, dateTime);

    if ($trigger == "button") await httpAPI("/v1/profiles/reload");

    $done({
        title: "Surge Pro",
        content: `Startup duration: ${startTime}`,
        icon: params.icon,
        "icon-color": params.color,
    });
})();

function timeTransform(dateNow, dateTime) {
    let dateDiff = dateNow - dateTime;
    let days = Math.floor(dateDiff / (24 * 3600 * 1000)); //Calculate the difference in days
    let leave1 = dateDiff % (24 * 3600 * 1000); //Calculate the number of milliseconds remaining after days
    let hours = Math.floor(leave1 / (3600 * 1000)); //Calculate hours
    //Calculate difference in minutes
    let leave2 = leave1 % (3600 * 1000); //Calculate the number of milliseconds remaining after hours
    let minutes = Math.floor(leave2 / (60 * 1000)); //Calculate difference in minutes
    //Calculate the difference in seconds
    let leave3 = leave2 % (60 * 1000); //Calculate the number of milliseconds remaining after minutes
    let seconds = Math.round(leave3 / 1000);

    if (days == 0) {
        if (hours == 0) {
            if (minutes == 0) return `${seconds}s`;
            return `${minutes}m${seconds}s`;
        }
        return `${hours}h${minutes}m${seconds}s`;
    } else {
        return `${days}d${hours}h${minutes}m`;
    }
}

function httpAPI(path = "", method = "POST", body = null) {
    return new Promise((resolve) => {
        $httpAPI(method, path, body, (result) => {
            resolve(result);
        });
    });
}

function getParams(param) {
    return Object.fromEntries(
        $argument
            .split("&")
            .map((item) => item.split("="))
            .map(([k, v]) => [k, decodeURIComponent(v)])
    );
}
