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
		var q = keystone.list('Meetup').model.find().sort('-startDate');

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

	// Render the view
	view.render('index');
	
};
