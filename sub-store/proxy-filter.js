const RESOURCE_CACHE_KEY = "#sub-store-cached-dns";
const CACHE_EXPIRATION_TIME_MS = 7 * 24 * 60 * 60 * 1000;

const $ = $substore;

class ResourceCache {
    constructor(expires) {
        this.expires = expires;
        const cachedData = $.read(RESOURCE_CACHE_KEY);
        if (!cachedData) {
            this.resourceCache = {};
            this._persist();
        } else {
            this.resourceCache = JSON.parse(cachedData);
        }
        this._cleanup();
    }

    _cleanup() {
        // clear obsolete cached resource
        let clear = false;
        const now = new Date().getTime();
        Object.keys(this.resourceCache).forEach((id) => {
            const updated = this.resourceCache[id];
            if (!updated.time || now - updated.time > this.expires) {
                delete this.resourceCache[id];
                $.delete(`#${id}`);
                clear = true;
            }
        });
        if (clear) this._persist();
    }

    revokeIds(ids) {
        let clear = false;
        for (const id of ids) {
            delete this.resourceCache[id];
            clear = true;
        }
        if (clear) this._persist();
    }

    revokeAll() {
        this.resourceCache = {};
        this._persist();
    }

    _persist() {
        $.write(JSON.stringify(this.resourceCache), RESOURCE_CACHE_KEY);
    }

    get(id) {
        const updated = this.resourceCache[id] && this.resourceCache[id].time;
        if (updated && new Date().getTime() - updated <= this.expires) {
            return this.resourceCache[id].data;
        }
        return null;
    }

    set(id, value) {
        this.resourceCache[id] = { time: new Date().getTime(), data: value };
        this._persist();
    }
}

const resourceCache = new ResourceCache(CACHE_EXPIRATION_TIME_MS);

async function filter(proxies) {
    const { type } = $arguments;

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

    const value = sniConfig[type];
    return await Promise.all(
        proxies.map((proxy) => {
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

            return runConditions(conditions, value, proxy);
        })
    );
}

async function runConditions(conditions, config, proxy) {
    const results = await Promise.all(
        conditions.map((condition) => condition(config, proxy))
    );
    return results.every((result) => result);
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
        const cached = resourceCache.get(ip);

        if (cached) {
            result = cached;
        } else {
            const ipLookup = await getIpFromDomain(ip);
            result = ipLookup;

            if (ipLookup) {
                resourceCache.set(ip, ipLookup);
            }
        }
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
    const ip = await $.http
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
