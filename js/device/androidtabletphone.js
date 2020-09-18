function _playerGetAPKVersion(){
	try {
		return TelergyHD.GetApkVersion();
	}
	catch (e){
		return false;
	}
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
	 
	 96: '0',
	 97: '1',
	 98: '2',
	 99: '3',
	100: '4',
	101: '5',
	102: '6',
	103: '7',
	104: '8',
	105: '9',

	 46: 'Del',
	
	999: 'PowerWake'
};