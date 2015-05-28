var keystone = require('keystone');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'home';
	locals.data = {
		posts: []
	};

	// Load all posts
	view.on('init', function(next){
		var q = keystone.list('Post').model.find().sort('-spreadsheetId');

		q.exec(function(err, res) {
			res.forEach(function(post, i){
				// A stupid way to clone json object...
				post = JSON.parse(JSON.stringify(post));
				// The first one is odd, but 0 % 2 == 0
				i % 2 == 0? post.listColumn = "-odd": post.listColumn = "-even";
				locals.data.posts.push(post);
			});
			next(err);
		});

	});

	// Render the view
	view.render('index');
	
};
