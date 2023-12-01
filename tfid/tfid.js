const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const natural = require('natural');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to your MongoDB database
mongoose.connect('mongodb+srv://Shyam890:zFUbW6ahQbKXpoBY@cluster0.goawzxd.mongodb.net/codeforces?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define a Mongoose schema for your documents
const questionSchema = {
  title: String,
  content: String,
  link: String,
  tag: String,
  tfidf: Object // Add a field for TF-IDF scores
};

const Question = mongoose.model("Question", questionSchema);

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

// Iterate through documents and calculate TF-IDF
Question.find({}, (err, questions) => {
  if (err) {
    console.error(err);
  } else {
    questions.forEach(question => {
      const tfidfScores = calculateTFIDF(question.content);
      question.tfidf = tfidfScores; // Store the TF-IDF scores in the 'tfidf' field

      // Save the updated document back to the database
      question.save(err => {
        if (err) {
          console.error(err);
        }
      });
    });
  }
});

// Define a route to display TF-IDF results
app.get("/tfidf", (req, res) => {
  // Fetch the documents from the database, including their TF-IDF scores
  Question.find({}, (err, questions) => {
    if (err) {
      console.error(err);
      res.send("An error occurred while fetching TF-IDF results.");
    } else {
      res.json(questions); // Display TF-IDF results as JSON (you can customize the output)
    }
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});

// Your existing Express routes can be placed here
// Add search and other routes based on your application's requirements
