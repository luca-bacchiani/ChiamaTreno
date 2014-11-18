// Luca 13/11/2014
// creo e invio la richiesta di visualizzare una posizione su un mappa

var latitude;
var longitude;

function showLocation(e) {
	if (!OS_ANDROID) {
		alert('funzione disponibile solo per Android');
		return;
	}
	if (!this.hasOwnProperty('lat') || !this.hasOwnProperty('lng')) {
		alert('coordinate assenti');
		return;
	};
	if (isNaN(parseFloat(this.lat)) || isNaN(parseFloat(this.lng))) {
		alert('coordinate non valide');
		return;
	};
    var intent = Titanium.Android.createServiceIntent({
        action : Ti.Android.ACTION_VIEW,
        data : 'geo:' + this.lat + ',' + this.lng
    });
    intent.addCategory(Ti.Android.CATEGORY_DEFAULT);
    Ti.Android.currentActivity.startActivity(intent);
};
var requestMap = function() {
	if (isNaN(latitude) || isNaN(longitude)) {
		alert('coordinate non valide');
		return;
	};
	var intent = Titanium.Android.createServiceIntent({
        action : Ti.Android.ACTION_VIEW,
        data : 'geo:' + latitude + ',' + longitude
    });
    intent.addCategory(Ti.Android.CATEGORY_DEFAULT);
    Ti.Android.currentActivity.startActivity(intent);
};
$.stazionitab.addEventListener('focus', function(e) {
	if ($.viewelencostazioni.visible)
		$.richiedimappa.hide();
});
$.preftab.addEventListener('focus', function(e) {
	if ($.viewelencostazionipref.visible)
		$.richiedimappapref.hide();
});

var selectedStazione;

var createStazioniRow = function(item) {

	//se si tratta di IOS in questo caso dobbiamo
	//creare una tabella leggermente diversa
	if (OS_IOS)
		return createStazioniRowIOS(item);

	var tablerow = Ti.UI.createTableViewRow({
		rightImage : '/images/tableview/view.png',
		leftImage : '/images/tableview/station.png',
		data : item,
		valueToFilter : item.text
	});

	var v = Ti.UI.createView({
		layout : 'vertical',
		touchEnabled : false
	});
	v.add(Ti.UI.createLabel({
		text : item.text,
		touchEnabled : false,
		color : '#000',
		textAlign : 'left',
		left : 0,
		font : {
			fontWeight : 'bold',
			fontSize : '16sp'
		}
	}));
	v.add(Ti.UI.createLabel({
		text : (item.subtext === '' ? 'Nessun indirizzo disponibile' : item.subtext),
		touchEnabled : false,
		textAlign : 'left',
		left : 0,
		color : '#969191',
		font : {
			fontSize : '12sp'
		}
	}));

	tablerow.add(v);

	return tablerow;
};

var createStazioniRowIOS = function(item) {
	var tablerow = Ti.UI.createTableViewRow({
		rightImage : '/images/tableview/view.png',
		data : item,
		valueToFilter : item.text,
		layout : 'vertical'
	});

	var v = Ti.UI.createView({
		layout : 'horizontal',
		touchEnabled : false,
		height : Ti.UI.SIZE
	});
	var im = Ti.UI.createImageView({
		image : '/images/tableview/station.png',
		left : 0,
		touchEnabled : false
	});
	v.add(im);

	var v1 = Ti.UI.createView({
		layout : 'vertical',
		touchEnabled : false,
		left : 5,
		height : Ti.UI.SIZE
	});
	v1.add(Ti.UI.createLabel({
		text : item.text,
		touchEnabled : false,
		color : '#000',
		textAlign : 'left',
		left : 0,
		font : {
			fontWeight : 'bold',
			fontSize : '16sp'
		}
	}));
	v1.add(Ti.UI.createLabel({
		text : (item.subtext === '' ? 'Nessun indirizzo disponibile' : item.subtext),
		touchEnabled : false,
		textAlign : 'left',
		left : 0,
		color : '#969191',
		font : {
			fontSize : '12sp'
		}
	}));
	v.add(v1);

	tablerow.add(v);

	return tablerow;
};

