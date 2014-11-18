require("behave").andSetup(this);

describe("Index screen", function() {
    var index = null;
    it("testimao che index esista", function() {
        index = Alloy.createController("index");
        expect(index).notToBe(null);
    });
    it("testiamo che il bottone per aggiornare la geo posizione esista", function() {
        expect(index.getView("aggiornaposizione")).notToBe(void 0);
    });
    it("testimao che il bottone aggiorni la geo posizione", function() {
        index.getView("aggiornaposizione").fireEvent("click");
        expect(index.getView("lblstazionevicina").text).toBe("Ricerca posizione in corso...");
    });
});