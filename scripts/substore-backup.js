$httpClient.get({
    url: "https://sub.store/api/utils/backup?action=upload",
    headers: {
        "sec-fetch-site": "cross-site",
        accept: "application/json, text/plain, */*",
        origin: "https://sub-store.vercel.app",
        "sec-fetch-dest": "empty",
        "accept-language": "en-US,en;q=0.9",
        "sec-fetch-mode": "cors",
        "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        referer: "https://sub-store.vercel.app/",
        "accept-encoding": "gzip, deflate, br",
    },
});
$done();
