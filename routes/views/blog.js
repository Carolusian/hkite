/*jshint es5: true */
var keystone = require('keystone'),
	async = require('async');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// Init locals
	locals.section = 'blog';
	locals.data = {
		posts: [],
	};
	
	// Load the posts
	view.on('init', function(next) {
		
		var q = keystone.list('Post').paginate({
				page: req.query.page || 1,
				perPage: 12,
				maxPages: 6 
			})
			.where('state', 'published')
			.sort('-publishedDate')
			.populate('author categories');
		
		if (locals.data.category) {
			q.where('categories').in([locals.data.category]);
		}
		
		q.exec(function(err, results) {
			locals.data.posts = results;
			next(err);
		});
		
	});
	
	// Render the view
	view.render('blog');
};
