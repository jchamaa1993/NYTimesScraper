var mongoose = require("mongoose");
// create Schema class
var Schema = mongoose.Schema;
// make our article schema.
var ArticleSchema = new Schema({
	title: {
		type: String,
		required: true
	},
	link: {
		type: String,
		required: true
	},
	saved: {
		type: Boolean,
		required: true,
		default: false
	},
	// need multiple comments so 
	Notes: [{
		type: Schema.Types.ObjectId,
		ref: "Note"
	}]
});

// Create the Article model with the ArticleSchema
var Article = mongoose.model("Article", ArticleSchema);

// Export the model
module.exports = Article;