const $ = $substore;

async function operator(proxies) {
    const { sni, sniUrl, allowInsecure } = $arguments;

    $.notify(`🔹 订阅昵称:「 123 」`, ``, `🔺 查询失败:「 123」`);
    const pattern =
        /(XM|X(-)?Gaming|XGame|XG|\bMAX\b|Dự Phòng|MYCLIP|FPTPLAY|MYDIO)/i;

    const host = await queryDataText(sniUrl);
    $.notify(`🔹 订阅昵称:「 ${host} 」`, ``, `🔺 查询失败:「 123」`);
    proxies.forEach((p) => {
        if (pattern.test(p.name)) {
            if (p.type === "vmess" && p.network === "ws") {
                p["ws-opts"] = p["ws-opts"] || {};
                p["ws-opts"]["headers"] = p["ws-opts"]["headers"] || {};
                p["ws-opts"]["headers"]["Host"] = host;
            }
            p.sni = host;
            if (!isRealValue(p["skip-cert-verify"])) {
                p["skip-cert-verify"] =
                    !allowInsecure || allowInsecure == "true";
            }
        }
    });
    return proxies;
}

async function queryDataText(urlEncode) {
    const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:78.0) Gecko/20100101 Firefox/78.0";
    const headers = {
        "User-Agent": ua,
    };

    const url = "https://sub.store/api/file/sni";

    const result = new Promise((resolve, reject) => {
        $.http
            .get({
                url,
                headers,
            })
            .then((resp) => {
                const body = resp.body;
                $.notify(
                    `🔹 订阅昵称:「 ${body} 」`,
                    ``,
                    `🔺 查询失败:「 123」`
                );
                resolve(body);
            })
            .catch((err) => {
                console.log(err);
                $.notify(
                    `🔹 订阅昵称:「 ${err} 」`,
                    ``,
                    `🔺 查询失败:「 123」`
                );
                reject(err);
            });
    });

    return result;
}

function isRealValue(obj) {
    return obj && obj !== "null" && obj !== "undefined";
}
