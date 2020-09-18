var 
	GWarePlayerAudioTracks = [],
	GWarePlayerCaptions = [];

function PLAYER_EventListener(status){
	lg('player > native event [' + status + ']');
	switch (status)
	{
		case 'PLAYER_STATUS_IDLE':
			break;
			
		case 'PLAYER_STATUS_BUFFERING':
			break;
			
		case 'PLAYER_STATUS_PLAYING':
			break;
			
		case 'PLAYER_STATUS_PAUSED':
			break;
			
		case 'PLAYER_STATUS_STOPPED':
			break;
			
		case 'PLAYER_STATUS_ENDED':
			break;
			
		case 'PLAYER_FORMAT_NOTSUPPORT':
		case 'PLAYER_SOURCE_NOTSUPPORT':
		case 'PLAYER_UNKNOWN_ERROR':
			App.player.onError({'message': status});
			break;
	}
};

function TRACK_AudioListener(data){
	GWarePlayerAudioTracks = JSON.parse(data);
	var list = [];
	
	for (var i = 0; i < GWarePlayerAudioTracks.length; i++)
	{
		var label = '';
		
		if (GWarePlayerAudioTracks[i].name)
		{
			label = (GWarePlayerAudioTracks[i].name.length > 3) ? GWarePlayerAudioTracks[i].name : App.codeToLanguage(GWarePlayerAudioTracks[i].name);
		}
		else
		{
			label = _('Default audio track');
		}
		
		if (!list.hasValue(label)) list[i] = label;
	}
	
	App.player.tracks.set(list, 0, 'audio');
};

function TRACK_SubtitleListener(data){
	GWarePlayerCaptions = JSON.parse(data);
	var list = [];
	
	for (var i = 0; i < GWarePlayerCaptions.length; i++)
	{
		var label = '';
		
		if (GWarePlayerCaptions[i].name)
		{
			label = (GWarePlayerCaptions[i].name.length > 3) ? GWarePlayerCaptions[i].name : App.codeToLanguage(GWarePlayerCaptions[i].name);
		}
		else
		{
			label = _('No subtitle');
		}
		
		if (!list.hasValue(label)) list[i] = label;
	}
	
	App.player.tracks.set(list, -1, 'caption');
};

function _playerGetName(){
	return 'TelergyHD [709]';
};

function _playerGetMAC(){
	return TelergyHD.GetMacAddress();
};

function _playerGetAPKVersion(){
	try {
		lg('fetching apk version');
		var v = TelergyHD.GetApkVersion();
		
		return v.replace('APK Version: ', '');
	}
	catch (e){
		lg('faield fetching apk version');
		return false;
	}
};

function _playerSetAspectRatio(type){
	TelergyHD.SetAspectRatio(type);
};

function _playerGetPosition(){
	return TelergyHD.GetPlayerPositionInSeconds();
};

function _playerGetDuration(){
	return TelergyHD.GetPlayerLengthInSeconds();
};

function _playerPlay(url){
	TelergyHD.StopPlayer();
	
	if (App.player.drm.enabled)
	{
		TelergyHD.StartSecurePlayer(url, App.Channel.channel.id, App.settings.cms, App.settings.client);
	}
	else
	{
		TelergyHD.StartPlayer(url);
	}
};

function _playerPause(){
	TelergyHD.PausePlayer();
};

function _playerResume(){
	TelergyHD.ResumePlayer();
};

function _playerStop(){
	TelergyHD.StopPlayer();
};

function _playerSeek(seconds){
	TelergyHD.SeekPlayerInSeconds(seconds);
};

function _playerAppsGet(){
	var response = null;
	
	try {
		response = JSON.parse(TelergyHD.GetApps());
		
		return response.apps;
	}
	catch (e){
		lg('player > unable to get apps from device (Uncaught Error: Java exception was raised during method invocation)', 'error');
		
		return [];
	}
};

function _playerAppsOpen(package){
	return TelergyHD.StartApp(package);
};

function _playerAppsInstall(package, url){
	return TelergyHD.InstallApp(package, url);
};

function _playerAppsDelete(package){
	return TelergyHD.DeleteApp(package);
};

function _playerGetVolume(){};

function _playerCaptionSet(id){
	for (var i = 0; i < GWarePlayerCaptions.length; i++)
	{
		if ((i === id) || (GWarePlayerCaptions[i].name === id) || (App.codeToLanguage(GWarePlayerCaptions[i].name) === id))
		{
			var caption = GWarePlayerCaptions[i];
			
			TelergyHD.SetPlayerSubtitle(caption.track_index, caption.render_index, caption.group_index);
			
			store.set('iptv.track.text', caption.name + ';' + App.codeToLanguage(caption.name));
			
			lg('player tracks > caption track enabled [' + id + ']');
			return true;
		}
	}
	
	return false;
};

function _playerTrackSet(id){
	for (var i = 0; i < GWarePlayerAudioTracks.length; i++)
	{
		if ((i === id) || (GWarePlayerAudioTracks[i].name === id) || (App.codeToLanguage(GWarePlayerAudioTracks[i].name) === id))
		{
			var track = GWarePlayerAudioTracks[i];
			
			TelergyHD.SetPlayerAudio(track.track_index, track.render_index, track.group_index);

			store.set('iptv.track.audio', track.name + ';' + App.codeToLanguage(track.name));
			
			lg('player tracks > audio track enabled [' + id + ']');
			return true;
		}
	}
	
	return false;
};

function _playerStandBy(){};
 GWareConfig.keyCodes = {
	  4: 'Back',
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

	222: 'ChannelDown',
	223: 'ChannelUp',
	220: 'Info',
	246: 'Del',
	221: 'EPG',
	 82: 'Menu',

	183: 'Red',
	184: 'Green',
	185: 'Yellow',
	186: 'Blue',

	168: 'Rewind',
	169: 'Forward',
	247: 'Stop',
	248: 'Play',
	
	999: 'SleepWake'
};

/*GWareConfig.keyCodes = {
	  4: 'Back',
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

	  8: 'Del',
	 82: 'Menu',

	183: 'Red',
	184: 'Green',
	289: 'Green',
	185: 'Yellow',
	290: 'Yellow',
	186: 'Blue',
	
	999: 'SleepWake'
};*/