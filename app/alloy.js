// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};

/*
 * verifica dei prerequisiti
 * */
if (Ti.Network.online === false || Ti.Geolocation.locationServicesEnabled === false) {
	var dialog = Ti.UI.createAlertDialog({
		cancel : 1,
		buttonNames : [L('msg_prompt_settings'), L('msg_prompt_cancel')],
		message : L('msg_prompt_noprereq_message'),
		title : L('msg_prompt_noprereq_title')
	});
	dialog.addEventListener('click', function(e) {
		if (e.cancel === e.index || e.cancel === true) {
			return;
		}

		//redirigiamo alla pagina delle configurazioni del telefono
		if (Ti.Platform.name === "android") {
			var settingsIntent = Titanium.Android.createIntent({
				action : 'android.settings.LOCATION_SOURCE_SETTINGS'
			});
			Ti.Android.currentActivity.startActivity(settingsIntent);
		} else {
			Ti.Platform.openURL('prefs:root=General');
		}
	});
	dialog.show();
}

//variabili nelle quali salveremo lng/lat del punto GPS
Alloy.Globals.positionlatitude = 0;
Alloy.Globals.positionlongitude = 0;

/*
 * inizializzazione sistema di localizzazione
 * */
if (Ti.Platform.name === "android")
	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
else if (Ti.Platform.name === "iPhone OS") {
	Ti.Geolocation.distanceFilter = 10;
	Ti.Geolocation.preferredProvider = "gps";
	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_NEAREST_TEN_METERS;
	Ti.Geolocation.purpose = L('msg_prompt_iosgpspurpose');
}

/*
 * visualizza un messaggio a video (notifica)
 * */
Alloy.Globals.notify = function(text) {
	if (Ti.Platform.name === "android") {
		Ti.UI.createNotification({
			message : text,
			duration : Ti.UI.NOTIFICATION_DURATION_LONG
		}).show();
	} else {
		//forse qui conviene fare:
		var a = Titanium.UI.createAlertDialog({
			title : 'Attenzione!',
			message : text
		});
		a.show();
		setTimeout(function() {
			a.hide();
		}, 2000);
	}
};

/*
 * normalizza i messaggi html
 * */
Alloy.Globals.normalizeHtmlMessage = function(text) {
	text = text.replace(/&egrave;/g, 'è');
	text = text.replace(/&ugrave;/g, 'ù');
	text = text.replace(/&agrave;/g, 'à');
	return text;
};

/*
 * calcola la distanza "in km" tra due coordinate GPS
 * */
Alloy.Globals.calcDistance = function(lat1, lng1, lat2, lng2) {
	// lat, lng: phone location
	// latp, lngp: point of interest location
	// approx. dist in meters, nothern hemisphere
	// http://www.movable-type.co.uk/scripts/latlong.html
	var dist = 0;
	if (lat1 === 0 && lng1 === 0)
		return dist;

	dist = Math.sqrt(Math.pow((111.3 * (lat1 - lat2)), 2) + Math.pow((71.5 * (lng1 - lng2)), 2)) * 1000;
	return dist;
};

/*
 * converte la distanza in stringa con dicitura in base al numero (km, metri)
 * */
Alloy.Globals.formatDistanceToLabel = function(dist) {
	var ret = '';

	if (Ti.Geolocation.locationServicesEnabled === false || dist === 0) {
		// se siamo qui non possiamo ritornare il dato della distanza
		ret = L('label_marker_cspark_nodistance');
		ret = '';
		return ret;
	}

	dist = Math.floor(dist);
	if (dist >= 1000)
		ret = '' + Math.floor(dist / 1000) + ' ' + L('label_marker_cspark_distance_km');
	else
		ret = '' + dist + ' ' + L('label_marker_cspark_distance_meters');

	ret = String.format(L('label_marker_cspark_distance'), ret);
	return ret;
};

Alloy.Globals.exitApp = function(win) {
};

/*
 * le seguenti funzioni sono solo per ANDROID
 * */
if (Ti.Platform.name == "android") {
	/*
	 * gestisce l'uscita dall'applicazione chiedendo conferma all'utente
	 * */
	var dialog = Ti.UI.createAlertDialog({
		cancel : 1,
		buttonNames : [L('msg_prompt_ok'), L('msg_prompt_ko')],
		message : L('msg_prompt_exitapp_message'),
		title : L('msg_prompt_exitapp_title')
	});
	dialog.addEventListener('click', function(e) {
		if (e.cancel === e.index || e.cancel === true) {
			return;
		}
		var activity = Titanium.Android.currentActivity;
		activity.finish();
	});
	Alloy.Globals.exitApp = function(win) {
		win.addEventListener('android:back', function(e) {
			dialog.show();
		});
	};
};

//************** TEST SESSION *****************
if (!ENV_PRODUCTION) {
	var behave = require('behave');

	//require your created specs
	require('spec/ui');

	//run:tests
	behave.run();
}
//*************** FINE TEST SESSION ****************
