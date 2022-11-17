require('dotenv').config();
const bodyParser = require('body-parser');
const dns = require("node:dns");
let mongoose = require("mongoose");
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// Mongoose setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  url: {
    type: String, 
    required: true, 
    unique: true
  }
})

let urlModel = mongoose.model("urlModel", urlSchema);

async function createAndSaveURL(url) {
  const newUrl = new urlModel({
    url: url
  });

  newUrl.save(function(err, data) {
    if (err) return console.error(err);
  })
}

// App
app.use(bodyParser.urlencoded({extended: false}));

app.route("/api/shorturl").post(async (req, res) => {
  const data = await urlModel.find({});
  const original_url = req.body.url;

  const startOfHost = original_url.indexOf("https://");
  if (startOfHost != -1) {
    // const host = original_url.slice(startOfHost+8);
    // dns.lookup(host, (err, address, family) => {
    //   console.log(err, address, family);
    // });

    let id = await urlModel.exists({url: original_url});
    let shortUrl = data.findIndex((elem) => elem["url"] === original_url);

    if (id === null) {
      console.log("does not exist")
      await createAndSaveURL(original_url)

      res.json({
        original_url: original_url,
        short_url: data.length
      })

    } else {
      res.json({
        original_url: original_url,
        short_url: shortUrl
      })
    }

  } else {
    res.json({
      error: 'invalid url'
    })
  }
})

app.get("/api/shorturl/:shortUrl?", async (req, res) => {
  const data = await urlModel.find({});
  let urlData = data[req.params.shortUrl]["url"];
  res.statusCode=302;
  res.setHeader("Location", urlData);
  return res.end();
})