var createTreniRow = function(item) {
	var tablerow = Ti.UI.createTableViewRow({
		layout : 'vertical',
		data : item,
		selectedBackgroundColor : 'transparent'
	});

	tablerow.add(Ti.UI.createLabel({
		text : 'Destinazione: ' + item.stazione,
		touchEnabled : false,
		left : 5,
		color : '#000',
		font : {
			fontWeight : 'bold',
			fontSize : '16sp'
		}
	}));

	var v = Ti.UI.createView({
		layout : 'horizontal',
		touchEnabled : false,
		left : 5,
		height : Ti.UI.SIZE
	});
	var im = Ti.UI.createImageView({
		image : '/images/tableview/train.png',
		left : 0,
		touchEnabled : false
	});
	v.add(im);
	v.add(Ti.UI.createLabel({
		text : 'Treno: ' + item.treno + '\r\nPartenza: ' + item.arrivoprevisto + '\r\n' + item.ritardo,
		touchEnabled : false,
		left : 5,
		color : '#969191',
		font : {
			fontSize : '12sp'
		}
	}));

	tablerow.add(v);

	return tablerow;
};

/*
 * visualizza su mappa il bounding-box (region) contenente la posizione corrente
 * */
var locationHandler = function(e) {
	
	$.richiedimappavicina.hide(); // Luca 14//11/2014
	
	if (e.success && e.coords != null) {
		//salviamo le informazioni di lng/lat del punto in cui ci troviamo
		Alloy.Globals.positionlatitude = e.coords.latitude;
		Alloy.Globals.positionlongitude = e.coords.longitude;

		// remove location listener
		Ti.Geolocation.removeEventListener("location", locationHandler);
		//$.lblstazionevicina.text='sei a lat: ' + Alloy.Globals.positionlatitude + ' / lng: ' + Alloy.Globals.positionlongitude;

		//carichiamo la stazione più vicina
		var url = Alloy.CFG.poiurl + Alloy.CFG.poistazionitrenovicino;
		url += '?' + 'lat=' + Alloy.Globals.positionlatitude + '&lng=' + Alloy.Globals.positionlongitude;
		url += '&dist=1000000000&limit=1';

		var xhr = Titanium.Network.createHTTPClient();
		xhr.setTimeout(20000);
		xhr.open('GET', url);

		xhr.onerror = function(e) {
			if (Ti.Network.online === false)
				$.lblstazionevicina.text = 'Connessione ad Internet assente.';
			else
				$.lblstazionevicina.text = 'Errore connessione di rete. Riprova più tardi.';

			$.actindstazionevicina.hide();
		};

		xhr.onload = function() {
			var ret = JSON.parse(this.responseText);

			if (( typeof ret === 'undefined') || (ret.markers.length === 0)) {
				$.lblstazionevicina.text = 'Impossibile recuperare le informazioni. Riprova più tardi';
			} else {
				var recorded = ret.markers[0];

				var dist = 0;
				if (Alloy.Globals.positionlatitude !== 0 && Alloy.Globals.positionlongitude !== 0)
					dist = Alloy.Globals.calcDistance(Alloy.Globals.positionlatitude, Alloy.Globals.positionlongitude, recorded.latitude, recorded.longitude);

				$.lblstazionevicina.text = 'Stazione di: ' + recorded.text + ' ' + Alloy.Globals.formatDistanceToLabel(dist);
				
				// Luca 14/11/2014
				$.richiedimappavicina.removeEventListener('click', requestMap);
				latitude = recorded.latitude;
				longitude = recorded.longitude;
				$.richiedimappavicina.addEventListener('click', requestMap);
				$.richiedimappavicina.show();

				//carichiamo i prossimi treni dlla stazione
				loadTreni(recorded.id, $.listatrenistazionevicina, $.actindstazionevicina);
			}

			$.actindstazionevicina.hide();
			$.viewstazionevicina.show();
		};

		$.viewstazionevicina.hide();
		$.actindstazionevicina.show();
		xhr.send();
	} else {
		$.lblstazionevicina.text = 'Posizione non disponibile. Consulta la sezione \'Elenco stazioni\'.';
	}
};

function loadVicina(e) {
	// add location event listener
	Ti.Geolocation.addEventListener("location", locationHandler);
};

