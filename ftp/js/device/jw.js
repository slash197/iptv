function _playerGetName(){
	return 'JW Player';
};

function _playerGetMAC(){
	return CryptoJS.MD5(App.user.id + App.user.password + App.url.device.object.type + App.url.device.object.model, '5ad87aa3275ec183426d439f66398b94').toString();
};