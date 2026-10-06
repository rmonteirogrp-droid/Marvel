// Sauvegarde en ligne des profils (coches, notes, cartes, records), une entrée par identifiant.
// La clé est une empreinte dérivée de l'identifiant (jamais l'identifiant lui-même, jamais une valeur présente dans l'app).
// GET  /api/sauvegarde?k=<clé>          → { t, donnees } ou 404
// PUT  /api/sauvegarde?k=<clé>  { t, donnees } → enregistre si plus récent que l'existant (sinon renvoie l'existant, 409)
import { getStore } from "@netlify/blobs";

const MAX = 3 * 1024 * 1024;   // 3 Mo par compte, très large
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers:{ "content-type":"application/json", "cache-control":"no-store" } });

export default async (req) => {
  const k = new URL(req.url).searchParams.get("k") || "";
  if(!/^[0-9a-f]{64}$/.test(k)) return json({ erreur:"clé invalide" }, 400);
  const store = getStore({ name:"sauvegardes", consistency:"strong" });
  if(req.method === "GET"){
    const v = await store.get(k, { type:"json" });
    return v ? json(v) : json({ erreur:"aucune sauvegarde" }, 404);
  }
  if(req.method === "PUT"){
    const brut = await req.text();
    if(brut.length > MAX) return json({ erreur:"trop volumineux" }, 413);
    let v; try{ v = JSON.parse(brut); }catch(e){ return json({ erreur:"JSON invalide" }, 400); }
    if(!v || typeof v.t !== "number" || typeof v.donnees !== "object" || !v.donnees) return json({ erreur:"format" }, 400);
    const actuel = await store.get(k, { type:"json" });
    if(actuel && actuel.t > v.t) return json(actuel, 409);   // une version plus récente existe déjà
    await store.setJSON(k, { t:v.t, donnees:v.donnees });
    return json({ t:v.t });
  }
  return json({ erreur:"méthode" }, 405);
};

export const config = { path:"/api/sauvegarde" };
