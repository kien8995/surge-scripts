async function operator(proxies) {
    const { fileId } = $arguments;

    const sniConfig = await getSniConfig(fileId);
    const { xgaming, local } = sniConfig;

    proxies.forEach((proxy) => {
        const isXgaming = parseRegex(xgaming.regex).test(proxy.name);
        const isLocal = parseRegex(local.regex).test(proxy.name);

        const sni = isXgaming
            ? xgaming.sni
            : isLocal
            ? local.sni
            : sniConfig.default.sni;

        updateSNI(proxy, sni);
    });
    return proxies;
}

function updateSNI(proxy, sni) {
    if (proxy.type === "vmess" && proxy.network === "ws") {
        proxy["ws-opts"] = proxy["ws-opts"] || {};
        proxy["ws-opts"]["headers"] = proxy["ws-opts"]["headers"] || {};
        proxy["ws-opts"]["headers"]["Host"] = sni;
    }
    proxy.sni = sni;
    if (!isRealValue(proxy["skip-cert-verify"])) {
        proxy["skip-cert-verify"] = true;
    }
}

async function getSniConfig(fileId) {
    const content = await produceArtifact({
        type: "file",
        name: fileId,
    });

    const result = ProxyUtils.yaml.safeLoad(content);

    return result;
}

function parseRegex(str) {
    const lastSlash = str.lastIndexOf("/");
    const restoredRegex = new RegExp(
        str.slice(1, lastSlash),
        str.slice(lastSlash + 1)
    );

    return restoredRegex;
}

function isRealValue(obj) {
    return obj && obj !== "null" && obj !== "undefined";
}
