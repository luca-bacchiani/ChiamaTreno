var Alloy = require("alloy"), _ = Alloy._, Backbone = Alloy.Backbone;

if (false === Ti.Network.online || false === Ti.Geolocation.locationServicesEnabled) {
    var dialog = Ti.UI.createAlertDialog({
        cancel: 1,
        buttonNames: [ L("msg_prompt_settings"), L("msg_prompt_cancel") ],
        message: L("msg_prompt_noprereq_message"),
        title: L("msg_prompt_noprereq_title")
    });
    dialog.addEventListener("click", function(e) {
        if (e.cancel === e.index || true === e.cancel) return;
        var settingsIntent = Titanium.Android.createIntent({
            action: "android.settings.LOCATION_SOURCE_SETTINGS"
        });
        Ti.Android.currentActivity.startActivity(settingsIntent);
    });
    dialog.show();
}

Alloy.Globals.positionlatitude = 0;

Alloy.Globals.positionlongitude = 0;

Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;

Alloy.Globals.notify = function(text) {
    Ti.UI.createNotification({
        message: text,
        duration: Ti.UI.NOTIFICATION_DURATION_LONG
    }).show();
};

Alloy.Globals.normalizeHtmlMessage = function(text) {
    text = text.replace(/&egrave;/g, "è");
    text = text.replace(/&ugrave;/g, "ù");
    text = text.replace(/&agrave;/g, "à");
    return text;
};

Alloy.Globals.calcDistance = function(lat1, lng1, lat2, lng2) {
    var dist = 0;
    if (0 === lat1 && 0 === lng1) return dist;
    dist = 1e3 * Math.sqrt(Math.pow(111.3 * (lat1 - lat2), 2) + Math.pow(71.5 * (lng1 - lng2), 2));
    return dist;
};

Alloy.Globals.formatDistanceToLabel = function(dist) {
    var ret = "";
    if (false === Ti.Geolocation.locationServicesEnabled || 0 === dist) {
        ret = L("label_marker_cspark_nodistance");
        ret = "";
        return ret;
    }
    dist = Math.floor(dist);
    ret = dist >= 1e3 ? "" + Math.floor(dist / 1e3) + " " + L("label_marker_cspark_distance_km") : "" + dist + " " + L("label_marker_cspark_distance_meters");
    ret = String.format(L("label_marker_cspark_distance"), ret);
    return ret;
};

Alloy.Globals.exitApp = function() {};

var dialog = Ti.UI.createAlertDialog({
    cancel: 1,
    buttonNames: [ L("msg_prompt_ok"), L("msg_prompt_ko") ],
    message: L("msg_prompt_exitapp_message"),
    title: L("msg_prompt_exitapp_title")
});

dialog.addEventListener("click", function(e) {
    if (e.cancel === e.index || true === e.cancel) return;
    var activity = Titanium.Android.currentActivity;
    activity.finish();
});

Alloy.Globals.exitApp = function(win) {
    win.addEventListener("android:back", function() {
        dialog.show();
    });
};

var behave = require("behave");

require("spec/ui");

behave.run();

Alloy.createController("index");