function loadElenco(e) {
	//carichiamo la stazione più vicina
	var url = Alloy.CFG.poiurl + Alloy.CFG.poistazionitrenolista;
	url += '?nelat=48.850258&nelng=19.024658';
	url += '&swlat=35.012002&swlng=7.467041';

	var xhr = Titanium.Network.createHTTPClient();
	xhr.setTimeout(20000);
	xhr.open('GET', url);

	xhr.onerror = function(e) {
		if (Ti.Network.online === false)
			$.lblelencostazioni.text = 'Connessione ad Internet assente.';
		else
			$.lblelencostazioni.text = 'Errore connessione di rete. Riprova più tardi.';

		$.actindelencostazioni.hide();
	};

	xhr.onload = function() {
		var ret = JSON.parse(this.responseText);

		if (( typeof ret === 'undefined') || (ret.markers.length === 0)) {
			$.lblelencostazioni.text = 'Non è stato possibile caricare l\'elenco delle stazioni. prova a riavviare l\'app.';
			$.listastazionielencostazioni.hide();
		} else {
			var rows = [];
			for (var i = 0; i < ret.markers.length; i++) {
				var recorded = ret.markers[i];

				rows.push(createStazioniRow({
					id : recorded.id,
					text : recorded.text,
					subtext : recorded.subtitle,
					latitude : recorded.latitude,
					longitude : recorded.longitude
				}));
			}
			$.listastazionielencostazioni.setData(rows);

			$.lblelencostazioni.text = 'Seleziona una stazione di partenza dall\'elenco';
			$.listastazionielencostazioni.show();
		}

		$.actindelencostazioni.hide();
		$.viewelencostazioni.show();
	};

	$.viewelencostazioni.hide();
	$.actindelencostazioni.show();
	xhr.send();
};

function loadPreferiti(e) {
	var rows = [];
	for (var i = 0; i < prefsStazioni.length; i++) {
		var recorded = prefsStazioni[i];

		rows.push(createStazioniRow({
			id : recorded.id,
			text : recorded.text,
			subtext : recorded.subtext,
			latitude : recorded.latitude,
			longitude : recorded.longitude
		}));
	}

	if (rows.length === 0)
		rows.push(Ti.UI.createTableViewRow({
			title : 'Nessuna stazione preferita salvata.',
			height : Ti.UI.SIZE,
			color : '#000',
			selectedBackgroundColor : 'transparent',
			font : {
				fontSize : '12sp',
				fontWeight : 'bold'
			}
		}));

	$.listastazionielencostazionipref.setData(rows);
};

function setPreferito(e) {
	//cerco la stazione selezionata
	var indx = findPrefStazione(selectedStazione.id);
	if (indx !== -1) {
		//se la trovo, la rimuovo
		prefsStazioni.splice(indx, 1);
		$.preferiti.image = '/images/toolbar/nopref.png';
		$.preferitipref.image = '/images/toolbar/nopref.png';
	} else {
		//se non la trovo, la aggiungo
		prefsStazioni.push({
			id : selectedStazione.id,
			text : selectedStazione.text,
			subtext : selectedStazione.subtext,
			latitude : selectedStazione.latitude,
			longitude : selectedStazione.longitude
		});
		$.preferiti.image = '/images/toolbar/pref.png';
		$.preferitipref.image = '/images/toolbar/pref.png';
	}

	loadPreferiti(null);

	//salva lista aggiornata nella memoria
	Ti.App.Properties.setList('chiamatreno_stazionipreferite', prefsStazioni);
};

function normalizzaRitardo(ritardo) {
	//normalizziamo il dato ritardo
	if (ritardo === 'NA')
		ritardo = 'Dato su eventuale ritardo non disponibile';
	else if (ritardo === 'AS')
		ritardo = 'Autosostituito';
	else if (ritardo === 'EB')
		ritardo = 'Espletato con Autobus';
	else if (ritardo === '0' || ritardo === '')
		ritardo = '';
	else if (parseInt(ritardo) < 0)
		ritardo = '';
	else
		ritardo = 'Ritardo: ' + ritardo + (parseInt(ritardo) > 1 ? ' minuti' : ' minuto');

	return ritardo;
};

