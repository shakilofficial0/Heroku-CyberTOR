const express = require("express");
const compression = require("compression");
const bodyParser = require("body-parser");
const serveIndex = require("serve-index");

const humanTime = require("./utils/humanTime");
const keepalive = require("./utils/keepalive");
const diskinfo = require("./utils/diskinfo");
const status = require("./utils/status");
const { getFiles, sendFileStream, getAuthURL, getAuthToken } = require("./utils/gdrive");

const search = require("./routes/search");
const details = require("./routes/details");
const torrent = require("./routes/torrent");

const dev = process.env.NODE_ENV !== "production";
const allowWeb = !process.env.DISABLE_WEB;
const PORT = parseInt(process.env.PORT, 10) || 3000;

const server = express();

keepalive();

server.use(compression());
server.use(bodyParser.json());
server.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

server.get("/ping", (req, res) => res.send("pong"));

server.get("/logs", (req, res) => res.sendFile("logs.txt", { root: __dirname }));

server.use("/downloads", express.static("downloads"), serveIndex("downloads", { icons: true }));

server.use("/api/v1/drive/folder", async (req, res) => {
  const folderId = req.query.id;
  res.send(await getFiles(folderId));
});

server.use("/api/v1/drive/file/:id", sendFileStream);

server.use("/api/v1/drive/getAuthURL", (req, res) => {
  const CLIENT_ID = req.query.clientId;
  const CLIENT_SECRET = req.query.clientSecret;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    res.send(JSON.stringify({ error: "Client Id and secret are required" }));
  } else {
    const authURL = getAuthURL(CLIENT_ID, CLIENT_SECRET);
    res.send(JSON.stringify({ error: "", authURL }));
  }
});

server.use("/api/v1/drive/getAuthToken", async (req, res) => {
  const CLIENT_ID = req.query.clientId;
  const CLIENT_SECRET = req.query.clientSecret;
  const AUTH_CODE = req.query.authCode;

  if (!CLIENT_ID || !CLIENT_SECRET || !AUTH_CODE) {
    res.send(JSON.stringify({ error: "Client Id and secret and auth code are required" }));
  } else {
    const token = await getAuthToken(CLIENT_ID, CLIENT_SECRET, AUTH_CODE);
    res.send(JSON.stringify({ token, error: "" }));
  }
});

server.use("/api/v1/torrent", torrent);
server.use("/api/v1/search", search);
server.use("/api/v1/details", details);

server.get("/403error", (req, res) => {	
	res.send(`	
<html lang="en"><head>	
<meta charset="UTF-8">	
<link rel="apple-touch-icon" type="image/png" href="https://static.codepen.io/assets/favicon/apple-touch-icon-5ae1a0698dcc2402e9712f7d01ed509a57814f994c660df9f7a952f3060705ee.png">	
<meta name="apple-mobile-web-app-title" content="CodePen">	
<link rel="mask-icon" type="" href="https://static.codepen.io/assets/favicon/logo-pin-8f3771b1072e3c38bd662872f6b673a722f4b3ca2421637d5596661b4e2132cc.svg" color="#111">	
<title>403 Forbidden</title>	
<meta name="viewport" content="width=device-width, initial-scale=1">	
<style>	
@import url("https://fonts.googleapis.com/css?family=Raleway:400,400i,700");	
* {	
  font-family: Raleway, sans-serif;	
}	
html,	
body,	
.container {	
  width: 100%;	
  height: 100%;	
  padding: 0;	
  margin: 0;	
}	
.container {	
  background: #2f2f2f;	
  display: flex;	
  align-items: center;	
  justify-content: center;	
  flex-wrap: wrap;	
}	
.content {	
  margin: 20px;	
}	
.mask {	
  display: block;	
  /* animation: mask 1s infinite; */	
  mask-image: url(https://i.postimg.cc/kgBSj8Zz/Masquerade.png);	
  mask-repeat: no-repeat;	
  -webkit-mask-image: url(https://i.postimg.cc/kgBSj8Zz/Masquerade.png);	
  -webkit-mask-repeat: no-repeat;	
}	
.text-center {	
  text-align: center;	
}	
.color-white-shadow {	
  color: #fff;	
  text-shadow: 0 -1px #0f0f0f;	
}	
/*	
@keyframes mask {	
  50% {	
    transform: scale(1.05);	
  }	
}	
*/	
</style>	
<script>	
  window.console = window.console || function(t) {};	
</script>	
<script>	
  if (document.location.search.match(/type=embed/gi)) {	
    window.parent.postMessage("resize", "*");	
  }	
</script>	
</head>	
<body translate="no">	
<div class="container">	
<div class="content">	
<h2 class="color-white-shadow text-center">403 Forbidden<br><small>Access denied</small></h2>	
<img src="https://images.unsplash.com/photo-1506202687253-52e1b29d3527?ixlib=rb-0.3.5&amp;s=b43d68ed98b673427669234757d85e56&amp;auto=format&amp;fit=crop&amp;w=300&amp;q=80" width="300" height="140" class="mask">	
<p class="color-white-shadow text-center">You are not allowed to access this account<br>Because it's in private mode.</p>	
</div>	
</div>	
</body></html>	
`);	
});

server.get("/api/v1/uptime", async (req, res) => {
  res.send({ uptime: humanTime(process.uptime() * 1000) });
});

server.get("/api/v1/diskinfo", async (req, res) => {
  const path = req.query.path;
  const info = await diskinfo(path);
  res.send(info);
});

server.get("/api/v1/status", async (req, res) => {
  const currStatus = await status();
  res.send(currStatus);
});

if (allowWeb) {
  console.log("web allowed");
  server.use("/static", express.static("web/build/static"));
  server.all("*", (req, res) => res.sendFile("web/build/index.html", { root: __dirname }));
} else {
  console.log("web disabled");
}

server.listen(PORT, () => {
  console.log(`> Running on http://localhost:${PORT}`);
});
