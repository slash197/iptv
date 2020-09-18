var
	_isMuted = false,
	standBy = 0;

function onPlayStateChange(state){
	/*
	var states = {
		0: 'STOP',
		1: 'PAUSE',
		2: 'PLAY',
		3: 'BUFFERING',
		4: 'FORWARD',
		5: 'REWIND',
		6: 'NEXT',
		7: 'PREV',
		8: 'END'
	};
	
	lg('player > native event [' + (states[state] ? states[state] : state) + ']');
	
    switch (state)
	{
		// media ended
        case 8: App.player.onComplete(); break;
		
		// play
        case 2: App.player.onPlay(); break;
			
		// stop
		case 0: App.player.onStop(); break;
    }
	*/
};

function _playerGetName(){
	return 'THD504';
};

function _playerGetMAC(){
	return THD504.getMacAddress();
};

function _playerGetPosition(){
	return THD504.CurrentPosition;
};

function _playerGetDuration(){
	return THD504.Duration;
};

function _playerPlay(url){
	THD504.data = url;
	THD504.Stop();
	THD504.Play();
};

function _playerPause(){
	THD504.Pause();
};

function _playerResume(){
	THD504.Play();
};

function _playerStop(){
	THD504.Stop();
};

function _playerSeek(seconds){
	THD504.CurrentPosition = seconds;
};

function _playerAppsGet(){};

function _playerAppsOpen(){};

function _playerAppsInstall(){};

function _playerAppsDelete(){};

function _playerGetMuteStatus(){
	return _isMuted;
};

function _playerSetMute(state, volume){
	if (state)
	{
		THD504.setVolume(0);
		_isMuted = true;
	}
	else
	{
		THD504.setVolume(volume)
		_isMuted = false;
	}
};

function _playerGetVolume(){
	return 50;
};

function _playerSetVolume(level){
	THD504.setVolume(level); // 0..100
};

function _playerCaptionSet(){};

function _playerTrackSet(){};

function _playerStandBy(){
	standBy = (standBy === 2) ? 0 : 2;
	THD504.setPower(standBy);
};

GWareConfig.keyCodes = {
	 27: 'Back',
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
	 46: 'Del',
	115: 'EPG',
	 36: 'Menu',

	120: 'Red',
	121: 'Green',
	122: 'Yellow',
	123: 'Blue',

	116: 'Rewind',
	117: 'Forward',
	119: 'Stop',
	118: 'Play',
	
	113: 'VolumeUp',
	112: 'VolumeDown',
	114: 'Mute',
	
	145: 'SleepWake'
};