function operator(proxies) {
    const { sni, allowInsecure, regex } = $arguments;
    proxies.forEach((p) => {
        if (!regex || (regex && decodeURIComponent(regex).test(p.name))) {
            if (p.type === "vmess" && p.network === "ws") {
                p["ws-opts"] = p["ws-opts"] || {};
                p["ws-opts"]["headers"] = p["ws-opts"]["headers"] || {};
                p["ws-opts"]["headers"]["Host"] = sni;
            }
            p.sni = sni;
            if (!isRealValue(p["skip-cert-verify"])) {
                p["skip-cert-verify"] =
                    !allowInsecure || allowInsecure == "true";
            }
        }
    });
    return proxies;
}

function isRealValue(obj) {
    return obj && obj !== "null" && obj !== "undefined";
}