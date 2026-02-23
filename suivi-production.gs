let traitementEnCours = false;
function onEdit(e) {
  const feuillePrincipale = "Audios/Vidéos - Nouveaux contenus";
  const feuilleHistorique = "Historique retours montage";
  const feuilleDates = "Horodatages";
  const colMisEnLigneLB = 16; // Colonne P (était 14/N, décalé +2)
  const ligneDebut = 11;
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const col = e.range.getColumn();
  const value = e.value;
    // === Envoi notification Slack si "Mise en ligne LB" passe à "Terminé"
  Logger.log("Cellule modifiée ligne %s, colonne %s, valeur : %s", row, col, value);

  if (
  sheet.getName() === feuillePrincipale &&
  row >= ligneDebut &&
  col === colMisEnLigneLB &&
  sheet.getRange(row, col).getValue() === "Terminé"
)
 {
    try {
  const commentaire = sheet.getRange(row, 21).getValue(); // Col U (était 19/S, décalé +2)
  const titre = sheet.getRange(row, 7).getValue();         // Col G ✓
  const module = sheet.getRange(row, 6).getValue();        // Col F ✓
  const formation = sheet.getRange(row, 5).getValue();     // Col E ✓
  const slackMessage = `📺 *Nouvelle vidéo mise en ligne !*\n` +
    `• *Formation* : ${formation}\n` +
    `• *Module* : ${module}\n` +
    `• *Titre* : ${titre}\n` +
    `• *Commentaire* : ${commentaire}`;
  // ⚠️ Remplacez par votre URL webhook Slack réelle
  const webhookUrl = PropertiesService.getScriptProperties().getProperty("SLACK_WEBHOOK_URL");
  const payload = JSON.stringify({ text: slackMessage });
  const options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(webhookUrl, options);
  Logger.log("✅ Slack notification déclenchée !");
  Logger.log("Slack response code: " + response.getResponseCode());
  Logger.log("Slack response text: " + response.getContentText());
} catch (error) {
  Logger.log("❌ Erreur Slack : " + error);
}
  }
  // 🔄 Sécurité anti-boucle
  if (traitementEnCours) return;
  try {
    traitementEnCours = true;
    const colVerification = 14;    // N (était 12/L, décalé +2)
    const colMontage = 13;         // M (était 11/K, décalé +2)
    const colSequençage = 12;      // L (était 10/J, décalé +2)
    const colMajInventaire = 18;   // R (était 16/P, décalé +2)
    const colCours = 6;            // F ✓
    const colModule = 7;           // G ✓
    const nbColonnes = sheet.getLastColumn();
    const sheetDates = e.source.getSheetByName(feuilleDates) ||
      e.source.insertSheet(feuilleDates);
    // === 1. Retour montage
    if (
      sheet.getName() === feuillePrincipale &&
      col === colVerification &&
      row >= ligneDebut &&
      value === "Retour montage"
    ) {
      const cache = CacheService.getScriptCache();
      const cacheKey = `retour_montage_ligne_${row}`;
      const now = Date.now();
      const lastTimestamp = parseInt(cache.get(cacheKey));
      if (lastTimestamp && now - lastTimestamp < 2000) return;
      cache.put(cacheKey, now.toString(), 5);
      try {
        const ligneOriginale = sheet.getRange(row, 1, 1, nbColonnes).getValues()[0];
        const sheetHistorique = e.source.getSheetByName(feuilleHistorique) ||
          e.source.insertSheet(feuilleHistorique);
        const horodatage = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
        sheetHistorique.appendRow([horodatage, ...ligneOriginale]);
        sheet.getRange(row, colMontage).setValue("Retour montage");
        sheet.getRange(row, colVerification).setValue("À faire");
      } catch (error) {
        console.error("Erreur retour montage :", error);
      }
    }
    // === 2. Séquençage
    if (
      sheet.getName() === feuillePrincipale &&
      row >= ligneDebut &&
      col === colSequençage &&
      value === "Terminé"
    ) {
      const horodatage = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
      const cours = sheet.getRange(row, colCours).getValue();
      const module = sheet.getRange(row, colModule).getValue();
      const lignesDates = sheetDates.getDataRange().getValues();
      const existeDéjà = lignesDates.some(ligne =>
        parseInt(ligne[0]) === row &&
        ligne[3] === cours &&
        ligne[4] === module &&
        ligne[2] === "Séquençage"
      );
      if (!existeDéjà) {
        sheetDates.appendRow([row, horodatage, "Séquençage", cours, module, "", ""]);
      }
    }
    // === 3. MAJ Inventaire
    if (
      sheet.getName() === feuillePrincipale &&
      row >= ligneDebut &&
      col === colMajInventaire &&
      value === "Terminé"
    ) {
      const horodatage = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
      const cours = sheet.getRange(row, colCours).getValue();
      const module = sheet.getRange(row, colModule).getValue();
      const lignesDates = sheetDates.getDataRange().getValues();
      for (let i = 1; i < lignesDates.length; i++) {
        const ligneLog = lignesDates[i];
        const ligneFeuille = ligneLog[0];
        const coursLog = ligneLog[3];
        const moduleLog = ligneLog[4];
        const correspondance =
          parseInt(ligneFeuille) === row &&
          coursLog === cours &&
          moduleLog === module;
        if (correspondance) {
          sheetDates.getRange(i + 1, 6).setValue(horodatage); // Col F
          sheetDates.getRange(i + 1, 7).setValue("MAJ inventaire"); // Col G
          break;
        }
      }
    }
  } finally {
    traitementEnCours = false;
  }
}
