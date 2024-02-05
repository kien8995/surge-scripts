function isAdScript(filename) {
    // Define a list of keywords that are commonly found in ad script URLs
    const adKeywords = [
        "ad",
        "ads",
        "advert",
        "advertisement",
        "advertising",
        "doubleclick",
        "googleads",
        "adserver",
        "adtech",
    ];

    // Check the hostname and pathname for any of the keywords
    const hostnameContainsAdKeyword = adKeywords.some((keyword) =>
        filename.toLowerCase().includes(keyword)
    );
    const pathnameContainsAdKeyword = adKeywords.some((keyword) =>
        filename.toLowerCase().includes(keyword)
    );

    // Return true if any of the components contain ad-related keywords
    return hostnameContainsAdKeyword || pathnameContainsAdKeyword;
}

function getPathFromUrl(url) {
    return url.split(/[?#]/)[0];
}

const url = getPathFromUrl($request.url);
const filename = url.substring(url.lastIndexOf("/") + 1);
const requestMethod = $request.method.toLowerCase();
if (requestMethod == "get" && isAdScript(filename)) {
    $done();
} else {
    $done({});
}
