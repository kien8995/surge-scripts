let params = getParams($argument);

!(async () => {
    /* Time acquisition */
    // let traffic = await httpAPI("/v1/traffic", "GET");
    // let dateNow = new Date();
    // let dateTime = Math.floor(traffic.startTime * 1000);
    // let startTime = timeTransform(dateNow, dateTime);

    // if ($trigger == "button") await httpAPI("/v1/profiles/reload");

    $done({
        title: `${params.title}`,
        content: `${params.url.split("|")}`,
        icon: params.icon,
        "icon-color": params.color,
    });
})();

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
