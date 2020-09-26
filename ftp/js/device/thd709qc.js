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
	GWarePlayerAudioTracks = App.parse(data);
	var list = [];
	
	for (var i = 0; i < GWarePlayerAudioTracks.length; i++)
	{
		list.push(GWarePlayerAudioTracks[i].name ? App.codeToLanguage(GWarePlayerAudioTracks[i].name) : _('Default audio track'));
	}
	
	App.player.tracks.set(list, 0, 'audio');
};

function TRACK_SubtitleListener(data){
	GWarePlayerCaptions = App.parse(data);
	var list = [];
	
	for (var i = 0; i < GWarePlayerCaptions.length; i++)
	{
		list.push(GWarePlayerCaptions[i].name ? App.codeToLanguage(GWarePlayerCaptions[i].name) : _('No subtitles'));
	}
	
	App.player.tracks.set(list, -1, 'caption');
};

function _playerGetName(){
	return 'TelergyHD [709]';
};

function _playerGetMAC(){
	return TelergyHD.GetMacAddress();
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

function _playerRecordingStart(name, url){
	TelergyHD.StartRecordingUSB(name, url);
};

function _playerRecordingStop(){
	TelergyHD.StopRecordingUSB();
};

function _playerRecordingGet(){
	return App.parse(TelergyHD.GetRecordingsUSB()).recordings;
};

function _playerRecordingDelete(name){
	TelergyHD.DeleteRecordingUSB(name);
};

function _playerAppsGet(){
	var response = null;
	
	try {
		response = App.parse(TelergyHD.GetApps());
		
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

function _playerDiskSpace(){
	return {
		free: TelergyHD.GetFreeDiskSpace(),
		total: TelergyHD.GetTotalDiskSpace()
	};
};

function _playerGetVolume(){};

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

	  8: 'Del',
	 82: 'Menu',

	183: 'Red',
	184: 'Green',
	185: 'Yellow',
	186: 'Blue',
	
	999: 'SleepWake'
};