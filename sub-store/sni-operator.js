async function operator(proxies) {
    const sniConfig = await getSniConfig();

    const regexCondition = (config, proxy) =>
        parseRegex(config.regex).test(proxy.name);
    const portsCondition = (config, proxy) =>
        config.ports.some((port) => port === proxy.port);
    const ipsCondition = async (config, proxy) => {
        const validations = await Promise.all(
            config.ips.map((ip) => validateIp(proxy.server, ip))
        );
        return validations.some((validation) => validation);
    };

    for (const proxy of proxies) {
        let sni = "";
        for (const property in sniConfig) {
            const value = sniConfig[property];
            if (!isRealValue(value)) {
                continue;
            }
            if (property === "default") {
                sni = value.sni;
                continue;
            }
            if (!isRealValue(value.skip) || !value.skip) {
                const conditions = [];

                if (isRealValue(value.regex)) {
                    conditions.push(regexCondition);
                }
                if (isRealValue(value.ports)) {
                    conditions.push(portsCondition);
                }
                if (isRealValue(value.ips)) {
                    conditions.push(ipsCondition);
                }

                const result = await runConditions(conditions, value, proxy);

                if (result) {
                    sni = value.sni;
                    break;
                }
            }
        }

        updateSNI(proxy, sni);
    }

    return proxies;
}

async function runConditions(conditions, config, proxy) {
    const results = await Promise.all(
        conditions.map((condition) => condition(config, proxy))
    );
    return results.every((result) => result);
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

async function validateIp(ip, subnet) {
    let result = ip;
    if (isDomain(ip)) {
        result = await getIpFromDomain(ip);
    }

    return inSubNet(result, subnet);
}

function inSubNet(ip, subnet) {
    if (!isValidIpAddress(ip)) {
        return false;
    }

    if (subnet.indexOf("/") < 0) {
        if (ip === subnet) {
            return true;
        }

        if (
            areFirstThreePartsEqual(ip, subnet) &&
            getLastPartOfIP(subnet) === "*"
        ) {
            return true;
        }

        return false;
    }

    let mask,
        base_ip,
        long_ip = ip2long(ip);
    if (
        (mask = subnet.match(/^(.*?)\/(\d{1,2})$/)) &&
        (base_ip = ip2long(mask[1])) >= 0
    ) {
        const freedom = Math.pow(2, 32 - parseInt(mask[2]));
        return long_ip >= base_ip && long_ip <= base_ip + freedom - 1;
    } else return false;
}

function ip2long(ip) {
    let components;

    if (
        (components = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/))
    ) {
        let iplong = 0;
        let power = 1;
        for (let i = 4; i >= 1; i -= 1) {
            iplong += power * parseInt(components[i]);
            power *= 256;
        }
        return iplong;
    } else return -1;
}

async function getIpFromDomain(domain) {
    const ip = await $substore.http
        .get(`https://dns.google/resolve?name=${domain}`)
        .then((resp) => {
            const data = JSON.parse(resp.body);
            if (data.Status === 0) {
                const foundIp = data.Answer.find((obj) => obj.type === 1);
                if (foundIp) {
                    return foundIp.data;
                } else {
                    return "";
                }
            }
            return "";
        });
    return ip;
}

function areFirstThreePartsEqual(ip1, ip2) {
    const parts1 = ip1.split(".");
    const parts2 = ip2.split(".");

    if (parts1.length < 3 || parts2.length < 3) {
        return false;
    }

    for (let i = 0; i < 3; i++) {
        if (parts1[i] !== parts2[i]) {
            return false;
        }
    }

    return true;
}

function getLastPartOfIP(ip) {
    const parts = ip.split(".");
    return parts[parts.length - 1];
}

function isValidIpAddress(ipAddress) {
    if (
        /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)(\/([1-9]|[1-2][0-9]|3[0-2])){0,1}$/.test(
            ipAddress
        )
    ) {
        return true;
    }

    return false;
}

function isDomain(str) {
    const regexp = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}$/i;

    if (regexp.test(str)) {
        return true;
    } else {
        return false;
    }
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
