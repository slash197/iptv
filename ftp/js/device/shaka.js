var 
	_shaka = null,
	_video = null;

function _playerGetName(){
	return 'Shaka';
};

function _playerGetMAC(){
	return CryptoJS.MD5(App.user.id + App.user.password + App.user.device.type + App.user.device.model + App.user.device.key, '5ad87aa3275ec183426d439f66398b94').toString();
}

function _playerPlay(url){
	_video.play();
};

function _playerPause(){
	_video.pause();
};

function _playerResume(){
	_video.play();
};

function _playerStop(){
	if (_video && (typeof _video.stop === 'function')) _video.stop();
};

function _playerStripToken(url){
	var pos = url.indexOf('token=');
	
	if (pos > -1) return url.substr(0, pos - 1);
	
	return url;
};

function _playerGetPosition(){
	return _video.currentTime();
};

function _playerGetDuration(){
	return _video.duration();
};

function _playerSeek(seconds){
	_video.currentTime(seconds);
};

function _playerRecordingGet(){
	return [
		{"rec_name":"No-information-available-1504862648899","rec_date":"08-09-2017","rec_image":"/storage/external_storage/sda1/No-information-available-1504862648899_1504862648976_rec/No-information-available-1504862648899_1504862648976.png","rec_url":"/storage/external_storage/sda1/No-information-available-1504862648899_1504862648976_rec/No-information-available-1504862648899_1504862648976.m3u8"},
		{"rec_name":"No-information-available-1504862648899","rec_date":"08-09-2017","rec_image":"/storage/external_storage/sda1/No-information-available-1504862648899_1504862648976_rec/No-information-available-1504862648899_1504862648976.png","rec_url":"/storage/external_storage/sda1/No-information-available-1504862648899_1504862648976_rec/No-information-available-1504862648899_1504862648976.m3u8"},
		{"rec_name":"No-information-available-1504862648899","rec_date":"08-09-2017","rec_image":"/storage/external_storage/sda1/No-information-available-1504862648899_1504862648976_rec/No-information-available-1504862648899_1504862648976.png","rec_url":"/storage/external_storage/sda1/No-information-available-1504862648899_1504862648976_rec/No-information-available-1504862648899_1504862648976.m3u8"},
		{"rec_name":"NPO-1-1504859943680","rec_date":"08-09-2017","rec_image":"/storage/external_storage/sda1/NPO-1-1504859943680_1504859943710_rec/NPO-1-1504859943680_1504859943710.png","rec_url":"/storage/external_storage/sda1/NPO-1-1504859943680_1504859943710_rec/NPO-1-1504859943680_1504859943710.m3u8"},
		{"rec_name":"NPO-1-1504864492704","rec_date":"08-09-2017","rec_image":"/storage/external_storage/sda1/NPO-1-1504864492704_1504864492744_rec/NPO-1-1504864492704_1504864492744.png","rec_url":"/storage/external_storage/sda1/NPO-1-1504864492704_1504864492744_rec/NPO-1-1504864492704_1504864492744.m3u8"},
		{"rec_name":"NPO-1","rec_date":"08-09-2017","rec_image":"/storage/external_storage/sda1/NPO-1_1504864246297_rec/NPO-1_1504864246297.png","rec_url":"/storage/external_storage/sda1/NPO-1_1504864246297_rec/NPO-1_1504864246297.m3u8"}
	];
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
		{appName: 'test', appImage: '', appIsSystemApp: false, appPackage: ''},
	];
};

function _playerAppsOpen(){};

function _playerAppsInstall(){};

function _playerAppsDelete(){};

function _playerDiskSpace(){
	return {
		free: '4,200MB',
		total: '9,600MB'
	};
};

function _playerCaptionSet(id){
	var tracks = _video.textTracks();
	tracks[id].enabled = true;
};

function _playerTrackSet(id){
	var tracks = _video.audioTracks();
	tracks[id].enabled = true;
};

function _playerSetup(options){
	var
		_id = 'player-' + App.random(111, 999),
		_debug = App.player.debug;

	if (_debug) lg('player > setting up shaka');	
		
	App.progressSlider.setup();
	
	$(options.container).html('<video id="' + _id + '" />')
	

	_video.addEventListener('ended', function(){
		if (_debug) lg('player > event [ended]');

		App.player.onComplete();
	});
	
	_video.addEventListener('play', function(){
		if (_debug) lg('player > event [play]');

		window.setTimeout(function(){
			$('.player-holder').css('background-color', 'transparent');
			if (_debug) lg('player > clearing overlay');

			App.player.onPlay();
			
			App.player.step = Math.round(_video.duration() / 20);
	
			var 
				audio = {
					list: [],
					current: 0,
					tracks: _video.audioTracks()
				},
				text = {
					list: [],
					current: 0,
					tracks: _video.textTracks()
				};

			for (var i = 0; i < audio.tracks.length; i++)
			{
				audio.list.push(audio.tracks[i].label);
				if (audio.tracks[i].enabled) audio.current = i;
			}

			App.player.tracks.set(audio.list, audio.current, 'audio');

			for (var i = 0; i < text.tracks.length; i++)
			{
				text.list.push(text.tracks[i].label);
				if (text.tracks[i].enabled) text.current = i;
			}

			App.player.tracks.set(text.list, text.current, 'caption');
		}, 2000);
	});
	
	_video.addEventListener('timeupdate', function(){
		var
			position = this.currentTime(),
			duration = this.duration(),
			o =	{
				position: position,
				duration: duration,
				percent: position * 100 / duration,
				remaining: duration - position
			};
		
		App.player.onTime(o);
		
		if (!App.progressSlider.drag)
		{
			App.progressSlider.refresh.apply(App.progressSlider, [position * 100 / duration]);
		}
	});
	
	_shaka = new shaka.Player(_video);
	_shaka.addEventListener('error', App.player.onError);

	if (App.player.drm.enabled)
	{
		_video.src({
			src: options.url,
            type: "application/x-mpegurl",
			keySystemOptions: [
				{
					name: 'com.widevine.alpha',
					options: {
						serverURL: 'https://wv-keyos.licensekeyserver.com/',
						httpRequestHeaders: {
							customdata: App.player.drm.key
						}
					}
				}
			]
		});
	}
	else
	{
	}
};

function _playerGetVolume(){
	return _video ? _video.volume : 0;
};

function _playerStandBy(){};

shaka.polyfill.installAll();

if (!shaka.Player.isBrowserSupported())
{
	lg('player > browser not supported', 'error');
}
else
{
	lg('player > browser is supported');
}