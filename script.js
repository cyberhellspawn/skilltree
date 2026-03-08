/* ====== Datos iniciales: jugadores ====== */
const defaultPlayers = [
  { id: "mal", name: "Mal", avatar: "images/mal.png", points: 6, spent: 0, purchased: [] },
  { id: "lio", name: "Lío", avatar: "images/lio.png", points: 5, spent: 0, purchased: [] },
  { id: "pergo", name: "PERGO", avatar: "images/pergo.png", points: 7, spent: 0, purchased: [] }
];

let players = load("players") || defaultPlayers;
let selectedPlayerId = players[0].id;

/* ====== Topología del árbol ====== */
const skillTopology = {
  a1: { id: "a1", parents: [], unlocks: ["b1","b2"] },
  b1: { id: "b1", parents: ["a1"], unlocks: ["c1","c2"] },
  b2: { id: "b2", parents: ["a1"], unlocks: ["c2","c3"] },
  c1: { id: "c1", parents: ["b1"], unlocks: ["d1"] },
  c2: { id: "c2", parents: ["b1","b2"], unlocks: ["d1","d2"] },
  c3: { id: "c3", parents: ["b2"], unlocks: ["d2"] },
  d1: { id: "d1", parents: ["c1","c2"], unlocks: ["e1"] },
  d2: { id: "d2", parents: ["c2","c3"], unlocks: ["e1"] },
  e1: { id: "e1", parents: ["d1","d2"], unlocks: [] }
};

/* ====== Estado de categorías y skills ====== */
let categories = {
  gaothfamily: { people: [] },
  gaothcircus: { people: [] },
  dragons: { people: [] },
  firstorder: { people: [] }
};
let skillsMaster = {};

/* ====== CSV incrustado ====== */
const NPC_CSV = `categoria,nombre,ID,habilidad,tipo,descripcion,usos,ap,duracion,rango,descriptores,costos
famila gaoth,ALDERH GAOTH,a1,Favor del Patrón,Pasiva,Ganas un bono de +1...,—,—,—,—,Pasiva,0
famila gaoth,ALDERH GAOTH,b2,Sandalias de Viento,Activa,Gana +10 pies...,1/día,1 AP,1 minuto,Personal,Activa,450
... (pega aquí el resto de tu npc.csv completo) ...
`;

/* ====== Parseo del CSV incrustado ====== */
function parseNPC(text){
  const rows = text.split(/\r?\n/).map(r=>r.trim()).filter(Boolean);
  const header = rows.shift().split(",").map(h=>h.trim().toLowerCase());
  const charsMap = {};
  rows.forEach(r=>{
    const cols = r.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c=>c.replace(/^"|"$/g,"")) || r.split(",");
    const obj = {};
    header.forEach((h,i)=> obj[h] = (cols[i]||"").trim());

    const charName = obj["nombre"] || "Sin nombre";
    const category = (obj["categoria"] || "gaothfamily").trim().toLowerCase();
    const skillId = obj["id"] || "";
    const skillName = obj["habilidad"] || skillId;

    skillsMaster[skillId] = {
      id: skillId,
      name: skillName,
      cost: Number(obj["costos"] || 1),
      uses: obj["usos"] || "",
      duration: obj["duracion"] || "",
      range: obj["rango"] || "",
      desc: obj["descripcion"] || "—"
    };

    const key = category + ":" + charName;
    if(!charsMap[key]){
      charsMap[key] = {
        category,
        character: charName,
        character_id: charName.toLowerCase().replace(/\s+/g,"_"),
        avatar: "",
        skills: []
      };
    }
    charsMap[key].skills.push(skillId);
  });

  Object.values(charsMap).forEach(char=>{
    if(!categories[char.category]) categories[char.category] = { people: [] };
    categories[char.category].people.push(char);
  });
}

/* ====== Inicialización ====== */
renderPlayers();
selectPlayer(selectedPlayerId);
attachCategoryButtons();
renderEmptySkillNodes();

// Cargar NPC incrustados
parseNPC(NPC_CSV);
renderCharactersList("gaothfamily");