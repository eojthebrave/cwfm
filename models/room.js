exports.build = function(mongoose, config, toJSON) {
	var name = 'Room';
	var schema = mongoose.Schema({
		name: {
			type: String,
			required: true
		},
		abbr: { 
			type: String, 
			required: true, 
			unique: true
		},
		description: String,
		dateCreated: Date,

		owners: [{ 
			type: mongoose.Schema.Types.ObjectId, 
			ref: 'User',
			unique: true
		}],
		djs: [{
			type: mongoose.Schema.Types.ObjectId, 
			ref: 'User',
			unique: true
		}],
		listeners: [{
			type: mongoose.Schema.Types.ObjectId, 
			ref: 'User',
			unique: true
		}],

		song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
		songStarted: Date
	});

	schema.methods.toJSON = function() {
		var obj = this.toObject();
		obj.currentTime = +new Date;
		obj.songStarted += 0;

		obj.owners    = toJSON(obj.owners);
		obj.djs       = toJSON(obj.djs);
		obj.listeners = toJSON(obj.listeners);
		obj.song      = toJSON(obj.song);

		return obj;
	};

	schema.virtual('dj').get(function() {
		return this.djs && this.djs.length > 0 ? this.djs[0] : null;
	});

	schema.methods.rotateDjs = function() {
		if (!this.djs || this.djs.length < 2) {
			return false;
		}
		var dj = this.djs.shift();
		this.djs.push(dj);
		return true;
	};

	schema.methods.indexOf = function(collection, model) {
		if (!this[collection]) return -1;

		var findId = model && model._id ? model._id : model;

		if (!findId) return -1;
		findId = findId.toString();

		for (var ix=0; ix<this[collection].length; ix++) {
			var item = this[collection][ix];
			if (!item) continue;
			var itemId = item._id ? item._id.toString() : item.toString();
			if (findId == itemId) {
				return ix;
			}
		}
		return -1;
	};

	schema.methods.join = function(collection, user) {
		var ix = this.indexOf(collection, user);
		var uid = user._id ? user._id : user;
		if (ix < 0) {
			if (!this[collection]) this[collection] = [];
			this[collection].push(uid);
		}
		return this;
	};

	schema.methods.leave = function(collection, user) {
		var ix = this.indexOf(collection, user);
		if (ix >= 0) {
			this[collection].splice(ix, 1);
			return 1;
		}
		return 0;
	};

	schema.methods.removeUser = function(user) {
		var cols = ['djs', 'listeners'];
		var room = this;
		var left = 0;
		cols.forEach(function(col) {
			left += room.leave(col, user);
		});
		return left;
	};

	return mongoose.model(name, schema);
}
