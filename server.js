// Dependencies

var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models.
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
var methodOverride = require("method-override");

// Mongoose mpromise deprecated = using bluebird promise instead.

mongoose.Promise = Promise;

// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
	extended: false
}));

// Override with POST having ?_method=DELETE
app.use(methodOverride("_method"));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose.
mongoose.connect("mongodb://heroku_mf65s4zk:cp8k7k2n0uo3unvren203pv55c@ds157549.mlab.com:57549/heroku_mf65s4zk");
var db = mongoose.connection;

// Log our errors from mongoose.
db.on("error", function(error) {
	console.log("Mongoose Error: ", error);
});

db.once("open", function() {
	console.log("mongoose connection successful");
});

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
app.get("/", function(req, res) {
	Article.find({}, function(error, doc) {
		if(error) {
			console.log(error);
		}
		else {
			console.log(hbsObject);
			var hbsObject = { articles: doc};
			res.render("index", hbsObject);
		}
	});
});

// get our articles from hear.
app.get("/scrape", function(req, res) {
	request("https://www.nytimes.com/section/world", function(error, response, html) {
		// load cheerio and save for shorthand.
		var $ = cheerio.load(html);
		$("article div h2").each(function(i, element) {
			//save an empty result object
			var result = {};

			result.title = $(this).children("a").text();
			result.link = $(this).children("a").attr("href");

			var entry = new Article(result);

			entry.save(function(error, doc) {
				if (error) {
					console.log(error);
				} else {
					console.log(doc);
				}
			});
		});
	});

	res.redirect("/");
});

app.get("/articles/:id", function(req, res) {
	Article.findOne({"_id": req.params.id })
	.populate("note")
	.exec(function(error, doc) {
		if (error) {
			console.log(error);s
		}
		else {
			var hbsObject = {notes: doc};
			res.render("saved", hbsObject);
		}
	})
});

app.post("/articles/:id", function(req, res) {
	// Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      return console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "books": doc._id } }, { new: true })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          return console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});

app.put("/saved/:id", function(req, res) {
	Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": true}, function(error, doc) {
		if(error) {
			return console.log(error);
		} else {
			console.log(doc);
			res.redirect("/");
		}

	});
});

app.get("/saved", function(req, res) {
  Article.find({"saved": true}, function(error, doc) {
  	if(error) {
  		return console.log(error);
  	} else {
  		var hbsObject = {"saved": doc}
  		console.log(hbsObject);
  		res.render("saved", hbsObject);
  	}
  });
});



app.listen(3000, function() {
	console.log("App running on port 3000");
});