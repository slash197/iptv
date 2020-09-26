mediaLib.init();
mediaLib.initUsb();

browser.colorKey = "0x000011";
system.ntpserver = "nl.pool.ntp.org";
browser.showCursor = 0;
browser.acceptLanguage = "nl,nl-NL;q=0.7,en;q=0.3";

function _playerGetName(){
	return 'player';
};

function _playerGetMAC(){
	return network.mac;
};

function _playerGetPosition(){
	return window.player.getPosition() / 1000;
};

function _playerGetDuration(){
	return window.player.getPositionTotal() / 1000;
};

function _playerPlay(url){
	window.player.stop();
	window.player.play(url);
};

function _playerPause(){
	window.player.pause();
};

function _playerResume(){
	window.player.play();
};

function _playerStop(){
	window.player.stop();
};

function _playerSeek(seconds){
	window.player.seek(seconds);
};

function _playerRecordingStart(name){
	window.player.startDvrRecording(name);
};

function _playerRecordingStop(){
	window.player.stopDvrRecording();
};

function _playerRecordingGet(){
	var data = eval(window.player.getDvrRecordings());
	return data ? parseRecordingData(data) : [];
};

function _playerAppsGet(){};

function _playerAppsOpen(){};

function _playerAppsInstall(){};

function _playerAppsDelete(){};

function parseRecordingData(data){
	
	function parseTitle(str){
		var 
			arr = str.split('_'),
			out = [];
	
		for (var i = 0; i < arr.length - 1; i++)
		{
			out.push(arr[i]);
		}
		
		return out.join(' ');
	};
	
	function parseTS(str){
		var arr = str.split('_');
		return parseInt(arr[arr.length - 1].replace('.ts', ''), 10);
	};
	
	var out = [];
	
	for (var i = 0; i < data.length; i++)
	{
		var 
			ts = parseTS(data[i].name),
			start = new Date(ts),
			end = new Date(ts + parseInt(data[i].length))
		
		out.push({
			start: start.niceTime(),
			end: end.niceTime(),
			title: parseTitle(data[i].name),
			image: data[i].image_url,
			url: data[i].stream_url
		});
	}
	
	return out;
};

function _playerGetVolume(){};

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

	309: 'ChannelDown',
	308: 'ChannelUp',
	 46: 'Del',
	304: 'EPG',
	 36: 'Menu',

	155: 'Red',
	403: 'Green',
	404: 'Yellow',
	458: 'Blue',

	412: 'Rewind',
	417: 'Forward',
	413: 'Stop',
	415: 'Play',
	
	999: 'SleepWake'
};