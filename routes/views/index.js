var keystone = require('keystone'), 
	Meetup = keystone.list('Meetup');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'home';
	locals.data = {
		meetups: []
	};

	// Load the first Next Meetup
	view.on('init', function(next){
		Meetup.model.findOne()
			.where('state', 'active')
			.sort('startDate')
			.exec(function(err, nextMeetup){
				locals.nextMeetup = nextMeetup;
				next();
			});
	});

	// Load the past first Meetup
	view.on('init', function(next){
		Meetup.model.findOne()
			.where('state', 'past')
			.sort('-startDate')
			.exec(function(err, pastMeetup){
				locals.pastMeetup = pastMeetup;
				next(); 
			});
	});

	// Load all Meetups 
	view.on('init', function(next){
		var pagesize = 10;
		var page = req.query.page || 1;
		console.log(page);
		var q = keystone.list('Meetup').model.find().sort('-startDate')
						.skip( (page-1) * pagesize).limit(pagesize);

		q.exec(function(err, res){
			res.forEach(function(meetup, i){
				// The first one is odd, but 0 % 2 == 0
				i % 2 == 0? meetup.listColumn = "-odd": meetup.listColumn = "-even";
				locals.data.meetups.push(meetup);
			});
			next(err);
		});

	});

	// Decide which meetup to render on jumbotron
	view.on('render', function(next){
		locals.meetup = locals.nextMeetup || locals.pastMeetup;
		next();
	});

	// Render json or view (depend whether the request is ajax request)
	if(req.xhr || req.headers.accept.indexOf('json') > -1) {
		view.render(function(err) {
			if(err) return res.apiError('error', err);
			res.apiResponse({
				test: 'hello'
			});
		});
	} else {
		view.render('index');
	}

	
};
