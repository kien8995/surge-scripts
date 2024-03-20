async function filter(proxies) {
    const { fileId, type } = $arguments;

    const sniConfig = await getSniConfig(fileId);

    return proxies.map((proxy) =>
        parseRegex(sniConfig[type].regex).test(proxy.name)
    );
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
