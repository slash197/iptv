/* 
 * © 2017 - 2018 GWare Solutions IPTV UI
 * author SWD
 */

var GWareLogs = [];

function lg(object, level){
	
	var 
		e = document.getElementById('log'),
		version = '';

	function log2screen(o){
		e.style.display = 'block';
		e.innerHTML += JSON.stringify(o) + '<br/ >';
		e.scrollTop = e.scrollHeight;
	};

	function log2console(o){
		if (console)
		{
			switch (level)
			{
				case 'log':
				case 'info': console.log(o); break;
				case 'error': console.error(o); break;
				case 'warn': console.warn(o); break;
			}
		}
	};

	function log2server(o){
		if (!App) return false;
		
		var 
			id = (App && App.user && App.user.id) ? App.user.id : '0',
			type = (App && App.user && App.user.device && App.user.device.type) ? App.user.device.stb + ' [' + App.user.device.type + ']' : 'n/a';

		// if (typeof $ !== 'undefined')
		// {
		// 	xhr({
		// 		url: GWareConfig.baseURL.debug,
		// 		type: 'post',
		// 		dataType: 'json',
		// 		data: {
		// 			action: 'set',
		// 			message: JSON.stringify(o),
		// 			ts: new Date().getTime(),
		// 			level: level,
		// 			user_id: id,
		// 			device: type
		// 		}
		// 	});
		// }
	};

	function log2cloud(o){
		if (!App) return false;
		
		var 
			date = new Date(),
			ts = date.getTime(),
			str = date.toString(),
			q = {
				settings: $.extend({client: 'n/a', cms: 'n/a', crm: 'n/a'}, App.settings),
				user: $.extend({UUID: 'n/a', id: 'n/a', password: 'n/a', device: {type: 'n/a'}}, App.user)
			};
		
		GWareLogs.push({
			date: ts,
			date_str: str,
			message: JSON.stringify(o),
			level: level,
			client: q.settings.client,
			cms: q.settings.cms,
			crm: q.settings.crm,
			uuid: q.user.UUID,
			user_id: q.user.id,
			user_password: q.user.password,
			device_type: q.user.device.type
		});
		
		if (((GWareLogs.length >= 20) || (level === 'error')) && (typeof xhr === 'function'))
		{
			var temp = GWareLogs.slice();
			GWareLogs.length = 0;
			
			xhr({
				url: GWareConfig.baseURL.logs,
				type: 'post',
				dataType: 'json',
				data: {
					logs: temp
				},
				error: function(){}
			});
		}
	};
	
	if (typeof App !== 'undefined') version = ' v' + App.version.major + '.' + App.version.minor + '.' + App.version.revision;

	if (!level) level = 'info';
	if (typeof object === 'string') object = '[Login' + version + '] ' + object;

	if (typeof GWareConfig !== 'undefined')
	{
		if (GWareConfig.debug.screen)  log2screen(object);
		if (GWareConfig.debug.console) log2console(object);
		//if (GWareConfig.debug.server)  log2server(object);
		if (GWareConfig.debug.cloud)   log2cloud(object);
		
		return false;
	}
};

window.onerror = function(msg, source, line, col){
	lg(msg + ' in ' + source + ' on line ' + line + ':' + col, 'error');	
	
	return true;
};

if (!window.localStorage)
{
	var Storage = function(){
		
		this.setItem = function(key, value){
			if (typeof gSTB !== 'undefined') gSTB.SaveUserData(key, value);
			if (DuneHD) DuneHD.setUserSetting(key, value);
		};
		
		this.getItem = function(key){
			var object = null;

			if (typeof gSTB !== 'undefined') object = gSTB.LoadUserData(key);
			if (DuneHD) object = DuneHD.getUserSetting(key);
			
			return object;
		};
		
		this.removeItem = function(key){
			if (typeof gSTB !== 'undefined') gSTB.SaveUserData(key, '');
			if (DuneHD) DuneHD.setUserSetting(key, '');
		};
		
	};
	
	var store = new Storage();
}
else
{
	var store = window.localStorage;
}

