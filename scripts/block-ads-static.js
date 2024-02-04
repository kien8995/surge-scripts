function isAdScriptUrl(url) {
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

    // Parse the URL to inspect its components
    const parsedUrl = new URL(url);

    // Check the hostname and pathname for any of the keywords
    const hostnameContainsAdKeyword = adKeywords.some((keyword) =>
        parsedUrl.hostname.toLowerCase().includes(keyword)
    );
    const pathnameContainsAdKeyword = adKeywords.some((keyword) =>
        parsedUrl.pathname.toLowerCase().includes(keyword)
    );

    // Return true if any of the components contain ad-related keywords
    return hostnameContainsAdKeyword || pathnameContainsAdKeyword;
}

const url = $request.url;
const filename = url.substring(url.lastIndexOf("/") + 1);
const requestMethod = $request.method.toLowerCase();
if (requestMethod == "get" && isAdScriptUrl(filename)) {
    $done();
} else {
    $done({});
}
