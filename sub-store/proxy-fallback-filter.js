const SUB_NAME = "-master";
const FALLBACK_SUB_NAME = "-slave";

function operator(proxies = [], targetPlatform, context) {
    let finalProxies = [];
    finalProxies.push(
        ...proxies.filter(
            (p) =>
                !p.subName.endsWith(SUB_NAME) &&
                !p.subName.endsWith(FALLBACK_SUB_NAME)
        )
    );

    const masterSlaveProxies = proxies.filter(
        (p) =>
            p.subName.endsWith(SUB_NAME) ||
            p.subName.endsWith(FALLBACK_SUB_NAME)
    );

    const masterSlaveObject = groupProxy(masterSlaveProxies);
    for (const key in masterSlaveObject) {
        const keyProxies = masterSlaveObject[key];

        if (keyProxies.some((p) => p.subName.endsWith(SUB_NAME))) {
            finalProxies.push(
                ...keyProxies.filter((p) => p.subName.endsWith(SUB_NAME))
            );
        } else {
            finalProxies.push(
                ...keyProxies.filter((p) =>
                    p.subName.endsWith(FALLBACK_SUB_NAME)
                )
            );
        }
    }

    return finalProxies;
}

function groupProxy(arr) {
    return arr.reduce((store, proxy) => {
        const key = proxy.subName.substring(0, proxy.subName.lastIndexOf("-"));
        const keyStore = store[key] || (store[key] = []);
        keyStore.push(proxy);

        return store;
    }, {});
}
