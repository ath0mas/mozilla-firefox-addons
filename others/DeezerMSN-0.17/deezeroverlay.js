/* coding: utf-8 */
// Deezer MSN 
// Bandikaz


var DeezerMSN = (function(){
	// Now dump() is inside my namespace
	function dump(msg) {
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage(msg);
	}

	try {

	var dbg = false;
	
	var last = null;
	
	var locales = document.getElementById("bundle_deezermsn");
	
	var objComp = function(obj1, obj2) {
		if (!obj1 && !obj2) {
			return true;
		}
		if (!obj1 || !obj2) {
			return false;
		}
		for (var p1 in obj1) {
			if (obj1[p1] !== obj2[p1]) {
				return false;
			}
		}
		for (var p2 in obj2) {
			if (obj1[p2] !== obj2[p2]) {
				return false;
			}
		}
		return true;
	}
	var cleanStr = function(s) {
		return s.replace(/\{/g,'[').replace(/\}/,']').replace(/\\0/g,'');
	}
	var sendToMsn = function(args) {
		// on n'envoie pas sur msn...
		
		if(!objComp(args,last)) {
			var file = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager).getInstallLocation('deezermsn@akryus.net').getItemLocation('deezermsn@akryus.net'); 
			file.append('msnwial2.exe');
			var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
			process.init(file);
			process.run(false, args, args.length);
			last = args;
		}
		// mais dans un fichier...
		/*
		var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                         .createInstance(Components.interfaces.nsIFileOutputStream);
		var file = Components.classes['@mozilla.org/file/directory_service;1'].createInstance(Components.interfaces.nsIProperties).get('AppData', Components.interfaces.nsIFile);
		file.append('Mozilla');
		file.append('Firefox');
		file.append('deezermsn.txt');
		var data = args[2];
		foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
		foStream.write(data, data.length);
		foStream.close();
*/
		
	}
	
	var Preference = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.deezermsn.");
	
	var message = [];
	
	var wmessage = null; 
	
	var song = {};
	
	function update(a) {
		if(wmessage == a) {
			if(Preference.getBoolPref('enabled'))
			{
				sendToMsn(message);
			} else {
				hide();
			}
		}
	}
	
	function hide() {
		sendToMsn([]);
	}

	var formatString = function(template,variables) {
		
		var mySandbox = new Components.utils.Sandbox(window);
		mySandbox.XMLHttpRequest = XMLHttpRequest;
		mySandbox.alert = function() { return alert.apply(null,arguments); };
		mySandbox.confirm = function() { return confirm.apply(null,arguments); };
		mySandbox.prompt = function() { return prompt.apply(null,arguments); };
		for(var k in variables) mySandbox[k] = variables[k].replace(/[\n\r]+/g,'');
		var asarray = [];
		var decay = 0;
		template = template.replace(/\{script\}([\x00-\xff]*(?!\{\/?script\})?)\{\/script\}|\{((?!\/?script\})[\/0-9a-z_\.]+)\}|\\\\/gi,function(str,script,property,where) {
			var output = '';
			if(str == '\\\\') {
				output = '\\';
			}
			else {
				var count = 0;
				for(var i = where-1; i >= 0 ; i--,count++) {
					if(template.charAt(i) != '\\') break;
				}
				if(count % 2 == 1) {
					asarray.push(where+decay-1);
					output = str; 
				} else {
					if(str.indexOf('{script}') == 0 && str.indexOf('{/script}') == str.length-9) {
						try {
							var ret = Components.utils.evalInSandbox(script,mySandbox);
						} catch(e) {
							dump(locales.getString("userscriptError")+ '\n'+e);
						}
					} else if(typeof mySandbox[property] == 'string'){
						output = mySandbox[property];
					}
				}
			}
			decay += output.length-str.length;
			return output;
		});
		if(asarray.length>0) {
			var output = '';
			var last = -1;
			for(var i = 0, j = asarray.length; i < j ; i++) {
				output+=template.substring(last+1,asarray[i]);
				last = asarray[i];
			}
			output += template.substring(last+1,template.length);
			template = output;
		} 
		return template.replace(/[\n\r]+/g,'');
	}
	// ------------
// bizarrement, avant c'était nécessaire de faire un utf8 decode, mais plus maintenant....  
// Utf8.decode() ===> http://www.webtoolkit.info/

/*	var Utf8 = {
	    decode : function (utftext) {
	   
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
		while ( i < utftext.length ) {
		    c = utftext.charCodeAt(i);
		    if (c < 128) {
			string += String.fromCharCode(c);
			i++;
		    }
		    else if((c > 191) && (c < 224)) {
			c2 = utftext.charCodeAt(i+1);
			string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
			i += 2;
		    }
		    else {
			c2 = utftext.charCodeAt(i+1);
			c3 = utftext.charCodeAt(i+2);
			string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
			i += 3;
		    }
		}
		return string;
	    }
	}
*/



// Snifff tout mon code pour écouter les requètes :'(
// Sert plus à rien avec Deezer v3...

	// ------------
	/*
	var deezerobserver = { observe : function(httpChannel, osef1, osef2) {
		try {
			httpChannel.QueryInterface(Components.interfaces.nsIHttpChannel);
			if(httpChannel.URI.asciiSpec.indexOf('http://www.deezer.com/services/remoting/gateway.php') != 0) 
				return true;
			httpChannel.notificationCallbacks.getInterface(Components.interfaces.nsIWebProgress);
			// fenêtre initiatrice de la requête = page de deezer (contenant le swf, donc)
			var win = httpChannel.notificationCallbacks.DOMWindow; 
			// on vérifie qu'on est bien sur le site Deezer 
			// sinon n'importe quel site peut modifier le pseudo en générant une "fausse" requête sur deezer
			if(win.location.hostname != 'www.deezer.com') return true; 
			httpChannel.QueryInterface(Components.interfaces.nsIUploadChannel);
			httpChannel.uploadStream.QueryInterface(Components.interfaces.nsISeekableStream);
			httpChannel.uploadStream.seek(0,0);
			var stream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
			stream.init(httpChannel.uploadStream);
			// output contiendra le contenu des données POST
			var output = '';
			var size = stream.available();
			for (var i=0; i<size; i++) {
				output+=stream.read(1);
			}
			httpChannel.uploadStream.seek(0,0);
			// close() sur les deux streams sinon plantage firefox...
			stream.close();
			httpChannel.uploadStream.close();

			// expression régulière pour extraire le nom du titre et l'artiste
			var tab = (/^[\x00-\xff]*interfaces\.dzGetTrackKey[\x00-\xff]*(?:\u0020[a-f0-9]{32}|[0-9]+_[a-zA-Z0-9]+\.mp3)\x02[\u0000-\uffff](.*?)(?:\x06)?\x02[\u0000-\uffff]([0-9]+?)(?:\x06)?\x02[\u0000-\uffff](.*?)(?:\x06)?\x02[\u0000-\uffff](.*?)(?:\x06)?\x02[\x00-\xff]*$/).exec(output);
			// on élimine les requêtes qui ne renseignent pas sur le titre en cours de lecture
			if(tab == null) {
				return true;
			}
			var isUploadedSong = (/^[\x00-\xff]*interfaces\.dzGetTrackKey[\x00-\xff]*(?:[0-9]+_[a-zA-Z0-9]+\.mp3)\x02/).exec(output);
			if(isUploadedSong) {
				var songobj = {
					artist : ((tab[4] && tab[4]!='null')?tab[4]:''), 
					album : ((tab[3] && tab[3]!='null')?tab[3]:''), 
					title : ((tab[1] && tab[1]!='null')?tab[1]:''), 
					id : '', 
					url : ''
				};
			} else {
				var songobj = {
					artist : ((tab[4] && tab[4]!='null')?tab[4]:''), 
					album : ((tab[3] && tab[3]!='null')?tab[3]:''), 
					title : ((tab[1] && tab[1]!='null')?tab[1]:''), 
					id : ((tab[2] && tab[2]!='0')?tab[2]:''), 
					url : ((tab[2] && tab[2]!='0')?('http://www.deezer.com/track/'+tab[2]):'')
				};
			}
			if(!objComp(song,songobj)) {
				var msg = formatString(Preference.getCharPref('format'),songobj);
				message = [cleanStr(Utf8.decode(songobj.artist)),cleanStr(Utf8.decode(songobj.title)),cleanStr(Utf8.decode(msg)),Utf8.decode('{2}')];
				wmessage = win.document;
				song = songobj;
			}
			update(wmessage);
			// si on quitte Deezer, la lecture s'arrête nécessairement, donc on efface le titre :)
			win.addEventListener("unload", function(){
				//song = {}; message = ''; update();
				hide();
			}, false); 
		} catch(e) {
			if(dbg) dump('DeezerMSN : '+e);
			// en cas d'exception, il faut fermer les flux, sinon plantage... 
			if(typeof stream != 'undefined' && stream) stream.close();
			if(typeof httpChannel != 'undefined' && typeof httpChannel.uploadStream != 'undefined' && httpChannel.uploadStream) httpChannel.uploadStream.close();
			return true; 
		}
		
	} };
	*/
	
	function checkdoc(doc) {
			try {
				if(!doc 
				|| doc.nodeName != "#document" 
				|| !doc.location 
				|| typeof doc.location.hostname != 'string' 
				)
					throw null; 
			} catch(e) { 
				if(dbg) dump('DeezerMSN : ' + e);
				return false; 
			} 
			if(!doc.getElementById('header')) return false;
			return true;
	}
	
	var unloadDeezerPage = function(event) {
		var doc = event.originalTarget;
		if(doc == wmessage) {
			wmessage = null;
			song = {};
			hide();
		}
	
	}
	
	var songChangeListener = function(doc) {

		if(checkdoc(doc)) {
		
			setTimeout(songChangeListener,500,doc);
			try {
				// on lit les variables de la page dans une sandbox pour plus de sécurité (sinon un getter pourrait être activé avec les privilèges)
				var dzobj = Components.utils.Sandbox(doc.defaultView);
				dzobj.getDoc = function() { return doc.wrappedJSObject; };
				var script = " var dzobj = getDoc().defaultView.deezerAudioJSPlayer;var playing = dzobj.playing;"
				+"var paused = dzobj.paused; var artistName = dzobj.artistName; var albumTitle = dzobj.albumTitle;"
				+"var songTitle = dzobj.songTitle; if(typeof artistName != 'string' || typeof albumTitle != 'string' "
				+"|| typeof songTitle != 'string' || typeof paused != 'boolean' || typeof playing != 'boolean') { "
				+"alert(typeof albumTitle); artistName = albumTitle = songTitle = ''; paused = true; playing = false; }";
				
				Components.utils.evalInSandbox(script,dzobj);
				
				if(!dzobj.artistName || !dzobj.playing || dzobj.paused) {
					
					if(doc == wmessage) {
						wmessage = null;
						song = {};
						hide();
					}
				
				} else {
					var songobj = {
						artist : dzobj.artistName, 
						album : dzobj.albumTitle, 
						title :dzobj.songTitle, 
						id : '', 
						url :''
					};
				
					if(!objComp(song,songobj)) {
						var msg = formatString(Preference.getCharPref('format'),songobj);
						// plus besoin de utf8 decode
						//message = [cleanStr(Utf8.decode(songobj.artist)),cleanStr(Utf8.decode(songobj.title)),cleanStr(Utf8.decode(msg)),Utf8.decode('{2}')];
						//message = [cleanStr(songobj.artist),cleanStr(songobj.title),cleanStr(msg),'{2}'];
						message = [' ',cleanStr(msg),' ','{0}'];
						
						wmessage = doc;
						song = songobj;
					}
					update(wmessage);
				}
			
			} catch(e) {
				 if(dbg) dump('DeezerMSN : '+e);
				return false;
			}
	
		} else {
			if(doc == wmessage) {
				hide();
			}
		}
	}

	
	var pageListener = function(aEvent) {
		try {
			var doc = aEvent.originalTarget;
			if(doc.nodeName != "#document") return true;
			if(doc.location.hostname != 'www.deezer.com') return true;
			
			var home = doc.getElementById('header_links');
			if(!home) return true;
		
			var msg = doc.getElementById('deezermsn_msg');
			if(!msg) {

				var span = doc.createElement('div');
				span.setAttribute('id','deezermsn_msg');
				span.setAttribute('class','main');
				
				home.appendChild(span);
				var link = doc.createElement('a');
				link.setAttribute('href','javascript:void(0);');
				//link.setAttribute('style','color: rgb(204, 204, 204);');
				link.setAttribute('class','bgrepeat');
				
				if(Preference.getBoolPref("enabled")) {
					var text = doc.createTextNode(locales.getString("deezermsnEnabled"));
				} else {
					var text = doc.createTextNode(locales.getString("deezermsnDisabled"));
				}
				link.appendChild(text);
				span.appendChild(link);
				home.appendChild(span);
				link.addEventListener('click', function(aEvent) {
					link.removeChild(link.firstChild);
					if(Preference.getBoolPref("enabled")) {
						Preference.setBoolPref("enabled",false);
						var text = doc.createTextNode(locales.getString("deezermsnDisabled"));
					}
					else {
						Preference.setBoolPref("enabled",true);
						var text = doc.createTextNode(locales.getString("deezermsnEnabled"));
					}
					link.appendChild(text);
					update(doc);
					
				},false);
				/*var mouselistener = function(aEvent) {
					update(doc);
				}
				doc.addEventListener('mouseover', mouselistener,false);*/
				var prefChangeListener = function() {
				
					if(checkdoc(doc)) {
					
						setTimeout(prefChangeListener, 800);
				
						link.removeChild(link.firstChild);
						if(Preference.getBoolPref("enabled")) {
							var text = doc.createTextNode(locales.getString("deezermsnEnabled"));
						}
						else {
							var text = doc.createTextNode(locales.getString("deezermsnDisabled"));
						}
						link.appendChild(text);
						update(doc);
					}
				}
				songChangeListener(doc);
				prefChangeListener();
				
			}
			doc.defaultView.addEventListener('unload', unloadDeezerPage,false);
			
		} catch(e) { if(dbg) dump('DeezerMSN : '+e); }
	};
	
	/*Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService).addObserver(deezerobserver, "http-on-examine-response", false);
	
	window.addEventListener("unload", function() {
		// si on ferme la fenêtre de firefox, on retire l'écouteur de requête
		Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService).removeObserver(deezerobserver, "http-on-examine-response");
	},false);
	*/
	
	
	window.addEventListener("DOMContentLoaded", function() {
	
		document.getElementById("appcontent").addEventListener("DOMContentLoaded", pageListener,false);

	},false);
	
	} catch(e) {
		if(dbg) dump('DeezerMSN : '+e);
	}
});
document.addEventListener('DOMContentLoaded',DeezerMSN,false);



