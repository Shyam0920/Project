const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const day = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const app = express();
const _ = require("lodash");
const natural = require('natural');

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://Shyam890:zFUbW6ahQbKXpoBY@cluster0.goawzxd.mongodb.net/codeforces?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('strictQuery', false);

const questionSchema = {
  title: String,
  content: String,
  link: String,
  tag: String,
  tfidf: Object // Add a field for TF-IDF scores
};

const Question = mongoose.model("Question", questionSchema);

let links = [];
let ids = [];
let tgs = [];
let cnts = [];

app.get("/", function (req, res) {
  res.render("list", {
    listTitle: day.getDate(),
    qsts: ids,
    link: links,
    content: cnts,
    tag: tgs
  });
});

// Function to calculate TF-IDF scores for a given text
function calculateTFIDF(text) {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text);
  const tfidf = new natural.TfIdf();
  tfidf.addDocument(tokens);

  const tfidfScores = {};
  tfidf.listTerms(0).forEach(term => {
    tfidfScores[term.term] = term.tfidf;
  });

  return tfidfScores;
}

app.post("/", function (req, res) {
  const itemName = _.toLower(req.body.qst);
  const searchResults = {
    qsts: [],
    links: [],
    content: [],
    tgs: []
  };

  Question.find(function (err, foundQuestions) {
    if (err) {
      console.log(err);
    } else {
      foundQuestions.forEach(function (foundQuestion) {
        let a = _.toLower(foundQuestion.title);
        a = a.replace(/\s+/g, '');

        let b = _.toLower(foundQuestion.content);
        b = b.replace(/\s+/g, '');

        let d = _.toLower(foundQuestion.tag);
        d = d.replace(/\s+/g, '');

        // Implement the TF-IDF-based search
        const tfidfScores = calculateTFIDF(foundQuestion.content);
        const matchedTerms = Object.keys(tfidfScores).filter(term => {
          return term.includes(itemName);
        });

        if (a.includes(itemName) || b.includes(itemName) || d.includes(itemName) || matchedTerms.length > 0) {
          searchResults.qsts.push(foundQuestion.title);
          searchResults.links.push(foundQuestion.link);
          searchResults.tgs.push(foundQuestion.tag);
          searchResults.content.push(foundQuestion.content);
        }
      });
    }

    res.render("list2", {
      listTitle: day.getDate(),
      qsts: searchResults.qsts,
      link: searchResults.links,
      content: searchResults.content,
      tag: searchResults.tgs
    });
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started successfully");
});
