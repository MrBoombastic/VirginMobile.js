// IMPORTANT! CHANGE THESE 2 LINES:
const username = "48"; //your number with '48' as prefix (but without +) or e-mail
const password = ""; //your password in plaintext
// DELETE COOKIE.TXT AFTER CHANGING LINES ABOVE!

const HttpsProxyAgent = require("https-proxy-agent");
const proxy = {url: "http://localhost", port: 8001};
const loginData = `username=${username}&password=${password}`;

module.exports = {
    username, password,
    api: {
        url: "https://virginmobile.pl/spitfire-web-api/api/v1/",
        login: "authentication/login",
        details: "user/fullDetails"
    },
    proxyOptions: {
        port: proxy.port,
        forceProxyHttps: true, //important!
        silent: true
    },
    serverOptions: {
        port: 80    //for express.js server, feel free to change it
    },
    VMconfigs: {
        login: {
            agent: new HttpsProxyAgent(proxy.url + ":" + proxy.port),
            method: "post",
            body: loginData,
            headers: {
                "Accept-Language": "pl-PL",
                "Authorization": "Basic dmlyZ2luOnZtMTIzNA==", //funfact: try to decode this base64
                "x-app-id": "U2FsdGVkX1/yC2X2icYybogWyqspG/4fEzuF9FwS8Tw=",
                "User-Agent": "VirginMobile 2.6.11, Android 5.1.1, unknown",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Content-Length": loginData.length,
                "Connection": "Keep-Alive",
                "Accept-Encoding": "gzip",
            },
        },
        fullDetails: {
            agent: new HttpsProxyAgent(proxy.url + ":" + proxy.port),
            method: 'get',
            headers: {
                "Accept-Language": "pl-PL",
                "Authorization": "Basic dmlyZ2luOnZtMTIzNA==",
                "x-app-id": "U2FsdGVkX1/yC2X2icYybogWyqspG/4fEzuF9FwS8Tw=",
                "User-Agent": "VirginMobile 2.6.11, Android 5.1.1, unknown",
                "msisdn": username,
                "Accept-Encoding": "gzip",
                "Connection": "Keep-Alive",
                "Cookie": "", //cookie will be received after logging in and automagically used in next requests
                "Host": "virginmobile.pl"
            },
        }
    }
};
