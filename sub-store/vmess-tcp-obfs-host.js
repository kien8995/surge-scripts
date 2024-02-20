/**
 * Modify obfuscated host for VMess 443 node
 * #host=google.com
 */
function operator(proxies) {
    const { isSurge } = $substore.env;
    const { host } = $arguments;
    proxies.forEach((p) => {
        if (p.type === "vmess" && p.port == 443) {
            proxy.sni = host;
        }
    });
    return proxies;
}
