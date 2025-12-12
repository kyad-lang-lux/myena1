const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(bodyParser.json());

// -----------------------------
// DATABASE (Neon PostgreSQL)
// -----------------------------
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_s0KVZgqcST1t@ep-wild-wildflower-aga3atix-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

pool.connect()
  .then(() => console.log("Connecté à Neon !"))
  .catch(err => console.error("Erreur de connexion :", err));

// -----------------------------
// CONNEXION PAR IDENTIFIANT
// -----------------------------
app.post("/api/connexion", async (req, res) => {
  const { identifiant } = req.body;
  if (!identifiant) return res.json({ success: false, message: "Identifiant requis !" });

  try {
    // Lecture du fichier identifiant.txt
    const listeIdentifiants = fs.readFileSync("identifiants.txt", "utf-8")
      .split("\n")
      .map(id => id.trim());

    if (listeIdentifiants.includes(identifiant)) {
      return res.json({ success: true, message: "Connexion réussie !", pseudo: identifiant });
    } else {
      return res.json({ success: false, message: "Identifiant non autorisé !" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// ADMIN CREATE POST
// -----------------------------
app.post("/api/admin/create-post", async (req, res) => {
  const { identifiant, filiere, post } = req.body;

  if (identifiant !== "ENAUAC") return res.json({ success: false, message: "Accès refusé !" });
  if (!filiere || !post) return res.json({ success: false, message: "Tous les champs sont obligatoires !" });

  try {
    await pool.query("INSERT INTO posts (filiere, post) VALUES ($1, $2)", [filiere, post]);
    res.json({ success: true, message: "Publication ajoutée !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// GET POSTS
// -----------------------------
app.get("/api/posts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM posts ORDER BY date DESC");
    res.json({ success: true, posts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// ADMIN DELETE POST
// -----------------------------
app.post("/api/admin/delete-post", async (req, res) => {
  const { identifiant, id } = req.body;
  if (identifiant !== "ENAUAC") return res.json({ success: false, message: "Accès refusé !" });

  try {
    await pool.query("DELETE FROM posts WHERE id = $1", [id]);
    res.json({ success: true, message: "Post supprimé !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend lancé sur http://localhost:${port}`);
});
