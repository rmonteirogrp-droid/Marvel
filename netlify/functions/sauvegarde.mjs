// Sauvegarde en ligne des profils (coches, notes, cartes, records), une entrée par identifiant.
// La clé est une empreinte dérivée de l'identifiant (jamais l'identifiant lui-même, jamais une valeur présente dans l'app).
// GET  /api/sauvegarde?k=<clé>          → { t, donnees } ou 404
// PUT  /api/sauvegarde?k=<clé>  { t, donnees } → enregistre si plus récent que l'existant (sinon renvoie l'existant, 409)
import { getStore } from "@netlify/blobs";

const MAX = 3 * 1024 * 1024;   // 3 Mo par compte, très large
// Richesse d'une sauvegarde = titres cochés + cartes obtenues, tous profils confondus.
// Une sauvegarde presque vide (nouveau site, compte recréé…) ne doit jamais faire perdre une vraie progression :
// - en lecture, elle est ignorée (404) : l'appareil qui a la progression l'envoie alors ;
// - en écriture, une version bien plus riche gagne même si elle est plus ancienne, et une version bien plus pauvre est refusée.
const richesse = d => {
  let n = 0; const e = (d && d.etat) || {};
  for(const k in e){ const x = e[k] || {}; n += Object.keys((x.mcu || {}).vus || {}).length + Object.keys((x.multi || {}).vus || {}).length + Object.keys((x.cartes || {}).col || {}).length; }
  return n;
};
const PAUVRE = 3;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers:{ "content-type":"application/json", "cache-control":"no-store" } });

export default async (req) => {
  const k = new URL(req.url).searchParams.get("k") || "";
  if(!/^[0-9a-f]{64}$/.test(k)) return json({ erreur:"clé invalide" }, 400);
  const store = getStore({ name:"sauvegardes", consistency:"strong" });
  if(req.method === "GET"){
    const v = await store.get(k, { type:"json" });
    return v && richesse(v.donnees) >= PAUVRE ? json(v) : json({ erreur:"aucune sauvegarde" }, 404);
  }
  if(req.method === "PUT"){
    const brut = await req.text();
    if(brut.length > MAX) return json({ erreur:"trop volumineux" }, 413);
    let v; try{ v = JSON.parse(brut); }catch(e){ return json({ erreur:"JSON invalide" }, 400); }
    if(!v || typeof v.t !== "number" || typeof v.donnees !== "object" || !v.donnees) return json({ erreur:"format" }, 400);
    const actuel = await store.get(k, { type:"json" });
    const rA = actuel ? richesse(actuel.donnees) : 0, rV = richesse(v.donnees);
    if(actuel && rA >= PAUVRE && rV < rA / 2) return json(actuel, 409);   // on refuse d'écraser une vraie progression par une quasi vide
    const plusRiche = actuel && rA < PAUVRE && rV >= PAUVRE;               // l'ancienne était quasi vide : la vraie progression gagne
    if(actuel && actuel.t > v.t && !plusRiche) return json(actuel, 409);   // une version plus récente existe déjà
    const t = plusRiche ? Math.max(v.t, actuel.t + 1) : v.t;
    await store.setJSON(k, { t, donnees:v.donnees });
    return json({ t });
  }
  return json({ erreur:"méthode" }, 405);
};

export const config = { path:"/api/sauvegarde" };
