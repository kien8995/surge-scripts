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

async function operator(proxies) {
    const domains = proxies
        .filter((proxy) => isDomain(proxy.server))
        .map((proxy) => proxy.server);

    if (domains.length > 0) {
        resourceCache.revokeIds(domains);
    }

    for (const domain of domains) {
        await validateIp(domain);
    }

    return proxies;
}

async function validateIp(ip) {
    if (isDomain(ip)) {
        const cached = resourceCache.get(ip);

        if (!cached) {
            const ipLookup = await getIpFromDomain(ip);

            if (ipLookup) {
                resourceCache.set(ip, ipLookup);
            }
        }
    }
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

function isDomain(str) {
    const regexp = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}$/i;

    if (regexp.test(str)) {
        return true;
    } else {
        return false;
    }
}
