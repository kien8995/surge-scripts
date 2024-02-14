body = $response.body.replace('"hasVipTrial": false', '"hasVipTrial": true');
$done({ body });
