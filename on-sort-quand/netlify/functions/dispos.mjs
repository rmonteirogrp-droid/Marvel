// Dispos du groupe pour « On sort quand ? », une entrée par prénom (pas de compte).
// GET /api/dispos                          → [{ name, answers, updatedAt }]
// PUT /api/dispos  { name, answers }       → enregistre (remplace) les réponses de ce prénom
// DELETE /api/dispos?name=<prénom>  (en-tête x-admin-code = variable ADMIN_CODE de Netlify) → supprime ce prénom
import { getStore } from "@netlify/blobs";

const MAX_PERSONNES = 200;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers:{ "content-type":"application/json", "cache-control":"no-store" } });

// Vendredis et samedis du 13 oct. au 30 nov. 2026 (mêmes dates que la page).
const DATES = new Set();
for(let d = new Date(Date.UTC(2026, 9, 13)); d <= new Date(Date.UTC(2026, 10, 30)); d.setUTCDate(d.getUTCDate() + 1)){
  if(d.getUTCDay() === 5 || d.getUTCDay() === 6) DATES.add(d.toISOString().slice(0, 10));
}

const slugify = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export default async (req) => {
  const store = getStore({ name:"dispos", consistency:"strong" });

  if(req.method === "GET"){
    const { blobs } = await store.list();
    const tous = await Promise.all(blobs.map(b => store.get(b.key, { type:"json" })));
    return json(tous.filter(Boolean));
  }

  if(req.method === "PUT"){
    let v; try{ v = JSON.parse(await req.text()); }catch(e){ return json({ erreur:"JSON invalide" }, 400); }
    const name = typeof v?.name === "string" ? v.name.trim().replace(/\s+/g, " ") : "";
    const cle = slugify(name);
    if(name.length < 2 || name.length > 40 || !cle) return json({ erreur:"prénom invalide" }, 400);
    if(!v.answers || typeof v.answers !== "object") return json({ erreur:"réponses manquantes" }, 400);
    const answers = {};
    for(const [k, r] of Object.entries(v.answers)){
      if(DATES.has(k) && (r === "oui" || r === "non")) answers[k] = r;
    }
    const existe = await store.get(cle);
    if(!existe){
      const { blobs } = await store.list();
      if(blobs.length >= MAX_PERSONNES) return json({ erreur:"trop de participants" }, 429);
    }
    const entree = { name, answers, updatedAt:new Date().toISOString() };
    await store.setJSON(cle, entree);
    return json(entree);
  }

  if(req.method === "DELETE"){
    const code = process.env.ADMIN_CODE || "";
    if(!code || req.headers.get("x-admin-code") !== code) return json({ erreur:"code admin" }, 403);
    const cle = slugify(new URL(req.url).searchParams.get("name") || "");
    if(!cle) return json({ erreur:"prénom invalide" }, 400);
    await store.delete(cle);
    return json({ ok:true });
  }

  return json({ erreur:"méthode" }, 405);
};

export const config = { path:"/api/dispos" };
