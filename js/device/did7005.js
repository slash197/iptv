var 
	stream = null,
	recURL = null,
	_isMuted = false,
	standBy = 0,
	GWarePlayerAudioTracks = [],
	GWarePlayerCaptions = [];
	
Platform.Playback.onPlayStateChanged.connect(function(stream, state, data){
	switch (state)
	{
		case 0:
			if (data === true)
			{
				// completed
				App.player.onComplete();
			}
			break;
	}
});

function _playerGetName(){
	return 'EKT';
};

function _playerGetMAC(){
	var 
		interfaceId = Platform.Network.getActiveInterfaceSync(),
		interface = Platform.Network.getInterfaceInfoSync(interfaceId);
	
	return interface.mac;
};

function _playerGetPosition(){
	if (stream) return Platform.Playback.getPositionSync(stream);
	return -1;
};

function _playerGetDuration(){
	if (stream) return Platform.Playback.getDurationSync(stream);
	return -1;
};

function _playerPlay(url){
	if (App.player.hasDRM)
	{
		_playerPlayDRM(url);
		return false;
	}
	
	Platform.Playback.createStream(url).then(function(result){
		stream = result;
		Platform.Playback.play(stream);
		
		Platform.Playback.getAudioTracksInfo(stream).then(function(result){
			lg('player > audio tracks');
			lg(result);
		});
	});
};

function _playerPlayDRM(url){
	Platform.Playback.createStream(url).then(function(result){
		stream = result;
		
		lg('player > setting up drm');
		Platform.Playback.IP.setDrmVendor(stream, Platform.Playback.IP.DrmVendor.WIDEVINE);
		Platform.Playback.IP.setDrmServer(stream, 'https://wv-keyos.licensekeyserver.com/');
		Platform.Playback.IP.setDrmCustomData(stream, App.player.drm.key);
		
		Platform.Playback.play(stream);
		
		Platform.Playback.getAudioTracksInfo(stream).then(function(result){
			lg('player > audio tracks');
			lg(result);
		});
	});
};

function _playerPause(){
	if (stream) Platform.Playback.pause(stream);
};

function _playerResume(){
	if (stream) Platform.Playback.play(stream);
};

function _playerStop(){
	if (stream) Platform.Playback.stop(stream);
};

function _playerSeek(seconds){
	if (stream) Platform.Playback.setPosition(stream, seconds);
};

function __playerStripToken(url){
	var pos = url.indexOf('token=');
	
	if (pos > -1) return url.substr(0, pos - 1);
	
	return url;
};

function _playerAppsGet(){};

function _playerAppsOpen(){};

function _playerAppsInstall(){};

function _playerAppsDelete(){};

function _playerGetMuteStatus(){
	if (stream) return Platform.Playback.getMuteSync(stream);
};

function _playerSetMute(state){
	if (stream) Platform.Playback.setMuteSync(stream, state);
};

function _playerGetVolume(){
	if (stream) return Platform.Playback.getVolumeSync(stream);
	return 50;
};

function _playerSetVolume(level){
	lg(level);
	if (stream) Platform.Playback.setVolumeSync(stream, level);
};

function _playerGetTrackByIndex(index, type){
	return (type === 'audio') ? GWarePlayerAudioTracks[index] : GWarePlayerCaptions[index];
};

function _playerCaptionSet(id){
	var caption = _playerGetTrackByIndex(id, 'caption');
	TelergyHD.SetPlayerSubtitle(caption.track_index, caption.render_index, caption.group_index);
};

function _playerTrackSet(id){
	var track = _playerGetTrackByIndex(id, 'audio');
	TelergyHD.SetPlayerAudio(track.track_index, track.render_index, track.group_index);
};

function _playerStandBy(){
	standBy = !standBy ? 2 : 0;
	Platform.System.setStandbyMode(standBy);
};

GWareConfig.keyCodes = {
	116: 'Back',
	 13: 'OK',

	 37: 'Left',
	 38: 'Up',
	 39: 'Right',
	 40: 'Down',

	 48: '0',
	 49: '1',
	 50: '2',
	 51: '3',
	 52: '4',
	 53: '5',
	 54: '6',
	 55: '7',
	 56: '8',
	 57: '9',

	427: 'ChannelDown',
	428: 'ChannelUp',
	457: 'Info',
	458: 'EPG',
	514: 'Del',
	462: 'Menu',

	403: 'Red',
	404: 'Green',
	405: 'Yellow',
	406: 'Blue',

	412: 'Rewind',
	417: 'Forward',
	247: 'Stop',
	415: 'Play',
	 
	447: 'VolumeUp',
	448: 'VolumeDown',
	449: 'Mute',
	
	409: 'SleepWake'
};