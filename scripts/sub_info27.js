!(async () => {
    /* Time acquisition */
    // let traffic = await httpAPI("/v1/traffic", "GET");
    // let dateNow = new Date();
    // let dateTime = Math.floor(traffic.startTime * 1000);
    // let startTime = timeTransform(dateNow, dateTime);
    let params = getParams($argument);
    // if ($trigger == "button") await httpAPI("/v1/profiles/reload");
    console.log("param: ", params, " ", typeof params);
    let urls = params.urls;
    console.log("27");
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
    const result = Object.fromEntries(
        $argument
            .split("&")
            .map((item) => item.split("="))
            .map(([k, v]) => [k, decodeURIComponent(v)])
    );
    console.log(result);
    console.log(result.urls);
    console.log(result.urls.split("|")[0]);
    const [err, data] = httpAPI(result.urls.split("|")[0], "HEAD")
        .then((data) => [null, data])
        .catch((err) => [err, null]);
    if (err) {
        console.log(err);
        return;
    }

    console.log(data.headers);

    return result;
}
