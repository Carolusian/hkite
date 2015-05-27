// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Require keystone
var keystone = require('keystone'),
	handlebars = require('express-handlebars');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({

	'name': 'hkite',
	'brand': 'hkite',
	
	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'hbs',
	
	'custom engine': handlebars.create({
		layoutsDir: 'templates/views/layouts',
		partialsDir: 'templates/views/partials',
		defaultLayout: 'default',
		helpers: new require('./templates/views/helpers')(),
		extname: '.hbs'
	}).engine,
	
	'emails': 'templates/emails',
	
	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
	'cookie secret': 'H?eL9>pkdR:(4HJ%dpSp;s8"{%XFab`Uy8E?rr<px#BhF4?A_,HL@9K~FZ|lRwoN'

});

// Load your project's Models

keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

keystone.set('locals', {
	_: require('underscore'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// Load your project's Routes

keystone.set('routes', require('./routes'));

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.

keystone.set('email locals', {
	logo_src: '/images/logo-email.gif',
	logo_width: 194,
	logo_height: 76,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de',
		buttons: {
			color: '#fff',
			background_color: '#2697de',
			border_color: '#1a7cb7'
		}
	}
});

// Setup replacement rules for emails, to automate the handling of differences
// between development a production.

// Be sure to update this rule to include your site's actual domain, and add
// other rules your email templates require.

keystone.set('email rules', [{
	find: '/images/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/images/' : 'http://localhost:3000/images/'
}, {
	find: '/keystone/',
	replace: (keystone.get('env') == 'production') ? 'http://www.your-server.com/keystone/' : 'http://localhost:3000/keystone/'
}]);

// Load your project's email test routes

keystone.set('email tests', require('./routes/emails'));

// Configure the navigation bar in Keystone's Admin UI

keystone.set('nav', {
	'posts': ['posts', 'post-categories'],
	'galleries': 'galleries',
	'enquiries': 'enquiries',
	'users': 'users'
});

// Start Keystone to connect to your database and initialise the web server

keystone.start();

// After web server started, we can do some cron jobs. 
// e.g. grab hkite posts from google spreadsheets.
console.log("after keystone started. \n");
var CronJob = require('cron').CronJob;
var articlePostsJob = new CronJob({
	cronTime: '00 40 1 * * *',
	onTick: pullArticlePosts, // Call this function to get all articles 
	start: false,
	timeZone: "Asia/Hong_Kong"
});

function pullArticlePosts() {

	var https = require('https');

	// This spreadsheet should content information for all articles
	var options = {
	  host: 'spreadsheets.google.com',
	  port: 443,
	  path: '/feeds/list/1We6YTBTZUMwxqRqWkRJs_lzmrzWhq5V_t93q7jw_dLw/od6/public/values?alt=json',
	  method: 'GET'
	};

	// Save articles from spreadsheets to Mongodb
	save = function(resptxt) {
		var posts = JSON.parse(resptxt);
		posts = posts['feed']['entry'];
		var Post = keystone.list('Post');

		posts.forEach(saveOne); // Call the functions to save all articles
	};

	// The function which really save article to db 
	saveOne = function(post) {
		var Post = keystone.list('Post');
		var query = Post.model.findOne({ spreadsheetId: post['gsx$articleid']['$t'] });
		
		query.exec().then(function(p){
			// If article post already exist, do nothing
			// Else, save to db
			if(p != null) {
				console.log(post['gsx$articletitle']['$t'] + ' existed already \n');
			} else {
				var newPost = new Post.model({
					title:  post['gsx$articletitle']['$t'],
					link: post['gsx$link']['$t'],
					linkTitle: post['gsx$linktitle']['$t'],
					content: post['gsx$linkdescription']['$t'].replace('\n', '<br>'),
					spreadsheetId: post['gsx$articleid']['$t']
				});
				newPost.save(function(err){
					console.log(err);
				});
			}
		}, function(err){
			console.log(err);   
		});
	};

	callback = function(response) {
	  var str = ''
	  response.on('data', function (chunk) {
		str += chunk;
	  });

	  response.on('end', function () {
		// If successfully get json data from spreadsheet,
		// Try to save data to mongo
		save(str);
	  });
	};

	var req = https.request(options, callback);
	req.end();
}

articlePostsJob.start();