Storage.prototype.set = function(key, obj){
	var t = typeof obj;
	if (t === 'undefined' || obj === null ) this.removeItem(key);
	this.setItem(key, (t === 'object') ? JSON.stringify(obj) : obj);
};

Storage.prototype.get = function(key) {
    var obj = this.getItem(key);
    try {
		var j = JSON.parse(obj);
		if (j && typeof j === "object") return j;
    }
	catch (e){}
    return obj;
};

Storage.prototype.del = function(key){
	this.removeItem(key);
};

Storage.prototype.has = this.hasOwnProperty;

Storage.prototype.remove = this.removeItem;

Storage.prototype.keys = function(){
  return Object.keys(this.valueOf());
};

String.prototype.toPath = function(){
	return this.split('').join('/');
};

String.prototype.decodeHTML = function(){
	var e = document.createElement('div');
	e.innerHTML = this;
	
	return e.childNodes.length ? e.childNodes[0].nodeValue : '';
};

Array.prototype.hasValue = function($v){
	for (var $i = 0; $i < this.length; $i++)
	{
		if (this[$i] === $v) return true;
	}
	return false;
};

Date.prototype.toString = function(time){
	var
		date = (this.getDate() < 10) ? '0' + this.getDate() : this.getDate(),
		month = (this.getMonth() + 1 < 10) ? '0' + (this.getMonth() + 1) : (this.getMonth() + 1),
		hours = (this.getHours() < 10) ? '0' + this.getHours() : this.getHours(),
		minutes = (this.getMinutes() < 10) ? '0' + this.getMinutes() : this.getMinutes(),
		seconds = (this.getSeconds() < 10) ? '0' + this.getSeconds() : this.getSeconds();

	return (time) ? this.getFullYear() + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds : this.getFullYear() + '-' + month + '-' + date;
};

Function.prototype.bind = Function.prototype.bind||function(b){if(typeof this!=="function"){throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");}var a=Array.prototype.slice,f=a.call(arguments,1),e=this,c=function(){},d=function(){return e.apply(this instanceof c?this:b||window,f.concat(a.call(arguments)));};c.prototype=this.prototype;d.prototype=new c();return d;};

Math.distance = function(x1, y1, x2, y2){
	return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
};

function loadScript(source, callback){
	var script = document.createElement('script');
	
	script.src = source + '?v=' + new Date().getTime();
	if (typeof callback === 'function') script.onload = callback;
	
	document.getElementsByTagName('body')[0].appendChild(script);
};

function loadStyle(source){
	var style = document.createElement('link');
	
	style.href = source + '?v=' + new Date().getTime();
	style.rel = 'stylesheet';
	style.type = 'text/css';
	
	document.getElementsByTagName('head')[0].appendChild(style);
};

function xhr(options){
	jQuery.support.cors = true;
	
	options.clearURL = options.url;
	if (App && options.encrypt) options.url = App.encrypt(options.url, options.encryptToken);
	
	delete options.encrypt;
	delete options.encryptToken;

	$.ajax(
		$.extend({
			url: '',
			data: {},
			type: 'get',
			crossDomain: true,
			dataType: 'json',
			cache: false,
			beforeSend: function(xhr, settings){
				xhr.url = settings.url;
			},
			success: function(){},
			error: function(xhr, error, message){
				lg('request URL           = ' + xhr.url, 'error');
				lg('request URL decrypted = ' + options.clearURL, 'error');
				lg('request error         = ' + error, 'error');
				lg('request error message = ' + message, 'error');
			},
			complete: function(){}
		}, options)
	);
};

var 
	DuneHD = document.getElementById('DuneHD'),
	THD504 = document.getElementById('THD504');

if (typeof DuneHD.init === 'function') DuneHD.init(); else DuneHD = undefined;
if (typeof THD504.getFirGWareVersion !== 'function') THD504 = undefined;

loadStyle('css/app.css');
loadStyle('css/auth.css');
loadScript('js/GWare.config.js', function(){
	loadScript('js/GWare.helper.js', function(){
		loadScript('js/GWare.core.js');
	});
});