async function operator(proxies) {
    const sniConfig = await getSniConfig();

    proxies.forEach((proxy) => {
        let sni = "";
        for (const property in sniConfig) {
            const value = sniConfig[property];
            if (property === "default" && isRealValue(value)) {
                sni = value.sni;
                continue;
            }
            if (
                isRealValue(value) &&
                isRealValue(value.regex) &&
                parseRegex(value.regex).test(proxy.name)
            ) {
                sni = value.sni;
                break;
            }
        }

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

async function getSniConfig() {
    const content = await produceArtifact({
        type: "file",
        name: "sni_management",
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