function loadTreni(codstazione, tabella, actind) {
	
	// Luca 13/11/2014
	// $.richiedimappa.show();
	// $.richiedimappapref.show();
	
	codstazione = codstazione - 6000000;

	//carichiamo la stazione più vicina
	var url = Alloy.CFG.poiurl + Alloy.CFG.elencotreni;
	url += '?codiceStazione=' + codstazione;

	var xhr = Titanium.Network.createHTTPClient();
	xhr.setTimeout(20000);
	xhr.open('GET', url);

	//ripuliamo la tabella
	tabella.setData([]);

	xhr.onerror = function(e) {
		rows.push(Ti.UI.createTableViewRow({
			title : 'Nessun dato disponibile al momento.\r\nRiprova più tardi.',
			height : Ti.UI.SIZE,
			color : '#000',
			selectedBackgroundColor : 'transparent',
			font : {
				fontSize : '12sp',
				fontWeight : 'bold'
			}
		}));
		tabella.setData(rows);
		actind.hide();
	};

	xhr.onload = function() {
		
		var ret = JSON.parse(this.responseText);

		if ( typeof ret === 'undefined') {
		} else {
			var rows = [];
			for (var i = 0; i < ret.treni.length; i++) {
				var recorded = ret.treni[i];

				//normalizziamo il dato ritardo
				recorded.ritardo = normalizzaRitardo(recorded.ritardo);
				rows.push(createTreniRow({
					stazione : recorded.stazione,
					treno : recorded.treno,
					ritardo : recorded.ritardo,
					arrivoprevisto : recorded.arrivoprevisto
				}));
			}

			if (rows.length === 0)
				rows.push(Ti.UI.createTableViewRow({
					title : 'Nessun dato disponibile al momento.\r\nRiprova più tardi.',
					height : Ti.UI.SIZE,
					color : '#000',
					selectedBackgroundColor : 'transparent',
					font : {
						fontSize : '12sp',
						fontWeight : 'bold'
					}
				}));

			tabella.setData(rows);
		}
		actind.hide();
	};

	actind.show();
	xhr.send();
};

function indietro(e) {
	$.lblelencostazioni.text = 'Seleziona una stazione di partenza dall\'elenco';

	$.viewelencostazioni.show();
	$.viewtrenielencostazioni.hide();
	$.richiedimappa.hide(); // Luca 13/11/2014
	$.preferiti.hide();

	$.aggiornaelenco.title = 'Aggiorna elenco';
	$.aggiornaelenco.removeEventListener('click', indietro);
	$.aggiornaelenco.addEventListener('click', loadElenco);
};

function indietroPreferiti(e) {
	$.lblelencostazionipref.text = 'Seleziona una stazione di partenza dall\'elenco';

	$.viewelencostazionipref.show();
	$.viewtrenielencostazionipref.hide();
	$.richiedimappapref.hide(); // Luca 13/11/2014
	$.preferitipref.hide();

	$.aggiornaelencopref.hide();
	$.aggiornaelencopref.removeEventListener('click', indietroPreferiti);
};

function findPrefStazione(id) {
	for (var i = 0; i < prefsStazioni.length; i++) {
		if (prefsStazioni[i].id === id)
			return i;
	}
	return -1;
};

$.listastazionielencostazioni.addEventListener('click', function(e) {
	selectedStazione = e.rowData.data;

	var dist = 0;
	if (Alloy.Globals.positionlatitude !== 0 && Alloy.Globals.positionlongitude !== 0)
		dist = Alloy.Globals.calcDistance(Alloy.Globals.positionlatitude, Alloy.Globals.positionlongitude, e.rowData.data.latitude, e.rowData.data.longitude);

	$.lblelencostazioni.text = 'Stazione di: ' + e.rowData.data.text + ' ' + Alloy.Globals.formatDistanceToLabel(dist);

	//carichiamo i prossimi treni dlla stazione
	loadTreni(e.rowData.data.id, $.listatrenielencostazioni, $.actindelencostazioni);

	$.viewelencostazioni.hide();
	$.viewtrenielencostazioni.show();
	
	// Luca 14/11/2014
	$.richiedimappa.removeEventListener('click', requestMap);
	latitude = e.rowData.data.latitude;
	longitude = e.rowData.data.longitude;
	$.richiedimappa.addEventListener('click', requestMap);
	$.richiedimappa.show();

	$.preferiti.show();
	var indx = findPrefStazione(e.rowData.data.id);
	if (indx !== -1)
		$.preferiti.image = '/images/toolbar/pref.png';
	else
		$.preferiti.image = '/images/toolbar/nopref.png';

	$.aggiornaelenco.title = 'Indietro';
	$.aggiornaelenco.removeEventListener('click', loadElenco);
	$.aggiornaelenco.addEventListener('click', indietro);
});

