# Worker « Aube » — l’assistante du site de la CCBA

Petit service Cloudflare qui relaie les questions des usagers vers un modèle Google Gemini.

**Chaque visiteur apporte sa propre clé API Gemini** (gratuite, obtenue en quelques secondes sur
[aistudio.google.com/apikey](https://aistudio.google.com/apikey)) : Aube la demande directement
dans la fenêtre de discussion avant la première question. Elle est gardée uniquement dans le
navigateur du visiteur (`localStorage`) et transmise au Worker dans l’en-tête `X-Gemini-Key` à
chaque question. **Le Worker ne la stocke ni ne la journalise nulle part** : il ne fait que la
relayer à Google pour la durée de la requête, avec la base de connaissances du site injectée dans
le prompt système. Il n’y a donc rien à payer ni à quototer côté CCBA — ce n’est pas la CCBA qui
choisit ce fonctionnement pour économiser, c’est simplement que personne n’a à gérer ni protéger
une clé partagée.

Le Worker télécharge la base de connaissances du site (`assets/data/kb.txt`, régénérée à chaque
mise en ligne), la garde en cache une heure et la place dans le prompt système. **Le contenu du
chatbot suit donc le site sans redéploiement du Worker.**

## Déploiement (une fois, depuis votre poste)

Il faut Node.js. Dans le dossier `worker/` :

```bash
npx wrangler login   # ouvre votre navigateur, connecte votre compte Cloudflare
npx wrangler deploy  # affiche l'adresse : https://ccba-assistant.<vous>.workers.dev
```

Pas de `wrangler secret put` nécessaire : aucune clé n’est stockée sur le Worker par défaut.

Puis indiquez cette adresse au site : ouvrez `assets/data/bot.json` dans le dépôt GitHub,
remplacez `"api": ""` par `"api": "https://ccba-assistant.<vous>.workers.dev"` et enregistrez.
Le bouton « Poser une question » apparaît alors en bas à droite de chaque page.
(Si le fichier est régénéré, la valeur se règle dans `data/bot_url.txt` du générateur.)

## Vérifier

```bash
curl https://ccba-assistant.<vous>.workers.dev/health                      # base chargée ?
curl -H "X-Gemini-Key: VOTRE_CLE" https://ccba-assistant.<vous>.workers.dev/models
```

`/health` indique le modèle réellement utilisé. Si le nom écrit dans `wrangler.toml` n’existe pas,
le Worker essaie automatiquement les modèles voisins (3.x flash-lite, flash, puis 2.5, puis 2.0) :
regardez `/models` (avec une clé) et recopiez dans `MODEL` le nom exact que vous préférez.

## Réglages (`wrangler.toml`)

| Réglage | Rôle |
|---|---|
| `MODEL` | modèle préféré ; repli automatique si le nom n’existe pas |
| `KB_URL` | adresse de la base de connaissances |
| `ALLOWED_ORIGINS` | sites autorisés à appeler le Worker (le reste reçoit 403) |
| `MAX_PER_HOUR` | questions par adresse IP et par heure (défaut : 40) |
| `GEMINI_KEY` | **secret optionnel**, repli serveur si un visiteur n’apporte pas de clé (absent par défaut ; `wrangler secret put GEMINI_KEY` si vous en voulez un) |

## Limites connues (c’est une maquette)

- **Chaque visiteur doit avoir un compte Google** pour obtenir sa clé Gemini. C’est le prix de ne
  rien faire payer ni gérer à la CCBA, mais ça exclut les usagers qui ne veulent ou ne peuvent pas
  en créer un — pensez à garder les parcours du site utilisables sans le chatbot.
- **Coût et quota** : tout le contenu du site (~83 000 jetons) est envoyé à chaque question, sur
  le quota gratuit de la clé du visiteur. Simple et fiable, mais un visiteur qui pose beaucoup de
  questions peut atteindre la limite gratuite de sa propre clé.
- **Limitation de débit approximative** : elle est comptée en mémoire, par isolat Cloudflare.
  Pour un usage réel, passer par Durable Objects ou le Rate Limiting de Cloudflare.
- **Pas de journal** : aucune question, ni aucune clé, n’est enregistrée. Pour améliorer le
  service, il faudrait journaliser les questions (avec information des usagers et purge
  automatique) — jamais les clés.
- **Réponses génératives** : malgré les consignes, une erreur reste possible. Le bandeau sous la
  conversation le dit et renvoie vers la CCBA.

## Tests

`node test.mjs` — vérifie le routage, les origines, la limitation de débit, le repli de modèle,
la clé manquante ou invalide (401) et la transformation du flux, avec Google simulé (aucun appel
réseau, aucune vraie clé nécessaire).
