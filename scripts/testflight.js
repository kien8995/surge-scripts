/*
  The Surge script implements Qx's response-body and request-body rewriting types
  
  Such as Qx:
https://service.ilovepdf.com/v1/user url response-body false response-body true
   
  Can be rewritten as Surge:
[Script] 
test = type=http-response,pattern=https://service.ilovepdf.com/v1/user,requires-body=1,script-path=https://raw.githubusercontent.com/mieqq/mieqq/master/replace-body.js, argument=false->true

argument=value to match=value to be replaced
Support regular rules: such as argument=\w+->test
Supports regular modifiers: such as argument=/\w+/g->test
Supports multiple parameters, such as: argument=matching value 1->replacement value 1&matching value 2->replacement value 2

Supports rewriting response body and request body (type=http-response or http-request). Note that the required body (requires-body=1) must be turned on.

tips 
Modifying the key-value pairs in json format can be done like this:
argument=("key")\s?:\s?"(.+?)"->$1: "new_value"

The s modifier allows . to match newline characters, such as argument=/.+/s->hello
  
*/

function getRegexp(re_str) {
    let regParts = re_str.match(/^\/(.*?)\/([gims]*)$/);
    if (regParts) {
        return new RegExp(regParts[1], regParts[2]);
    } else {
        return new RegExp(re_str);
    }
}

let body;
if (typeof $argument == "undefined") {
    console.log("requires $argument");
} else {
    if ($script.type === "http-response") {
        body = $response.body;
    } else if ($script.type === "http-request") {
        body = $request.body;
    } else {
        console.log("script type error");
    }
}

if (body) {
    $argument.split("&").forEach((item) => {
        let [match, replace] = item.split("->");
        let re = getRegexp(match);
        body = body.replace(re, replace);
    });
    $done({ body });
} else {
    console.log("Not Modify");
    $done({});
}
