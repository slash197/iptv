DuneHD.setColorKey(0x000011);

function _playerGetName(){
	return 'DuneHD';
};

function _playerGetMAC(){
	return DuneHD.getPrimaryMacAddress();
};

function _playerGetPosition(){
	return DuneHD.getPositionInSeconds();
};

function _playerGetDuration(){
	return DuneHD.getLengthInSeconds();
};

function _playerPlay(url){
	DuneHD.stop();
	DuneHD.play(url);
};

function _playerPause(){
	DuneHD.pause();
};

function _playerResume(){
	DuneHD.resume();
};

function _playerStop(){
	DuneHD.stop();
};

function _playerSeek(seconds){
	return DuneHD.setPositionInSeconds(seconds);
};

function _playerRecordingStart(name, url){
	DuneHD.StartRecordingUSB(name, url);
};

function _playerRecordingStop(){
	DuneHD.StopRecordingUSB();
};

function _playerRecordingGet(){
	return App.parse(DuneHD.GetRecordingsUSB()).recordings;
};

function _playerAppsGet(){};

function _playerAppsOpen(){};

function _playerAppsInstall(){};

function _playerAppsDelete(){};

function _playerGetMuteStatus(){
	return DuneHD.isMuteEnabled();
};

function _playerSetMute(state){
	if (state)
	{
		DuneHD.enableMute();
	}
	else
	{
		DuneHD.disableMute();
	}
};

function _playerGetVolume(){
	return DuneHD.getVolume()
};

function _playerSetVolume(level){
	DuneHD.setVolume(level); // 0..100
};

function _playerCaptionSet(){};

function _playerTrackSet(){};

function _playerStandBy(){};

GWareConfig.keyCodes = {
	  8: 'Back',
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

	 34: 'ChannelDown',
	 33: 'ChannelUp',
	199: 'Info',
	 12: 'Del',
	 18: 'Menu',

	193: 'Red',
	194: 'Green',
	195: 'Yellow',
	196: 'Blue',

	204: 'Rewind',
	205: 'Forward',
	178: 'Stop',
	 19: 'Play',
	 
	175: 'VolumeUp',
	174: 'VolumeDown',
	173: 'Mute',
	
	999: 'SleepWake'
};