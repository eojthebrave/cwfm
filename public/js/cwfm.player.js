if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.player = {};

cwfm.player.ctrl = function($scope, $http, $socket, $room, $user, $timeout) {
	$scope.room      = {};
	$scope.me        = {};
	$scope.remaining = 0;

	// Wrapper for calling jPlayer functions
	$scope.player = function() {
		$.fn.jPlayer.apply( $('#jplayer'), arguments );
	}

	$scope.player({canplay: $scope.playSong});

	$room.change(function(room) {
		$scope.room = room;
		$scope.playSong();
	});

	$user.change(function(user) {
		$scope.me = user;
	});

	var oops = function(e) {
		console.error(e);
	};

	var addMe = function() {
		$scope.room.djs.push($scope.me);
	};

	var removeMe = function() {
		$scope.room.djs.some(function(dj, ix) {
			if (dj.username == $scope.me.username) {
				$scope.room.djs = $scope.room.djs.splice(ix, 1);
				return true;
			}
			return false;
		});
	};

	$socket.on('song.stopped', function(room) {
		$scope.room.song = null;
		$scope.room.songStarted = null;
		$scope.stopSong();
	});

	$socket.on('song.changed', function(song) {
		$scope.room.song = song;
		if (!$scope.muted) {
			console.info("Playing song", song);
			$scope.playSong();
		}
		else {
			console.info("Muted on song", song);
			$scope.player('clearMedia');
		}
	});

	$scope.djing = function(who) {
		if (!$scope.room || !$scope.room.djs) return false;
		if (!who) who = $scope.me;
		var un = who && who.username ? who.username : who;
		return $scope.room.djs.some(function(dj) {
			return dj.username == un;
		});
	};

	$scope.stopSong = function( ) {
		$scope.player( 'stop' );
	};

	$scope.playSong = function(song) {
		song = song ? song : $scope.room.song;
		if (!song) return;
		var type = song.type ? song.type : 'mp3';
		var data = {};
		data[type] = '/song/' + song._id;
		var start = $scope.songPlayed();
		console.info("Requesting", data, "Starting at", start);
		$scope.player('setMedia', data);
		$scope.player('play', start);
	};

	$scope.songPlayed  =  function() {
		var song  =  $scope.room.song;
		if ( ! song || ! song.duration ) return 0;
		var now   =  Date.now() / 1000.0;
		var start = $scope.songStartTime();
		return now - start;
	};

	$scope.songStartTime = function() {
		if (!$scope.room.songStarted) return 0;
		return Date.parse($scope.room.songStarted) / 1000.0;
	};

	$scope.songRemaining  =  function() {
		var song  =  $scope.room.song;
		if ( ! song || ! song.duration ) return 0;
		var now   = Date.now() / 1000.0;
		var start = $scope.songStartTime();
		var end   = start + song.duration;
		var diff = end - now;
		if (diff < 0) return 0;
		return diff;
	};

	$scope.tick = function() {
		$scope.remaining = $scope.songRemaining();
		$timeout($scope.tick, 500);
	};

	$scope.toggleMuting  =  function( ) {
		if ( $scope.muted ) {
			$scope.stopSong( );
		}
		else {
			$scope.playSong();
		}
	};

	$scope.not  =  function( func ) {
		return function( item ) {
			return ! func( item );
		};
	};

	$scope.dj = function() {
		$http.post('/room/dj/' + $scope.room.abbr, {})
			.success(addMe);
	};

	$scope.undj = function() {
		$http.post('/room/undj/' + $scope.room.abbr, {})
			.success(removeMe);
	};

	$scope.skipSong = function() {
		$http.post('/room/skip/' + $scope.room.abbr, {});
	};

	$scope.tick();
};
