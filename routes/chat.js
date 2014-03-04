exports.Controller = function(Room, User, Chat, io) {
	this.list = function(req, res, next) {
		Room.findOne({abbr: req.params.abbr}, function(e, room) {
			if (e || !room) {
				console.error("Error getting room's chat list", e, room);
				return res.jsonp([]);
			}
			Chat.find({room: room._id})
			.populate('author')
			.exec(function(e, a) {
				if (e) {
					console.error("Error getting chat list", e);
				}
				return res.jsonp(a);
			});
		});
	};

	this.say = function(req, res, next) {
		if (!req.body.content.length) {
			return res.jsonp({});
		}
		Room.findOne({abbr: req.params.abbr}, function(e, room) {
			if (e || !room) {
				console.error("Error saying something", e, room);
				return res.jsonp(500, {error: "Error sending message"});
			}
			var user = new User(req.session.user);
			var chat = new Chat({
				author: user,
				content: req.body.content,
				room: room,
				posted: Date.now()
			});
			chat.save(function(e) {
				if (e) {
					console.error("Error saving chat", e);
					return res.jsonp(500, {e: "Error saving chat"});
				}
				chat.populate('author room', function(e, chat) {
					io.sockets.in(req.params.abbr).emit('chat', chat);
					return res.jsonp(chat);
				});
			});
		});
	};
}
