var
	_type = null,
	_vjs = null,
	_video = null;

function _playerGetName(){
	return 'hybrid';
};

function _playerGetMAC(){
	return CryptoJS.MD5(App.user.id + App.user.password + App.user.device.type + App.user.device.model, '5ad87aa3275ec183426d439f66398b94').toString();
}

function _playerPlay(){
	if (_vjs)
	{
		_vjs.play();
		_vjs.muted(false);
	}
	else
	{
		_video.play();
	}
};

function _playerPause(){
	_vjs ? _vjs.pause() : _video.pause();
};

function _playerResume(){
	_playerPlay();
};

function _playerStop(){
	if (_vjs) _vjs.reset();
};

function _playerGetPosition(){
	return _vjs ? _vjs.currentTime() : _video.currentTime;
};

function _playerGetDuration(){
	return _vjs ? _vjs.duration() : _video.duration;
};

function _playerSeek(seconds){
	_vjs ? _vjs.currentTime(seconds) : _video.currentTime = seconds;
};

function _playerAppsGet(){
	return [
		{appName: 'test', appImage: '', appIsSystemApp: false, appPackage: ''},
		{appName: 'test', appImage: '', appIsSystemApp: false, appPackage: ''},
		{appName: 'test', appImage: '', appIsSystemApp: false, appPackage: ''},
		{appName: 'test', appImage: '', appIsSystemApp: false, appPackage: ''},
		{appName: 'test', appImage: '', appIsSystemApp: false, appPackage: ''},
		{appName: 'test', appImage: '', appIsSystemApp: false, appPackage: ''},
		{appName: 'test', appImage: '', appIsSystemApp: false, appPackage: ''},
		{appName: 'test', appImage: '', appIsSystemApp: false, appPackage: ''}
	];
};

function _playerAppsOpen(){};

function _playerAppsInstall(){};

function _playerAppsDelete(){};

function _playerCaptionSet(id){
	var tracks = (_type === 'videojs') ? _vjs.textTracks() : _video.textTracks;

	for (var i = 0; i < tracks.length; i++)
	{
		if ((tracks[i].id === id) || (tracks[i].label === id) || (tracks[i].language === id))
		{
			tracks[i].enabled = true;
			tracks[i].mode = 'showing';
			store.set('iptv.track.text', tracks[i].id + ';' + tracks[i].language + ';' + tracks[i].label);
			lg('player tracks > caption track enabled [' + id + ']');
			return true;
		}
	}

	return false;
};

function _playerTrackSet(id){
	var tracks = (_type === 'videojs') ? _vjs.audioTracks() : _video.audioTracks;

	for (var i = 0; i < tracks.length; i++)
	{
		if ((tracks[i].id === id) || (tracks[i].label === id) || (tracks[i].language === id))
		{
			tracks[i].enabled = true;

			store.set('iptv.track.audio', tracks[i].id + ';' + tracks[i].language + ';' + tracks[i].label);

			lg('player tracks > audio track enabled [' + id + ']');
			return true;
		}
	}

	return false;
};
//add event listner for html of "on" for  videojs
function EListener (event, action){
		_vjs ? _vjs.on(event, action) : document.getElementById('player-666')._video.addEventListener(event, action)
	}


