/*
 * © 2017 - 2018 GWare Solutions IPTV UI
 * author SWD
 */

var GWareLogs = [];

function lg(object, level){
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
				case 'trace': console.log('%c' + o, 'color: #2f68b4'); break;
				case 'error': console.error(o); break;
				case 'warn': console.warn(o); break;
				case 'log':
				case 'info':
				default: console.log(o); break;
			}
		}
	};

	// function log2server(o){
	// 	var
	// 		id = (App && App.user && App.user.id) ? App.user.id : '0',
	// 		type = (App && App.user && App.user.device && App.user.device.type) ? App.user.device.stb + ' [' + App.user.device.type + ']' : 'n/a';

	// 	if (typeof xhr === 'function')
	// 	{
	// 		xhr({
	// 			url: GWareConfig.baseURL.debug,
	// 			type: 'post',
	// 			dataType: 'json',
	// 			data: {
	// 				action: 'set',
	// 				message: JSON.stringify(o),
	// 				ts: new Date().getTime(),
	// 				level: level,
	// 				user_id: id,
	// 				device: type
	// 			},
	// 			error: function(){}
	// 		});
	// 	}
	// };

	function log2cloud(o){
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
				url: GWareConfig.baseURL.nodeBQ + 'logs',
				type: 'post',
				dataType: 'json',
				data: {
					logs: temp
				},
				error: function(){}
			});
		}
	};

	function log2api(o){
		var
			ts = new Date().getTime(),
			message = ['object', 'array'].hasValue(typeof o) ? JSON.stringify(o) : o;

		App.log.cache.push([ts, level, message].join(GWareConfig.debug.api.delimiter.data));
	};

	if (typeof GWareConfig === 'undefined' || typeof App === 'undefined')
	{
		log2console(object);
		return false;
	}
	
	var
		e = document.getElementById('log'),
		ts = '[' + new Date().toString(true) + '] ',
		ui = (App && App.settings && App.settings.ui && App.settings.ui.name) ? App.settings.ui.name.ucFirst() + ' ' : '';
	//	version = (App && App.version.major) ? 'v' + App.version.major + '.' + App.version.minor + '.' + App.version.revision : '';

	if (!level) level = 'info';
	if (typeof object === 'string') object =  ts + object;

	//if (GWareConfig.debug.screen)		log2screen(object);
	if (GWareConfig.debug.console)		log2console(object);
	//if (GWareConfig.debug.server)		log2server(object);
	if (GWareConfig.debug.api.enabled)	log2api(object);
	if (GWareConfig.debug.cloud)		log2cloud(object);
};

window.onerror = function(msg, source, line, col, error){
	lg(msg + ' in ' + source + ' on line ' + line, 'error');
	if (error) lg(error, 'error');
};

function loadScript(source, callback){
	var 
		tsNow = ((typeof GWareConfig !== 'undefined') && (GWareConfig.mode !== 'dev')) ? '1' : new Date().getTime(),
		script = document.createElement('script');

	script.src = source + '?v=' + tsNow;
	script.async = false;
	script.defer = false;
	script.onerror = function(){
		lg('loading > error loading file [' + source + ']', 'error');
	};
	
	if (typeof callback === 'function') script.onload = callback;

	document.getElementsByTagName('body')[0].appendChild(script);
};

function loadStyle(source, callback){
	var 
		tsNow = (typeof GWareConfig === 'undefined') ? '' : (GWareConfig.mode !== 'dev') ? '' : new Date().getTime(),
		style = document.createElement('link');

	style.href = source + '?v=' + tsNow;
	style.rel = 'stylesheet';
	style.type = 'text/css';
	style.onerror = function(){
		lg('loading > error loading file [' + source + ']', 'error');
		if (typeof callback === 'function') callback();
	};

	document.getElementsByTagName('head')[0].appendChild(style);
};

var
	DuneHD = document.getElementById('DuneHD'),
	THD504 = document.getElementById('THD504');

if (typeof DuneHD.init === 'function') DuneHD.init(); else DuneHD = undefined;
if (typeof THD504.getFirGWareVersion !== 'function') THD504 = undefined;

loadScript('js/GWare.config.js', function(){
	loadScript('js/GWare.core.js');
});