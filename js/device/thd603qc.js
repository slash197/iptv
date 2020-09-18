function PLAYER_EventListener(event){
	lg('player > native event [' + event + ']');
};

function TRACK_EventListener(){};

function _playerGetName(){
	return 'TelergyHD';
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
	TelergyHD.StartPlayer(url);
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
	return TelergyHD.SeekPlayerInSeconds(seconds);
};

function _playerAppsGet(){
	return JSON.parse(TelergyHD.GetApps()).apps || [];
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

function _playerCaptionSet(){};

function _playerTrackSet(){};

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