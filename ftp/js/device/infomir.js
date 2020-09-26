gSTB.ExecAction("tvsystem 1080i-50");
gSTB.ExecAction("graphicres 1280");

window.moveTo(0, 0);
window.resizeTo(1280, 720);

gSTB.InitPlayer();
gSTB.SetMode(1);
gSTB.SetWinMode(1, 1);
gSTB.SetChromaKey(0x000011, 0x000011);
gSTB.SetTransparentColor(0x000011);

var standBy = false;

function _playerGetName(){
	return 'gSTB';
};

function _playerGetMAC(){
	return gSTB.GetDeviceMacAddress();
};

function _playerGetPosition(){
	return gSTB.GetPosTimeEx();
};

function _playerGetDuration(){
	return gSTB.GetMediaLenEx();
};

function _playerPlay(url){
	gSTB.Stop();
	gSTB.Play(url);
};

function _playerPause(){
	gSTB.Pause();
};

function _playerResume(){
	gSTB.Continue();
};

function _playerStop(){
	gSTB.Stop();
};

function _playerSeek(seconds){
	gSTB.SetPosTime(seconds);
};

function _playerRecordingStart(){};

function _playerRecordingStop(){};

function _playerRecordingGet(){};

function _playerAppsGet(){};

function _playerAppsOpen(){};

function _playerAppsInstall(){};

function _playerAppsDelete(){};

function _playerGetMuteStatus(){
	return gSTB.GetMute();
};

function _playerSetMute(state){
	gSTB.SetMute(state ? 1 : 0);
};

function _playerGetVolume(){
	return gSTB.GetVolume();
};

function _playerSetVolume(level){
	gSTB.SetVolume(level); // 0..100
};

function _playerCaptionSet(){};

function _playerTrackSet(){};

function _playerStandBy(){
	standBy = !standBy;
	gSTB.StandBy(standBy);
};

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

	 33: 'ChannelDown',
	 34: 'ChannelUp',
	 89: 'Info',
	116: 'Del',
	119: 'EPG',
	122: 'Menu',

	112: 'Red',
	113: 'Green',
	114: 'Yellow',
	115: 'Blue',

	 66: 'Rewind',
	 70: 'Forward',
	 83: 'Stop',
	 82: 'Play',
	 
	107: 'VolumeUp',
	109: 'VolumeDown',
	192: 'Mute',
	
	 85: 'SleepWake'
};