/**
 * Modify obfuscated host for VMess 443 node
 * #host=google.com
 */
function operator(proxies, targetPlatform) {
    const { isSurge } = $substore.env;
    const { host, allowInsecure } = $arguments;
    if (isSurge) {
        return proxies.map((proxy) => {
            if (proxy.type === "vmess" && proxy.port === 443) {
                proxy.sni = host;
                proxy["skip-cert-verify"] = allowInsecure == "true";
            }

            // if (proxy.name !== "🇻🇳viefast AdBlock (46)") {
            //     proxy["underlying-proxy"] = "🇻🇳viefast AdBlock (46)";
            // }

            return proxy;
        });
    }

    return proxies;
}