function _playerSetup(options){
	var
		_debug = App.player.debug,
		_tag = (App.page.name === 'Album') ? 'audio' : 'video',
		_mime = App.player.detectMime(options.url);

	App.progressSlider.setup();

	if (_debug)	lg('player > stream mime type [' + _mime + ']');
	if (_debug)	lg('player > stream _tag [' + _tag + ']');

	if (App.player.hasDRM && (App.user.device.name === 'ios'))
	{
		_type = 'native';
		$(options.container).html('<video src="' + options.url + '" id="player-666" class="html5video html5video_" preload="auto" playsinline autoplay muted></video>');
	}
	else
	{
		_type = 'videojs';

		if (_vjs)
		{
			lg('player > disposing instance');
			_vjs.dispose();
		}

		if ($('.video-js').length === 0)
		{
			$(options.container).html('<' + _tag + ' id="player-666" class="video-js vjs-default-skin vjs-16-9" preload="auto" playsinline autoplay muted></' + _tag + '>');
			_vjs = videojs('player-666', {
				poster: 'artwork/black-poster.jpg'
			});
		}

		_source = {
			src: options.url,
			type: _mime
		};

		if (App.player.hasDRM)
		{
			_vjs.eme();
			_source = {
				src: options.url,
				type: _mime,
				keySystems: {
					'com.widevine.alpha': {
						getLicense: function(emeOptions, keyMessage, callback){
							var message = new Uint8Array(keyMessage);

							videojs.xhr({
								uri: 'https://wv-keyos.licensekeyserver.com/',
								method: 'POST',
								responseType: 'arraybuffer',
								body: message,
								headers: {
									customdata: App.player.drm.key
								}
							}, function(err, response, responseBody){
								if (err) {
									callback(err);
									return;
								}
								callback(null, responseBody);
							});
						}
					}
				}
			};
		}

		_vjs.src(_source);
	}

	EListener('error', App.player.onError);
	EListener('ended', App.player.onComplete);
	EListener('play', function(){
		lg('player > event [play]');
		
	});
	EListener('pause', App.player.onPause);
	EListener('error', App.player.onError);
	
	if (App.player.isPrerollPlaying) {
		EListener('timeupdate', function(){
			var
				position = (App.page.name !== 'CatchUp') ? _playerGetPosition() : App.page.elapsed,
				duration = (App.page.name !== 'CatchUp') ? _playerGetDuration() : App.page.duration,
				o =	{
					position: position,
					duration: duration,
					percent: position * 100 / duration,
					remaining: duration - position
				};
			App.player.onTime(o);
		});
	}

/*

else {
_video = document.getElementById('player-666');
_video.addEventListener('error', App.player.onError);
_video.addEventListener('ended', App.player.onComplete);
_video.addEventListener('play', function(){
   lg('player > event [play]'); 
});
_video.addEventListener('pause', App.player.onPause);
_video.addEventListener('error', App.player.onError);
}
*/

if (!App.player.isLive)
{
	EListener('timeupdate', function(){
		var
			position = (App.page.name !== 'CatchUp') ? _playerGetPosition() : App.page.elapsed,
			duration = (App.page.name !== 'CatchUp') ? _playerGetDuration() : App.page.duration,
			o =	{
				position: position,
				duration: duration,
				percent: position * 100 / duration,
				remaining: duration - position
			};

		if (!App.progressSlider.drag) App.progressSlider.refresh.apply(App.progressSlider, [position * 100 / duration]);

		App.player.onTime(o);
	});
}

App.player.onReady();

_playerFitToScreen();
window.setTimeout(_playerFinishSetup, 2000);


_vjs ? _vjs.muted(false) : _video.muted = false

};

function _playerFinishSetup(){
	App.player.onPlay();
	App.player.step = Math.round(_playerGetDuration() / 20);

	var
		audio = {
			list: [],
			current: 0,
			tracks: (_type === 'videojs') ? _vjs.audioTracks() : _video.audioTracks
		},
		text = {
			list: [],
			current: 0,
			tracks: (_type === 'videojs') ? _vjs.textTracks() : _video.textTracks
		};

	if (audio.tracks && audio.tracks.length)
	{
		for (var i = 0; i < audio.tracks.length; i++)
		{
			if (audio.tracks[i].label && (audio.tracks[i].label !== 'default' ))
			{
				var trackText = audio.tracks[i].label.replace(/[0-9]/g, '').replace('# ', '');
				audio.list[audio.tracks[i].id] = App.codeToLanguage(trackText);

			}
			if (audio.tracks[i].enabled) audio.current = audio.tracks[i].id;

		}

		App.player.tracks.set(audio.list, audio.current, 'audio');
	}

	if (text.tracks && text.tracks.length)
	{
		for (var i = 0; i < text.tracks.length; i++)
		{
			if (text.tracks[i].label && (text.tracks[i].label !== 'segment-metadata'))
			{
				var trackText = text.tracks[i].label.replace(/[0-9]/g, '').replace('# ', '');
				text.list[text.tracks[i].id] = App.codeToLanguage(trackText);

			}
			if (text.tracks[i].enabled || (text.tracks[i].mode === 'showing')) text.current = text.tracks[i].id;

		}

		App.player.tracks.set(text.list, text.current, 'caption');
	}
};

function _playerGetVolume(){
	return 0;
};

function _playerStandBy(){};

function _playerSwitchURL(url){
	_vjs.src(url);
};

function _playerFitToScreen(){
	lg('player > fitting to screen');

	var
		d = getComputedStyle(document.getElementById('player-666')),
		screen = {
			width: window.innerWidth,
			height: window.innerHeight
		},
		video = {
			width: parseInt(d.width.replace('px', ''), 10),
			height: parseInt(d.height.replace('px', ''), 10)
		},
		padding = {};

	lg('player > original video size [' + video.width + ' x ' + video.height + ']; screen size [' + screen.width + ' x ' + screen.height + ']');

	padding = {
		horizontal: (screen.width - video.width) / 2,
		vertical: (screen.height - video.height) / 2
	};

	lg('player > centering video with padding [' + padding.horizontal + ' | ' + padding.vertical + ']');

	$('#player').css({
		'padding-top': padding.vertical,
		'padding-left': padding.horizontal,
		'width': screen.width - padding.width,
		'height': screen.height - padding.height
	});
};