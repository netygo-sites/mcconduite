// Fonction serverless Vercel — envoi des pré-inscriptions MC Conduite via Resend.
// Variables d'environnement attendues (Vercel > Settings > Environment Variables) :
//   RESEND_API_KEY  (obligatoire) : clé API Resend
//   MAIL_FROM       (optionnel)   : expéditeur, ex. "MC Conduite <preinscription@mcconduite.fr>"
//   MAIL_TO         (optionnel)   : destinataire, défaut mcconduiteechirolles@gmail.com

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );

const ACCENT = "#F5A623";
const DARK = "#1A1A1A";

function buildAdminEmail(d) {
  const rows = [
    ["Civilité", d.civilite],
    ["Prénom", d.prenom],
    ["Nom", d.nom],
    ["Date de naissance", d.naissance],
    ["Téléphone", d.phone],
    ["Email", d.email],
    ["Formation souhaitée", d.formation],
    ["Message", d.message],
    ["Consentement RGPD", d.rgpd ? "Oui" : "Non"],
  ]
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600;color:${DARK};width:180px;vertical-align:top;">${esc(k)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#333;">${esc(v).replace(/\n/g, "<br>")}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:${DARK};padding:22px 28px;">
          <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.3px;">MC Conduite</span>
          <span style="display:inline-block;height:4px;width:40px;background:${ACCENT};border-radius:3px;margin-left:10px;vertical-align:middle;"></span>
          <div style="color:${ACCENT};font-size:13px;margin-top:6px;font-weight:600;">Nouvelle pré-inscription</div>
        </td></tr>
        <tr><td style="padding:24px 28px 8px;">
          <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
            Une nouvelle demande de pré-inscription a été envoyée depuis le site <a href="https://mcconduite.fr" style="color:${ACCENT};text-decoration:none;">mcconduite.fr</a>.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;">
            ${rows}
          </table>
        </td></tr>
        <tr><td style="padding:8px 28px 26px;">
          <a href="tel:${esc(String(d.phone || "").replace(/\s+/g, ""))}" style="display:inline-block;background:${ACCENT};color:${DARK};text-decoration:none;font-weight:700;padding:11px 20px;border-radius:999px;font-size:14px;">Rappeler ${esc(d.prenom || "")}</a>
          <p style="margin:16px 0 0;color:#999;font-size:12px;">Répondez directement à cet email pour écrire au candidat.</p>
        </td></tr>
      </table>
      <p style="color:#aaa;font-size:11px;margin:16px 0 0;">MC Conduite — 26 avenue du 8 mai 1945, 38130 Échirolles</p>
    </td></tr>
  </table>
</body></html>`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Méthode non autorisée." });
    return;
  }

  const d = (req.body && typeof req.body === "object") ? req.body : {};

  // Honeypot anti-spam : si rempli, on "accepte" en silence sans envoyer.
  if (d.botcheck) {
    res.status(200).json({ success: true });
    return;
  }

  // Champs obligatoires
  const required = ["prenom", "nom", "phone", "email", "formation", "rgpd"];
  const missing = required.filter((f) => !d[f] || String(d[f]).trim() === "");
  if (missing.length) {
    res.status(400).json({ success: false, message: "Merci de remplir tous les champs obligatoires." });
    return;
  }

  const email = String(d.email).trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ success: false, message: "Adresse email invalide." });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY manquante");
    res.status(500).json({ success: false, message: "Envoi indisponible pour le moment. Merci de nous appeler au 04 38 21 48 02." });
    return;
  }

  const from = process.env.MAIL_FROM || "MC Conduite <preinscription@mcconduite.fr>";
  const to = process.env.MAIL_TO || "mcconduiteechirolles@gmail.com";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `Nouvelle pré-inscription — ${d.prenom} ${d.nom}`,
        html: buildAdminEmail(d),
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Resend error", r.status, detail);
      res.status(502).json({ success: false, message: "L'email n'a pas pu être envoyé. Réessayez ou appelez-nous au 04 38 21 48 02." });
      return;
    }

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("Erreur envoi", e);
    res.status(500).json({ success: false, message: "Erreur d'envoi. Merci de nous appeler au 04 38 21 48 02." });
  }
};
