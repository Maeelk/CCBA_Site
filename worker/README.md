# Worker « Aube » — l’assistante du site de la CCBA

Petit service Cloudflare qui relaie les questions des usagers vers un modèle Google Gemini.
Il existe pour une seule raison : **la clé API ne doit jamais se trouver dans le navigateur.**
Elle est stockée comme secret Cloudflare ; le site n’appelle que ce Worker.

Le Worker télécharge la base de connaissances du site (`assets/data/kb.txt`, régénérée à chaque
mise en ligne), la garde en cache une heure et la place dans le prompt système. **Le contenu du
chatbot suit donc le site sans redéploiement du Worker.**

## Déploiement (une fois, depuis votre poste)

Il faut Node.js. Dans le dossier `worker/` :

```bash
npx wrangler login                 # ouvre votre navigateur, connecte votre compte Cloudflare
npx wrangler secret put GEMINI_KEY # colle la clé Google AI Studio, puis Entrée
npx wrangler deploy                # affiche l'adresse : https://ccba-assistant.<vous>.workers.dev
```

Puis indiquez cette adresse au site : ouvrez `assets/data/bot.json` dans le dépôt GitHub,
remplacez `"api": ""` par `"api": "https://ccba-assistant.<vous>.workers.dev"` et enregistrez.
Le bouton « Poser une question » apparaît alors en bas à droite de chaque page.
(Si le fichier est régénéré, la valeur se règle dans `data/bot_url.txt` du générateur.)

## Vérifier

```bash
curl https://ccba-assistant.<vous>.workers.dev/health   # clé configurée ? base chargée ?
curl https://ccba-assistant.<vous>.workers.dev/models   # modèles offerts par la clé
```

`/health` indique le modèle réellement utilisé. Si le nom écrit dans `wrangler.toml` n’existe pas,
le Worker essaie automatiquement les modèles voisins (3.x flash-lite, flash, puis 2.5, puis 2.0) :
regardez `/models` et recopiez dans `MODEL` le nom exact que vous préférez.

## Réglages (`wrangler.toml`)

| Réglage | Rôle |
|---|---|
| `MODEL` | modèle préféré ; repli automatique si le nom n’existe pas |
| `KB_URL` | adresse de la base de connaissances |
| `ALLOWED_ORIGINS` | sites autorisés à appeler le Worker (le reste reçoit 403) |
| `MAX_PER_HOUR` | questions par adresse IP et par heure (défaut : 40) |
| `GEMINI_KEY` | **secret**, jamais dans ce dépôt |

## Limites connues (c’est une maquette)

- **Coût et quota** : tout le contenu du site (~83 000 jetons) est envoyé à chaque question.
  C’est simple et fiable, mais inadapté à un trafic réel : en production, il faudrait n’envoyer
  que les pages utiles à la question (recherche puis injection), ou utiliser le cache de contexte.
- **Limitation de débit approximative** : elle est comptée en mémoire, par isolat Cloudflare.
  Pour un usage réel, passer par Durable Objects ou le Rate Limiting de Cloudflare.
- **Pas de journal** : aucune question n’est enregistrée. Pour améliorer le service, il faudrait
  journaliser (avec information des usagers et purge automatique).
- **Réponses génératives** : malgré les consignes, une erreur reste possible. Le bandeau sous la
  conversation le dit et renvoie vers la CCBA.

## Tests

`node test.mjs` — vérifie le routage, les origines, la limitation de débit, le repli de modèle
et la transformation du flux, avec Google simulé (aucun appel réseau, aucune clé nécessaire).
