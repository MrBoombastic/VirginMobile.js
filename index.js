process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0; //Disabling safety check
const config = require("./config.js");  //Bunch of requires
const AnyProxy = require('anyproxy');
const dayjs = require("dayjs");
const proxyServer = new AnyProxy.ProxyServer(config.proxyOptions); //MITM proxy server
const fetch = require("node-fetch");
const express = require("express");
const app = express();
const fs = require("fs");
app.set('view engine', 'ejs');
if (!config.username || !config.password) return console.error("Please populate username and password in config.js!");
const b2s = t => { //Converting KB to anything greater
    let e = Math.log2(t) / 10 | 0;
    return (t / 1024 ** (e = e <= 0 ? 0 : e)).toFixed(3) + " " + "BKMGP"[e + 1] + "B";
};

const saveVMData = async () => { //Fetching and saving data
    const fullDetails = config.VMconfigs.fullDetails;
    fullDetails.headers.Cookie = fs.readFileSync("./cookie.txt"); //Reading cookie saved by Hello function
    const response = await fetch(config.api.url + config.api.details, config.VMconfigs.fullDetails);
    if (response.status !== 200) {
        console.error("Error fetching data from VM! Deleting cookie to force re-login next time.");
        fs.unlinkSync("./cookie.txt");
        return await VMhello();
    }
    const body = await response.json();
    body.updateTimestamp = Date.now();
    fs.writeFileSync("./VMdata.json", JSON.stringify(body));
    //humanData section - creating .txt file for humans (but in Polish)
    let humanData = "";
    body.msisdnDetails.forEach(number => {
        humanData += `Numer telefonu: ${number.msisdn}\n` + //phone number
            `Ważność konta: ${dayjs(number.customerBalancesDto.generalBalance.validDate).format("DD/MM/YYYY")}\n` + //account valid date
            `Stan konta: ${number.customerBalancesDto.generalBalance.quantity} zł\n` + //account balance
            `Nazwa taryfy: ${number.tariffName}\n` +
            `Nazwa pakietu dodatkowego: ${number.complexBundleName}\n` +
            `Ważność pakietu dodatkowego: ${dayjs(number.complexBundleValidDate).format("DD/MM/YYYY")}\n` +
            `Stan minut: ${Math.round(number.customerBalancesDto.complexBundleVoiceBalance.quantity / 60)} minut => ${number.customerBalancesDto.complexBundleVoiceBalance.quantity} sekund\n` + //minutes left
            `Stan Internetu: ${b2s(number.customerBalancesDto.dataBalance.quantity)}\n` + //mobile data
            `Stan SMS: ${number.customerBalancesDto.smsBalance.quantity}\n\n`;
    });
    humanData += "Data aktualizacji: " + dayjs(body.updateTimestamp).format("YYYY-MM-DD HH:mm:ss"); //update time
    fs.writeFileSync("./VMdata-human.txt", humanData);
};

const VMhello = async () => {
    const response = await fetch(config.api.url + config.api.login, config.VMconfigs.login);
    if (response.status !== 200) return console.error("Error while logging in. Aborting now!");
    fs.writeFileSync("./cookie.txt", response.headers.get('set-cookie').split('; ')[0]);
    await saveVMData();
    setInterval(saveVMData, 1000 * 60 * 5); //5 mins
};

app.get('/', async (req, res) => {
    res.render("./index.ejs", JSON.parse(fs.readFileSync("./VMdata.json"))); //using 'require' caches data, doing fs instead
});

if (config.serverOptions.enabled) app.listen(config.serverOptions.port, () => console.log(`Server listening at port ${config.serverOptions.port}`));

proxyServer.start(); //starting mitm proxy and decrypting messages
proxyServer.on('error', (e) => console.error(e));

//because onStart is too fast appearently...
setTimeout(VMhello, 3000);

process.on("exit", () => proxyServer.close()); //gently saying 'goodbye'