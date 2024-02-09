let params = getParams($argument);

!(async () => {
    /* Time acquisition */
    // let traffic = await httpAPI("/v1/traffic", "GET");
    // let dateNow = new Date();
    // let dateTime = Math.floor(traffic.startTime * 1000);
    // let startTime = timeTransform(dateNow, dateTime);

    // if ($trigger == "button") await httpAPI("/v1/profiles/reload");
    let urls = params.urls.split("|");
    console.log("20");
    console.log("param: ", $argument, " ", typeof $argument);
    console.log(typeof urls);
    console.log("start: ", urls);
    let response = await httpAPI(urls[0], "HEAD");
    console.log("end.");

    $done({
        title: `${params.title} rsatsrt`,
        content: `headers: ${response.headers} status: ${response.status}`,
        icon: params.icon,
        "icon-color": params.color,
    });
})();

function httpAPI(path = "", method = "POST", body = null) {
    return new Promise((resolve) => {
        $httpAPI(method, path, body, (error, response, data) => {
            resolve(response);
        });
    });
}

function getParams(param) {
    console.log(param);
    return Object.fromEntries(
        $argument
            .split("&")
            .map((item) => item.split("="))
            .map(([k, v]) => [k, decodeURIComponent(v)])
    );
}
