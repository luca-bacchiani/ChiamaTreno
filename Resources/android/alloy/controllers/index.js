function __processArg(obj, key) {
    var arg = null;
    if (obj) {
        arg = obj[key] || null;
        delete obj[key];
    }
    return arg;
}

function Controller() {
    function loadVicina() {
        Ti.Geolocation.addEventListener("location", locationHandler);
    }
    function loadElenco() {
        var url = Alloy.CFG.poiurl + Alloy.CFG.poistazionitrenolista;
        url += "?nelat=48.850258&nelng=19.024658";
        url += "&swlat=35.012002&swlng=7.467041";
        var xhr = Titanium.Network.createHTTPClient();
        xhr.setTimeout(2e4);
        xhr.open("GET", url);
        xhr.onerror = function() {
            $.lblelencostazioni.text = false === Ti.Network.online ? "Connessione ad Internet assente." : "Errore connessione di rete. Riprova più tardi.";
            $.actindelencostazioni.hide();
        };
        xhr.onload = function() {
            var ret = JSON.parse(this.responseText);
            if ("undefined" == typeof ret || 0 === ret.markers.length) {
                $.lblelencostazioni.text = "Non è stato possibile caricare l'elenco delle stazioni. prova a riavviare l'app.";
                $.listastazionielencostazioni.hide();
            } else {
                var rows = [];
                for (var i = 0; i < ret.markers.length; i++) {
                    var recorded = ret.markers[i];
                    rows.push(createStazioniRow({
                        id: recorded.id,
                        text: recorded.text,
                        subtext: recorded.subtitle,
                        latitude: recorded.latitude,
                        longitude: recorded.longitude
                    }));
                }
                $.listastazionielencostazioni.setData(rows);
                $.lblelencostazioni.text = "Seleziona una stazione di partenza dall'elenco";
                $.listastazionielencostazioni.show();
            }
            $.actindelencostazioni.hide();
            $.viewelencostazioni.show();
        };
        $.viewelencostazioni.hide();
        $.actindelencostazioni.show();
        xhr.send();
    }
    function loadPreferiti() {
        var rows = [];
        for (var i = 0; i < prefsStazioni.length; i++) {
            var recorded = prefsStazioni[i];
            rows.push(createStazioniRow({
                id: recorded.id,
                text: recorded.text,
                subtext: recorded.subtext,
                latitude: recorded.latitude,
                longitude: recorded.longitude
            }));
        }
        0 === rows.length && rows.push(Ti.UI.createTableViewRow({
            title: "Nessuna stazione preferita salvata.",
            height: Ti.UI.SIZE,
            color: "#000",
            selectedBackgroundColor: "transparent",
            font: {
                fontSize: "12sp",
                fontWeight: "bold"
            }
        }));
        $.listastazionielencostazionipref.setData(rows);
    }
    function setPreferito() {
        var indx = findPrefStazione(selectedStazione.id);
        if (-1 !== indx) {
            prefsStazioni.splice(indx, 1);
            $.preferiti.image = "/images/toolbar/nopref.png";
            $.preferitipref.image = "/images/toolbar/nopref.png";
        } else {
            prefsStazioni.push({
                id: selectedStazione.id,
                text: selectedStazione.text,
                subtext: selectedStazione.subtext,
                latitude: selectedStazione.latitude,
                longitude: selectedStazione.longitude
            });
            $.preferiti.image = "/images/toolbar/pref.png";
            $.preferitipref.image = "/images/toolbar/pref.png";
        }
        loadPreferiti(null);
        Ti.App.Properties.setList("chiamatreno_stazionipreferite", prefsStazioni);
    }
    function normalizzaRitardo(ritardo) {
        ritardo = "NA" === ritardo ? "Dato su eventuale ritardo non disponibile" : "AS" === ritardo ? "Autosostituito" : "EB" === ritardo ? "Espletato con Autobus" : "0" === ritardo || "" === ritardo ? "" : parseInt(ritardo) < 0 ? "" : "Ritardo: " + ritardo + (parseInt(ritardo) > 1 ? " minuti" : " minuto");
        return ritardo;
    }
    function loadTreni(codstazione, tabella, actind) {
        codstazione -= 6e6;
        var url = Alloy.CFG.poiurl + Alloy.CFG.elencotreni;
        url += "?codiceStazione=" + codstazione;
        var xhr = Titanium.Network.createHTTPClient();
        xhr.setTimeout(2e4);
        xhr.open("GET", url);
        tabella.setData([]);
        xhr.onerror = function() {
            rows.push(Ti.UI.createTableViewRow({
                title: "Nessun dato disponibile al momento.\r\nRiprova più tardi.",
                height: Ti.UI.SIZE,
                color: "#000",
                selectedBackgroundColor: "transparent",
                font: {
                    fontSize: "12sp",
                    fontWeight: "bold"
                }
            }));
            tabella.setData(rows);
            actind.hide();
        };
        xhr.onload = function() {
            var ret = JSON.parse(this.responseText);
            if ("undefined" == typeof ret) ; else {
                var rows = [];
                for (var i = 0; i < ret.treni.length; i++) {
                    var recorded = ret.treni[i];
                    recorded.ritardo = normalizzaRitardo(recorded.ritardo);
                    rows.push(createTreniRow({
                        stazione: recorded.stazione,
                        treno: recorded.treno,
                        ritardo: recorded.ritardo,
                        arrivoprevisto: recorded.arrivoprevisto
                    }));
                }
                0 === rows.length && rows.push(Ti.UI.createTableViewRow({
                    title: "Nessun dato disponibile al momento.\r\nRiprova più tardi.",
                    height: Ti.UI.SIZE,
                    color: "#000",
                    selectedBackgroundColor: "transparent",
                    font: {
                        fontSize: "12sp",
                        fontWeight: "bold"
                    }
                }));
                tabella.setData(rows);
            }
            actind.hide();
        };
        actind.show();
        xhr.send();
    }
    function indietro() {
        $.lblelencostazioni.text = "Seleziona una stazione di partenza dall'elenco";
        $.viewelencostazioni.show();
        $.viewtrenielencostazioni.hide();
        $.richiedimappa.hide();
        $.preferiti.hide();
        $.aggiornaelenco.title = "Aggiorna elenco";
        $.aggiornaelenco.removeEventListener("click", indietro);
        $.aggiornaelenco.addEventListener("click", loadElenco);
    }
    function indietroPreferiti() {
        $.lblelencostazionipref.text = "Seleziona una stazione di partenza dall'elenco";
        $.viewelencostazionipref.show();
        $.viewtrenielencostazionipref.hide();
        $.richiedimappapref.hide();
        $.preferitipref.hide();
        $.aggiornaelencopref.hide();
        $.aggiornaelencopref.removeEventListener("click", indietroPreferiti);
    }
    function findPrefStazione(id) {
        for (var i = 0; i < prefsStazioni.length; i++) if (prefsStazioni[i].id === id) return i;
        return -1;
    }
    require("alloy/controllers/BaseController").apply(this, Array.prototype.slice.call(arguments));
    this.__controllerPath = "index";
    if (arguments[0]) {
        {
            __processArg(arguments[0], "__parentSymbol");
        }
        {
            __processArg(arguments[0], "$model");
        }
        {
            __processArg(arguments[0], "__itemTemplate");
        }
    }
    var $ = this;
    var exports = {};
    var __alloyId0 = [];
    $.__views.__alloyId2 = Ti.UI.createWindow({
        backgroundColor: "#fff",
        title: "Stazione vicino",
        id: "__alloyId2"
    });
    $.__views.__alloyId3 = Ti.UI.createView({
        top: 0,
        height: "90dp",
        backgroundColor: "#cd3838",
        layout: "vertical",
        id: "__alloyId3"
    });
    $.__views.__alloyId2.add($.__views.__alloyId3);
    $.__views.__alloyId4 = Ti.UI.createView({
        height: Ti.UI.SIZE,
        layout: "horizontal",
        id: "__alloyId4"
    });
    $.__views.__alloyId3.add($.__views.__alloyId4);
    $.__views.aggiornaposizione = Ti.UI.createButton({
        title: "Aggiorna posizione",
        left: 0,
        top: 5,
        id: "aggiornaposizione"
    });
    $.__views.__alloyId4.add($.__views.aggiornaposizione);
    $.__views.stazionevicinatool = Ti.UI.createView({
        height: Ti.UI.SIZE,
        layout: "horizontal",
        id: "stazionevicinatool"
    });
    $.__views.__alloyId3.add($.__views.stazionevicinatool);
    $.__views.lblstazionevicina = Ti.UI.createLabel({
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE,
        color: "#FFF",
        font: {
            fontSize: "12sp",
            fontWeight: "bold"
        },
        textAlign: "left",
        left: 5,
        right: 5,
        text: "Ricerca posizione in corso...",
        id: "lblstazionevicina"
    });
    $.__views.stazionevicinatool.add($.__views.lblstazionevicina);
    $.__views.richiedimappavicina = Ti.UI.createButton({
        visible: false,
        backgroundColor: "transparent",
        backgroundImage: "none",
        image: "/images/toolbar/maps.png",
        id: "richiedimappavicina"
    });
    $.__views.stazionevicinatool.add($.__views.richiedimappavicina);
    $.__views.__alloyId5 = Ti.UI.createView({
        top: "90dp",
        id: "__alloyId5"
    });
    $.__views.__alloyId2.add($.__views.__alloyId5);
    $.__views.viewstazionevicina = Ti.UI.createView({
        layout: "vertical",
        id: "viewstazionevicina"
    });
    $.__views.__alloyId5.add($.__views.viewstazionevicina);
    $.__views.listatrenistazionevicina = Ti.UI.createTableView({
        top: 20,
        allowsSelection: false,
        id: "listatrenistazionevicina"
    });
    $.__views.viewstazionevicina.add($.__views.listatrenistazionevicina);
    $.__views.actindstazionevicina = Ti.UI.createActivityIndicator({
        height: Ti.UI.SIZE,
        width: Ti.UI.SIZE,
        color: "black",
        id: "actindstazionevicina"
    });
    $.__views.__alloyId5.add($.__views.actindstazionevicina);
    $.__views.footervicina = Ti.UI.createView({
        bottom: 0,
        height: "90dp",
        backgroundColor: "#FFF",
        layout: "horizontal",
        borderColor: "#cd3838",
        borderWidth: "3dp",
        id: "footervicina"
    });
    $.__views.__alloyId2.add($.__views.footervicina);
    $.__views.r4s_img_vicina = Ti.UI.createImageView({
        id: "r4s_img_vicina",
        image: "/images/footer/r4s_logo.jpg"
    });
    $.__views.footervicina.add($.__views.r4s_img_vicina);
    $.__views.see_img_vicina = Ti.UI.createImageView({
        id: "see_img_vicina",
        image: "/images/footer/see_logo.jpg"
    });
    $.__views.footervicina.add($.__views.see_img_vicina);
    $.__views.eu_img_vicina = Ti.UI.createImageView({
        id: "eu_img_vicina",
        image: "/images/footer/eu_logo.jpg"
    });
    $.__views.footervicina.add($.__views.eu_img_vicina);
    $.__views.tper_img_vicina = Ti.UI.createImageView({
        id: "tper_img_vicina",
        image: "/images/footer/tper_logo.jpg"
    });
    $.__views.footervicina.add($.__views.tper_img_vicina);
    $.__views.__alloyId1 = Ti.UI.createTab({
        window: $.__views.__alloyId2,
        title: "Stazione vicino",
        icon: "/images/tabview/KS_nav_views.png",
        id: "__alloyId1"
    });
    __alloyId0.push($.__views.__alloyId1);
    $.__views.__alloyId6 = Ti.UI.createWindow({
        backgroundColor: "#fff",
        title: "Elenco stazioni",
        id: "__alloyId6"
    });
    $.__views.__alloyId7 = Ti.UI.createView({
        top: 0,
        height: "90dp",
        backgroundColor: "#cd3838",
        layout: "vertical",
        id: "__alloyId7"
    });
    $.__views.__alloyId6.add($.__views.__alloyId7);
    $.__views.__alloyId8 = Ti.UI.createView({
        height: Ti.UI.SIZE,
        layout: "horizontal",
        id: "__alloyId8"
    });
    $.__views.__alloyId7.add($.__views.__alloyId8);
    $.__views.aggiornaelenco = Ti.UI.createButton({
        title: "Aggiorna elenco",
        left: 0,
        top: 5,
        id: "aggiornaelenco"
    });
    $.__views.__alloyId8.add($.__views.aggiornaelenco);
    $.__views.preferiti = Ti.UI.createButton({
        backgroundColor: "transparent",
        backgroundImage: "none",
        image: "/images/toolbar/nopref.png",
        left: 10,
        top: 5,
        visible: false,
        id: "preferiti"
    });
    $.__views.__alloyId8.add($.__views.preferiti);
    $.__views.__alloyId9 = Ti.UI.createView({
        height: Ti.UI.SIZE,
        layout: "horizontal",
        id: "__alloyId9"
    });
    $.__views.__alloyId7.add($.__views.__alloyId9);
    $.__views.lblelencostazioni = Ti.UI.createLabel({
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE,
        color: "#FFF",
        font: {
            fontSize: "12sp",
            fontWeight: "bold"
        },
        textAlign: "left",
        left: 5,
        right: 5,
        text: "Seleziona una stazione di partenza dall'elenco",
        id: "lblelencostazioni"
    });
    $.__views.__alloyId9.add($.__views.lblelencostazioni);
    $.__views.richiedimappa = Ti.UI.createButton({
        visible: false,
        backgroundColor: "transparent",
        backgroundImage: "none",
        image: "/images/toolbar/maps.png",
        id: "richiedimappa"
    });
    $.__views.__alloyId9.add($.__views.richiedimappa);
    $.__views.__alloyId10 = Ti.UI.createView({
        top: "90dp",
        id: "__alloyId10"
    });
    $.__views.__alloyId6.add($.__views.__alloyId10);
    $.__views.viewelencostazioni = Ti.UI.createView({
        layout: "vertical",
        id: "viewelencostazioni"
    });
    $.__views.__alloyId10.add($.__views.viewelencostazioni);
    $.__views.searchelencostazioni = Ti.UI.createSearchBar({
        barColor: "#000",
        top: 0,
        showCancel: "false",
        hintText: "Cerca...",
        id: "searchelencostazioni"
    });
    $.__views.viewelencostazioni.add($.__views.searchelencostazioni);
    $.__views.listastazionielencostazioni = Ti.UI.createTableView({
        id: "listastazionielencostazioni"
    });
    $.__views.viewelencostazioni.add($.__views.listastazionielencostazioni);
    $.__views.viewtrenielencostazioni = Ti.UI.createView({
        layout: "vertical",
        visible: false,
        id: "viewtrenielencostazioni"
    });
    $.__views.__alloyId10.add($.__views.viewtrenielencostazioni);
    $.__views.listatrenielencostazioni = Ti.UI.createTableView({
        top: 20,
        allowsSelection: false,
        id: "listatrenielencostazioni"
    });
    $.__views.viewtrenielencostazioni.add($.__views.listatrenielencostazioni);
    $.__views.actindelencostazioni = Ti.UI.createActivityIndicator({
        height: Ti.UI.SIZE,
        width: Ti.UI.SIZE,
        color: "black",
        id: "actindelencostazioni"
    });
    $.__views.__alloyId10.add($.__views.actindelencostazioni);
    $.__views.footerstazelenco = Ti.UI.createView({
        bottom: 0,
        height: "90dp",
        backgroundColor: "#FFF",
        layout: "horizontal",
        borderColor: "#cd3838",
        borderWidth: "3dp",
        id: "footerstazelenco"
    });
    $.__views.__alloyId6.add($.__views.footerstazelenco);
    $.__views.r4s_img = Ti.UI.createImageView({
        id: "r4s_img",
        image: "/images/footer/r4s_logo.jpg"
    });
    $.__views.footerstazelenco.add($.__views.r4s_img);
    $.__views.see_img = Ti.UI.createImageView({
        id: "see_img",
        image: "/images/footer/see_logo.jpg"
    });
    $.__views.footerstazelenco.add($.__views.see_img);
    $.__views.eu_img = Ti.UI.createImageView({
        id: "eu_img",
        image: "/images/footer/eu_logo.jpg"
    });
    $.__views.footerstazelenco.add($.__views.eu_img);
    $.__views.tper_img = Ti.UI.createImageView({
        id: "tper_img",
        image: "/images/footer/tper_logo.jpg"
    });
    $.__views.footerstazelenco.add($.__views.tper_img);
    $.__views.stazionitab = Ti.UI.createTab({
        window: $.__views.__alloyId6,
        title: "Elenco stazioni",
        icon: "/images/tabview/KS_nav_ui.png",
        id: "stazionitab"
    });
    __alloyId0.push($.__views.stazionitab);
    $.__views.__alloyId11 = Ti.UI.createWindow({
        backgroundColor: "#fff",
        title: "Elenco stazioni",
        id: "__alloyId11"
    });
    $.__views.__alloyId12 = Ti.UI.createView({
        top: 0,
        height: "90dp",
        backgroundColor: "#cd3838",
        layout: "vertical",
        id: "__alloyId12"
    });
    $.__views.__alloyId11.add($.__views.__alloyId12);
    $.__views.__alloyId13 = Ti.UI.createView({
        height: Ti.UI.SIZE,
        layout: "horizontal",
        id: "__alloyId13"
    });
    $.__views.__alloyId12.add($.__views.__alloyId13);
    $.__views.aggiornaelencopref = Ti.UI.createButton({
        title: "Aggiorna elenco",
        left: 0,
        top: 5,
        visible: false,
        id: "aggiornaelencopref"
    });
    $.__views.__alloyId13.add($.__views.aggiornaelencopref);
    $.__views.preferitipref = Ti.UI.createButton({
        backgroundColor: "transparent",
        backgroundImage: "none",
        image: "/images/toolbar/nopref.png",
        left: 10,
        top: 5,
        visible: false,
        id: "preferitipref"
    });
    $.__views.__alloyId13.add($.__views.preferitipref);
    $.__views.__alloyId14 = Ti.UI.createView({
        height: Ti.UI.SIZE,
        layout: "horizontal",
        id: "__alloyId14"
    });
    $.__views.__alloyId12.add($.__views.__alloyId14);
    $.__views.lblelencostazionipref = Ti.UI.createLabel({
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE,
        color: "#FFF",
        font: {
            fontSize: "12sp",
            fontWeight: "bold"
        },
        textAlign: "left",
        left: 5,
        right: 5,
        text: "Seleziona una stazione di partenza dall'elenco",
        id: "lblelencostazionipref"
    });
    $.__views.__alloyId14.add($.__views.lblelencostazionipref);
    $.__views.richiedimappapref = Ti.UI.createButton({
        visible: false,
        backgroundColor: "transparent",
        backgroundImage: "none",
        image: "/images/toolbar/maps.png",
        id: "richiedimappapref"
    });
    $.__views.__alloyId14.add($.__views.richiedimappapref);
    $.__views.__alloyId15 = Ti.UI.createView({
        top: "90dp",
        id: "__alloyId15"
    });
    $.__views.__alloyId11.add($.__views.__alloyId15);
    $.__views.viewelencostazionipref = Ti.UI.createView({
        layout: "vertical",
        id: "viewelencostazionipref"
    });
    $.__views.__alloyId15.add($.__views.viewelencostazionipref);
    $.__views.listastazionielencostazionipref = Ti.UI.createTableView({
        id: "listastazionielencostazionipref"
    });
    $.__views.viewelencostazionipref.add($.__views.listastazionielencostazionipref);
    $.__views.viewtrenielencostazionipref = Ti.UI.createView({
        layout: "vertical",
        visible: false,
        id: "viewtrenielencostazionipref"
    });
    $.__views.__alloyId15.add($.__views.viewtrenielencostazionipref);
    $.__views.listatrenielencostazionipref = Ti.UI.createTableView({
        top: 20,
        allowsSelection: false,
        id: "listatrenielencostazionipref"
    });
    $.__views.viewtrenielencostazionipref.add($.__views.listatrenielencostazionipref);
    $.__views.actindelencostazionipref = Ti.UI.createActivityIndicator({
        height: Ti.UI.SIZE,
        width: Ti.UI.SIZE,
        color: "black",
        id: "actindelencostazionipref"
    });
    $.__views.__alloyId15.add($.__views.actindelencostazionipref);
    $.__views.footerpref = Ti.UI.createView({
        bottom: 0,
        height: "90dp",
        backgroundColor: "#FFF",
        layout: "horizontal",
        borderColor: "#cd3838",
        borderWidth: "3dp",
        id: "footerpref"
    });
    $.__views.__alloyId11.add($.__views.footerpref);
    $.__views.r4s_img_pref = Ti.UI.createImageView({
        id: "r4s_img_pref",
        image: "/images/footer/r4s_logo.jpg"
    });
    $.__views.footerpref.add($.__views.r4s_img_pref);
    $.__views.see_img_pref = Ti.UI.createImageView({
        id: "see_img_pref",
        image: "/images/footer/see_logo.jpg"
    });
    $.__views.footerpref.add($.__views.see_img_pref);
    $.__views.eu_img_pref = Ti.UI.createImageView({
        id: "eu_img_pref",
        image: "/images/footer/eu_logo.jpg"
    });
    $.__views.footerpref.add($.__views.eu_img_pref);
    $.__views.tper_img_pref = Ti.UI.createImageView({
        id: "tper_img_pref",
        image: "/images/footer/tper_logo.jpg"
    });
    $.__views.footerpref.add($.__views.tper_img_pref);
    $.__views.preftab = Ti.UI.createTab({
        window: $.__views.__alloyId11,
        title: "Preferiti",
        icon: "/images/tabview/KS_nav_pref.png",
        id: "preftab"
    });
    __alloyId0.push($.__views.preftab);
    $.__views.index = Ti.UI.createTabGroup({
        navBarHidden: true,
        width: Ti.UI.FILL,
        height: Ti.UI.FILL,
        tabs: __alloyId0,
        id: "index"
    });
    $.__views.index && $.addTopLevelView($.__views.index);
    exports.destroy = function() {};
    _.extend($, $.__views);
    var latitude;
    var longitude;
    var requestMap = function() {
        if (isNaN(latitude) || isNaN(longitude)) {
            alert("coordinate non valide");
            return;
        }
        var intent = Titanium.Android.createServiceIntent({
            action: Ti.Android.ACTION_VIEW,
            data: "geo:" + latitude + "," + longitude
        });
        intent.addCategory(Ti.Android.CATEGORY_DEFAULT);
        Ti.Android.currentActivity.startActivity(intent);
    };
    $.stazionitab.addEventListener("focus", function() {
        $.viewelencostazioni.visible && $.richiedimappa.hide();
    });
    $.preftab.addEventListener("focus", function() {
        $.viewelencostazionipref.visible && $.richiedimappapref.hide();
    });
    var selectedStazione;
    var createStazioniRow = function(item) {
        var tablerow = Ti.UI.createTableViewRow({
            rightImage: "/images/tableview/view.png",
            leftImage: "/images/tableview/station.png",
            data: item,
            valueToFilter: item.text
        });
        var v = Ti.UI.createView({
            layout: "vertical",
            touchEnabled: false
        });
        v.add(Ti.UI.createLabel({
            text: item.text,
            touchEnabled: false,
            color: "#000",
            textAlign: "left",
            left: 0,
            font: {
                fontWeight: "bold",
                fontSize: "16sp"
            }
        }));
        v.add(Ti.UI.createLabel({
            text: "" === item.subtext ? "Nessun indirizzo disponibile" : item.subtext,
            touchEnabled: false,
            textAlign: "left",
            left: 0,
            color: "#969191",
            font: {
                fontSize: "12sp"
            }
        }));
        tablerow.add(v);
        return tablerow;
    };
    var createTreniRow = function(item) {
        var tablerow = Ti.UI.createTableViewRow({
            layout: "vertical",
            data: item,
            selectedBackgroundColor: "transparent"
        });
        tablerow.add(Ti.UI.createLabel({
            text: "Destinazione: " + item.stazione,
            touchEnabled: false,
            left: 5,
            color: "#000",
            font: {
                fontWeight: "bold",
                fontSize: "16sp"
            }
        }));
        var v = Ti.UI.createView({
            layout: "horizontal",
            touchEnabled: false,
            left: 5,
            height: Ti.UI.SIZE
        });
        var im = Ti.UI.createImageView({
            image: "/images/tableview/train.png",
            left: 0,
            touchEnabled: false
        });
        v.add(im);
        v.add(Ti.UI.createLabel({
            text: "Treno: " + item.treno + "\r\nPartenza: " + item.arrivoprevisto + "\r\n" + item.ritardo,
            touchEnabled: false,
            left: 5,
            color: "#969191",
            font: {
                fontSize: "12sp"
            }
        }));
        tablerow.add(v);
        return tablerow;
    };
    var locationHandler = function(e) {
        $.richiedimappavicina.hide();
        if (e.success && null != e.coords) {
            Alloy.Globals.positionlatitude = e.coords.latitude;
            Alloy.Globals.positionlongitude = e.coords.longitude;
            Ti.Geolocation.removeEventListener("location", locationHandler);
            var url = Alloy.CFG.poiurl + Alloy.CFG.poistazionitrenovicino;
            url += "?lat=" + Alloy.Globals.positionlatitude + "&lng=" + Alloy.Globals.positionlongitude;
            url += "&dist=1000000000&limit=1";
            var xhr = Titanium.Network.createHTTPClient();
            xhr.setTimeout(2e4);
            xhr.open("GET", url);
            xhr.onerror = function() {
                $.lblstazionevicina.text = false === Ti.Network.online ? "Connessione ad Internet assente." : "Errore connessione di rete. Riprova più tardi.";
                $.actindstazionevicina.hide();
            };
            xhr.onload = function() {
                var ret = JSON.parse(this.responseText);
                if ("undefined" == typeof ret || 0 === ret.markers.length) $.lblstazionevicina.text = "Impossibile recuperare le informazioni. Riprova più tardi"; else {
                    var recorded = ret.markers[0];
                    var dist = 0;
                    0 !== Alloy.Globals.positionlatitude && 0 !== Alloy.Globals.positionlongitude && (dist = Alloy.Globals.calcDistance(Alloy.Globals.positionlatitude, Alloy.Globals.positionlongitude, recorded.latitude, recorded.longitude));
                    $.lblstazionevicina.text = "Stazione di: " + recorded.text + " " + Alloy.Globals.formatDistanceToLabel(dist);
                    $.richiedimappavicina.removeEventListener("click", requestMap);
                    latitude = recorded.latitude;
                    longitude = recorded.longitude;
                    $.richiedimappavicina.addEventListener("click", requestMap);
                    $.richiedimappavicina.show();
                    loadTreni(recorded.id, $.listatrenistazionevicina, $.actindstazionevicina);
                }
                $.actindstazionevicina.hide();
                $.viewstazionevicina.show();
            };
            $.viewstazionevicina.hide();
            $.actindstazionevicina.show();
            xhr.send();
        } else $.lblstazionevicina.text = "Posizione non disponibile. Consulta la sezione 'Elenco stazioni'.";
    };
    $.listastazionielencostazioni.addEventListener("click", function(e) {
        selectedStazione = e.rowData.data;
        var dist = 0;
        0 !== Alloy.Globals.positionlatitude && 0 !== Alloy.Globals.positionlongitude && (dist = Alloy.Globals.calcDistance(Alloy.Globals.positionlatitude, Alloy.Globals.positionlongitude, e.rowData.data.latitude, e.rowData.data.longitude));
        $.lblelencostazioni.text = "Stazione di: " + e.rowData.data.text + " " + Alloy.Globals.formatDistanceToLabel(dist);
        loadTreni(e.rowData.data.id, $.listatrenielencostazioni, $.actindelencostazioni);
        $.viewelencostazioni.hide();
        $.viewtrenielencostazioni.show();
        $.richiedimappa.removeEventListener("click", requestMap);
        latitude = e.rowData.data.latitude;
        longitude = e.rowData.data.longitude;
        $.richiedimappa.addEventListener("click", requestMap);
        $.richiedimappa.show();
        $.preferiti.show();
        var indx = findPrefStazione(e.rowData.data.id);
        $.preferiti.image = -1 !== indx ? "/images/toolbar/pref.png" : "/images/toolbar/nopref.png";
        $.aggiornaelenco.title = "Indietro";
        $.aggiornaelenco.removeEventListener("click", loadElenco);
        $.aggiornaelenco.addEventListener("click", indietro);
    });
    $.listastazionielencostazionipref.addEventListener("click", function(e) {
        selectedStazione = e.rowData.data;
        var dist = 0;
        0 !== Alloy.Globals.positionlatitude && 0 !== Alloy.Globals.positionlongitude && (dist = Alloy.Globals.calcDistance(Alloy.Globals.positionlatitude, Alloy.Globals.positionlongitude, e.rowData.data.latitude, e.rowData.data.longitude));
        $.lblelencostazionipref.text = "Stazione di: " + e.rowData.data.text + " " + Alloy.Globals.formatDistanceToLabel(dist);
        loadTreni(e.rowData.data.id, $.listatrenielencostazionipref, $.actindelencostazionipref);
        $.viewelencostazionipref.hide();
        $.viewtrenielencostazionipref.show();
        $.richiedimappapref.removeEventListener("click", requestMap);
        latitude = e.rowData.data.latitude;
        longitude = e.rowData.data.longitude;
        $.richiedimappapref.addEventListener("click", requestMap);
        $.richiedimappapref.show();
        $.preferitipref.show();
        var indx = findPrefStazione(e.rowData.data.id);
        $.preferitipref.image = -1 !== indx ? "/images/toolbar/pref.png" : "/images/toolbar/nopref.png";
        $.aggiornaelencopref.show();
        $.aggiornaelencopref.title = "Indietro";
        $.aggiornaelencopref.addEventListener("click", indietroPreferiti);
    });
    Alloy.Globals.exitApp($.index);
    var prefsStazioni = Ti.App.Properties.getList("chiamatreno_stazionipreferite", []);
    loadElenco(null);
    loadVicina(null);
    loadPreferiti(null);
    $.aggiornaposizione.addEventListener("click", loadVicina);
    $.aggiornaelenco.addEventListener("click", loadElenco);
    $.preferiti.addEventListener("click", setPreferito);
    $.preferitipref.addEventListener("click", setPreferito);
    $.searchelencostazioni.addEventListener("change", function(e) {
        e.value;
    });
    $.searchelencostazioni.addEventListener("return", function() {
        $.searchelencostazioni.blur();
    });
    $.searchelencostazioni.addEventListener("cancel", function() {
        $.searchelencostazioni.blur();
    });
    $.listastazionielencostazioni.filterAttribute = "valueToFilter";
    $.listastazionielencostazioni.search = $.searchelencostazioni;
    $.index.open();
    var logo_class = {
        width: (Ti.Platform.displayCaps.platformWidth - 6) / (4 * Ti.Platform.displayCaps.logicalDensityFactor) + "dp"
    };
    $.addClass($.r4s_img, "logo", logo_class);
    $.addClass($.see_img, "logo", logo_class);
    $.addClass($.eu_img, "logo", logo_class);
    $.addClass($.tper_img, "logo", logo_class);
    $.addClass($.r4s_img_vicina, "logo", logo_class);
    $.addClass($.see_img_vicina, "logo", logo_class);
    $.addClass($.eu_img_vicina, "logo", logo_class);
    $.addClass($.tper_img_vicina, "logo", logo_class);
    $.addClass($.r4s_img_pref, "logo", logo_class);
    $.addClass($.see_img_pref, "logo", logo_class);
    $.addClass($.eu_img_pref, "logo", logo_class);
    $.addClass($.tper_img_pref, "logo", logo_class);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;