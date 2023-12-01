const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const axios = require('axios');
const { parse } = require('node-html-parser');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://Shyam890:zFUbW6ahQbKXpoBY@cluster0.goawzxd.mongodb.net/codeforces?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const questionSchema = {
  title: String,
  content: String,
  link: String,
  tag: String
};

const Question = mongoose.model("Question", questionSchema);

app.listen(3000, async () => {
  console.log("Server started on port 3000");

  const pageCount = 30;

  for (let i = 1; i <= pageCount; i++) {
    const url = 'https://codeforces.com/problemset/page/' + i;

    try {
      const html = await axios.get(url);
      const dom = parse(html.data);
      const h1 = dom.querySelectorAll("a");
      const scrapePromises = [];

      for (let j = 0; j < h1.length; j++) {
        const a = h1[j].text.trim();
        const b = h1[j].getAttribute("href");

        if (b.startsWith('/problemset/problem/')) {
          const str = b.substr(20).replace(/\//g, '');
          if (str !== a) {
            const item = new Question({
              title: str,
              content: a,
              link: "https://codeforces.com" + b,
            });
            scrapePromises.push(item.save());

            const tagUrl = "https://codeforces.com" + b;
            const tagHtml = await axios.get(tagUrl);
            const tagDom = parse(tagHtml.data);
            const tagElements = tagDom.querySelectorAll(".tag-box");
            const tags = tagElements.map((element) => element.innerText.trim()).join('/');
            
            scrapePromises.push(Question.updateOne({ title: str }, { tag: tags }));
          }
        }
      }

      await Promise.all(scrapePromises);
      console.log(`Page ${i} scraped successfully.`);
    } catch (err) {
      console.error(`Error while scraping page ${i}: ${err}`);
    }
  }
});