$.listastazionielencostazionipref.addEventListener('click', function(e) {
	selectedStazione = e.rowData.data;

	var dist = 0;
	if (Alloy.Globals.positionlatitude !== 0 && Alloy.Globals.positionlongitude !== 0)
		dist = Alloy.Globals.calcDistance(Alloy.Globals.positionlatitude, Alloy.Globals.positionlongitude, e.rowData.data.latitude, e.rowData.data.longitude);

	$.lblelencostazionipref.text = 'Stazione di: ' + e.rowData.data.text + ' ' + Alloy.Globals.formatDistanceToLabel(dist);

	//carichiamo i prossimi treni dlla stazione
	loadTreni(e.rowData.data.id, $.listatrenielencostazionipref, $.actindelencostazionipref);

	$.viewelencostazionipref.hide();
	$.viewtrenielencostazionipref.show();
	
	// Luca 14/11/2014
	$.richiedimappapref.removeEventListener('click', requestMap);
	latitude = e.rowData.data.latitude;
	longitude = e.rowData.data.longitude;
	$.richiedimappapref.addEventListener('click', requestMap);
	$.richiedimappapref.show();

	$.preferitipref.show();
	var indx = findPrefStazione(e.rowData.data.id);
	if (indx !== -1)
		$.preferitipref.image = '/images/toolbar/pref.png';
	else
		$.preferitipref.image = '/images/toolbar/nopref.png';

	$.aggiornaelencopref.show();
	$.aggiornaelencopref.title = 'Indietro';
	$.aggiornaelencopref.addEventListener('click', indietroPreferiti);
});

// impostiamo la procedura di exit dall'app
Alloy.Globals.exitApp($.index);

//carica la lista dei preferiti dalla memoria
var prefsStazioni = Ti.App.Properties.getList('chiamatreno_stazionipreferite', []);

//carichiamo la lsita intera
loadElenco(null);

//carichiamo la più vicina
loadVicina(null);

//carichiamo i preferiti
loadPreferiti(null);

//agganciamo gli eventi
$.aggiornaposizione.addEventListener('click', loadVicina);
$.aggiornaelenco.addEventListener('click', loadElenco);
$.preferiti.addEventListener('click', setPreferito);
$.preferitipref.addEventListener('click', setPreferito);

//assegniamo alla tabella delle stazioni il campo da
//filtrare on la searchbox
$.searchelencostazioni.addEventListener('change', function(e) {
	e.value;
});
$.searchelencostazioni.addEventListener('return', function(e) {
	$.searchelencostazioni.blur();
});
$.searchelencostazioni.addEventListener('cancel', function(e) {
	$.searchelencostazioni.blur();
});
$.listastazionielencostazioni.filterAttribute = 'valueToFilter';
$.listastazionielencostazioni.search = $.searchelencostazioni;

//VIA...
if (Ti.Platform.name !== "android")
	$.index.open({
		transition : Titanium.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
	});
else 
	$.index.open();
	
// Luca 18/11/2014
var logo_class = {
	width: ((Ti.Platform.displayCaps.platformWidth - 6) / (4 * Ti.Platform.displayCaps.logicalDensityFactor)) + 'dp'
};
$.addClass($.r4s_img, 'logo', logo_class);
$.addClass($.see_img, 'logo', logo_class);
$.addClass($.eu_img, 'logo', logo_class);
$.addClass($.tper_img, 'logo', logo_class);
$.addClass($.r4s_img_vicina, 'logo', logo_class);
$.addClass($.see_img_vicina, 'logo', logo_class);
$.addClass($.eu_img_vicina, 'logo', logo_class);
$.addClass($.tper_img_vicina, 'logo', logo_class);
$.addClass($.r4s_img_pref, 'logo', logo_class);
$.addClass($.see_img_pref, 'logo', logo_class);
$.addClass($.eu_img_pref, 'logo', logo_class);
$.addClass($.tper_img_pref, 'logo', logo_class);