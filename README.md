# Site de la Communauté de Communes du Bassin d’Aubenas — prototype statique

Prototype de refonte du site conforme au **dossier de cadrage du 24 septembre 2026**, généré à partir de l’export WordPress (WXR), de la matrice de migration et du code source de l’accueil. Site 100 % statique, prêt pour **GitHub Pages**.

## Mise en ligne sur GitHub Pages

1. Créer un dépôt (ex. `ccba-site`) et y déposer **le contenu de ce dossier** (le fichier `index.html` doit être à la racine du dépôt).
2. *Settings → Pages → Build and deployment* : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Le site est servi à l’adresse `https://<compte>.github.io/ccba-site/`.

Tous les liens sont **relatifs** : le site fonctionne aussi bien sous un sous-chemin GitHub Pages que sur un domaine propre (fichier `CNAME` à ajouter le moment venu). Le fichier `.nojekyll` désactive le traitement Jekyll. La page `404.html` détecte automatiquement le sous-chemin du dépôt.

> Pour tester en local, lancer `python3 -m http.server` dans le dossier puis ouvrir `http://localhost:8000/` (l’ouverture directe des fichiers en `file://` ne suit pas les URL « propres »).

## Ce qui est appliqué du cadrage

| Exigence du cadrage | Mise en œuvre |
|---|---|
| 7 rubriques, 3 niveaux visibles max. | Méga-menu construit sur les **83 nœuds** de la simulation resserrée (7 / 33 / 43) ; les pages « hub » supplémentaires sont accessibles depuis leur rubrique, pas depuis le menu. |
| Emplacement principal unique | Chaque contenu WordPress a une seule URL ; les 12 doublons sont fusionnés, les accès secondaires sont des liens contextuels (« Voir aussi »). |
| Suppression d’« Accès direct », « Accueil », « Grands projets », « Administration », « Pour aller plus loin » | Supprimés ; contenus redistribués selon la matrice. Le logo renvoie à l’accueil. |
| Barre utilitaire | Actualités · Agenda · Contact · Recherche (+ Facebook). |
| Bloc d’accès rapides | Collecte des déchets, Urbanisme, France Services, Marchés publics, Nos 28 communes, Contact. |
| Page-hub « Nos 28 communes » | Carte **SVG** issue des hotspots `da_image` n°1487 (viewBox 221 × 375), liste alphabétique complète, recherche instantanée, sélecteur. Accessible au clavier, libellés explicites, focus visible. |
| Anomalies de la carte | Hotspot vide de Saint-Julien-du-Serre écarté, libellé « Saint-Andéols » corrigé, Ucel présent, URL de Vallées-d’Antraigues-Asperjoc corrigée, accents rétablis. |
| Délibérations filtrables | 78 documents 2018-2025 dans une collection filtrable (année, type, mot-clé) + intégration Publiact pour 2026. |
| Actualités allégées | 5 actualités sur l’accueil (contre 269 dans le DOM actuel), archives paginées par 12. |
| Préserver les URL | `redirections-301.csv` (978 correspondances) **et** pages de redirection générées aux anciennes adresses (GitHub Pages ne gère pas les 301 serveur). |
| Contenus non publiés | Les 3 brouillons ne sont pas repris ; le raccourci « Collecte des déchets » pointe vers « Jours de collecte », la page « Auto-réhabilitation accompagnée » est retirée en attendant arbitrage. |
| Accessibilité | Lien d’évitement, menus en boutons `aria-expanded`, fil d’Ariane, contrastes AA (le rouge pêche n’est utilisé en texte que dans sa variante foncée), `prefers-reduced-motion` respecté, vidéo avec bouton pause. |

## Direction artistique (version 3.1)

- **Papier clair, couleur en accents** : fond presque blanc, trame de points fixe et discrète ; rouge pêche réservé au soleil et aux repères, cassis pour les titres et boutons.
- **Soleil réel** : sur l’accueil, le disque rouge pêche est placé à la position réelle du soleil au-dessus d’Aubenas à l’heure de la visite (lever à gauche, coucher à droite, sous la crête la nuit), avec les heures de lever et de coucher du jour. Calcul astronomique dans le navigateur, sans dépendance.
- **Film du territoire en boucle** dans un bandeau panoramique découpé par une ligne de crête, bouton pause/lecture.
- **Territoire en trame de points** (`assets/img/territoire-points.svg`) dans les en-têtes de page : un point par maille, taille selon l’altitude du relief (données IGN, voir « Carte en relief réel »), Aubenas signalée en rouge pêche.
- **France Services, ouvert aujourd’hui ?** (page France Services) : les 5 guichets sur la carte en points, **épinglés à leur adresse réelle** (géocodage IGN), état d’ouverture en direct, frise horaire 8h–18h, jours cliquables pour consulter les horaires d’un autre jour, adresse et téléphone. Sur l’accueil, le bouton France Services de la barre d’accès rapides indique en direct le nombre de guichets ouverts ou l’heure de réouverture. Horaires saisis dans `site.py` (constante `FS`) : à tenir à jour. Ce composant (`hours_list()` dans `site.py`) est générique : il est réutilisé tel quel, avec sa propre frise horaire (adaptée à l’amplitude du lieu), sur la piscine, la médiathèque et l’accueil du siège — voir « Horaires complétés » ci-dessous.
- **Visuels génératifs** (`cover.py`) : chaque contenu sans image reçoit une composition géométrique unique (tuiles, cercles, rayures) aux couleurs de la charte, calculée à partir de son titre. Elle sert aussi de repli si une photo distante ne se charge pas.
- **Accueil resserré** (version 3.17) : plus de grand titre ni de phrase d’accueil — le nom du territoire est porté par le logo, et le titre de la page reste dans le code pour les lecteurs d’écran et les moteurs de recherche. Le haut de page tient en deux colonnes (« Ma commune » et l’état de l’accueil à gauche, la recherche à droite), puis vient le film : son bandeau prend les proportions du film (1920 × 500) et, si la fenêtre est trop basse, la hauteur restante sous l’en-tête, de sorte que **le film est visible en entier dès l’ouverture de la page** (`site.js` mesure le bloc du haut et transmet sa hauteur à la feuille de style). Les accès rapides passent sous le film au lieu de le recouvrir ; le soleil garde sa position réelle sans déborder sur le bloc du haut. Les actualités (la une à gauche, quatre brèves en lignes à droite) occupent environ un quart de hauteur en moins.
- **En-têtes des pages intérieures bas** (version 3.18) : fil d’Ariane, titre et chapeau éventuel sur 130 à 230 px au lieu de 450 à 520 ; le surtitre, qui répétait le fil d’Ariane, n’est plus affiché ; la carte en points devient un petit repère, la photo une vignette panoramique. Le contenu de la page commence dès l’ouverture.
- **Barre d’accès rapides** sous le film : collecte, urbanisme, France Services, marchés publics, communes, contact.
- **Les 7 orientations du projet de territoire** en frise : sept pastilles dans le style du splash (codées en SVG dans `pictos.py`, aucune image ; voir « Pastilles »), titres à l’horizontale, et le texte complet de l’orientation choisie dessous (la hauteur ne bouge pas quand on en change) ; accordéon sur tablette et mobile ; navigation au clavier par les flèches. Chaque emblème se dessine à l’apparition puis joue brièvement quand on le choisit ; il s’anime tant qu’on le survole. Rien ne tourne en continu sans action de l’usager, et tout est figé si l’usager réduit les animations.
- **Territoire** : chiffres clés (28 communes, habitants, 75 élus) et **fiche express** de la commune survolée ou parcourue au clavier sur la carte (population, part du bassin, maire, lien vers la fiche). La fiche, la commune mise en évidence sur la carte et le menu « Choisir une commune » restent synchronisés : choisir une commune dans le menu met à jour la fiche et la carte. Si l’usager a choisi « Ma commune » (encadré de l’accueil), c’est sa commune qui est affichée par défaut dans la fiche et sur la carte, et elles suivent quand il en change. Sur les fiches communes, le menu « Voir une autre commune » ouvre directement la commune choisie (au clavier, les flèches parcourent la liste et Entrée ouvre la fiche).
- Page rythmée : en-têtes de section compacts, bande légèrement teintée pour les orientations, actualités en magazine, agenda à grands chiffres, domaines d’action en index compact sur deux colonnes (un pictogramme au trait par domaine, sous-rubriques cliquables, entrée « Laissez-vous guider » vers les parcours « Je veux… ») — une simple liste sur téléphone.

### Sobriété

- Aucune animation continue : seules des apparitions ponctuelles (titres, tracé des crêtes) ; tout est désactivé si l’usager réduit les animations.
- Film : lecture automatique uniquement sur écran large, hors mode économie de données ; pause hors écran et onglet masqué.
- **À prévoir** : le clip pèse 46 Mo (1920 × 500). Une version compressée (≈ 5 Mo) déposée dans `assets/video/` et référencée dans `site.py` (constante `VIDEO`) allégerait la page.

## Fonctionnalités de service (version 3.7)

- **Ma commune** (accueil et page « Jours de collecte ») : l’usager choisit sa commune une fois ; le choix est mémorisé **sur son appareil uniquement** (stockage local du navigateur, aucun compte, aucun suivi). Le site affiche alors les **prochaines collectes** (ordures ménagères, emballages recyclables) avec leur date réelle, en tenant compte des semaines paires / impaires (numéro de semaine ISO), le **guichet France Services le plus proche** (à vol d’oiseau depuis la mairie de la commune) avec son état d’ouverture en direct, et propose d’**ajouter les collectes à son agenda** (fichier .ics récurrent, rappel la veille à 19h pour sortir les bacs). Sur la page des jours de collecte, la ligne de la commune est surlignée. Le choix est relu au retour arrière (page restaurée par le navigateur) et quand il change dans un autre onglet : l’encadré n’affiche jamais une ancienne commune. Données extraites automatiquement du tableau de la page « Jours de collecte » : Aubenas, Mézilhac et Vals-les-Bains n’y figurent pas (renvoi vers la page).
- **Recherche instantanée** (tolérante aux fautes et aux synonymes depuis la version 3.12) : suggestions pendant la frappe (liste accessible au clavier, flèches + Entrée), lien « Tous les résultats » ; touche **/** pour rechercher depuis n’importe quelle page.
- **Événements** : « Ajouter à mon agenda » (.ics) et « Partager » (partage natif du téléphone, sinon copie du lien) ; « Partager » aussi sur les actualités.
- **Écouter la page** : lecture à voix haute des pages longues par la synthèse vocale du navigateur, paragraphe par paragraphe, avec surlignage du passage lu ; pause, reprise, arrêt. Message explicite si l’appareil ne dispose pas de voix française.
- **Horaires complétés** : le composant « ouvert aujourd’hui ? » de France Services (jours cliquables, frise en direct) a été généralisé (`hours_list()` dans `site.py`) et posé sur les équipements qui n’avaient pas encore leurs horaires :
  - **Centre Aquatique l’Hippocampe** : horaires grand public en période scolaire (source : `lhippocampe-aqua.fr` et annuaires spécialisés, recoupés) ; une remarque signale que les horaires changent pendant les vacances scolaires et l’été.
  - **Médiathèque Intercommunale Jean Ferrat** : horaires actuels (mar.–sam.), avec fermeture le lundi, le dimanche et les jours fériés (source : `mediatheque.bassin-aubenas.fr`).
  - **Accueil du siège de la CCBA** (page « Organisation et pôles » et page Contact) : horaires officiels du lundi au vendredi, 9h–12h et 14h–17h30 (la valeur précédente, 8h30, était erronée et a été corrigée partout — accueil, en-tête et page Contact). Les autres pôles (technique, aménagement) n’ont pas d’horaires de guichet publiés : leurs adresses restent en simple texte.
  - Ces trois lieux n’ayant qu’une seule adresse, le composant s’affiche sans la carte en points (variante à une seule ligne, sans numéro de guichet).

## Back-office : actualités et agenda (version 3.20, Pages CMS)

GitHub Pages ne sert que des fichiers : il n’y a ni serveur ni base de données. Le back-office est donc un outil qui **écrit dans le dépôt** : [Pages CMS](https://app.pagescms.org) (gratuit, connexion avec un compte GitHub ayant accès au dépôt).

- **Configuration** : `.pages.yml` à la racine du dépôt (source : `cms/pages.yml` du générateur). Deux formulaires, **Actualités** et **Agenda**, et un dossier d’images.
- **Où vont les contenus** : `contenu/actualites.json`, `contenu/agenda.json` et `contenu/medias/`, **dans le dépôt publié uniquement**. Le générateur ne les crée ni ne les écrase jamais ; avant toute mise en ligne du générateur, récupérer le dépôt (`git pull`) pour ne pas perdre ce que les rédacteurs ont saisi.
- **Affichage** : à chaque enregistrement, GitHub Pages republie le site (une à deux minutes). Le script « Back-office » à la fin de `assets/js/site.js` lit les deux fichiers et complète les éléments marqués `data-cms` : actualités de l’accueil et de la page Actualités (mêlées aux existantes, par date), rendez-vous à venir de l’accueil et de la page Agenda, pages de lecture `actualites/lire/?a=…` et `agenda/voir/?e=…`. Aube lit aussi ces contenus.
- **Règles** : « Publié » décoché = brouillon, invisible ; une actualité datée dans le futur n’apparaît qu’à cette date (publication programmée) ; un rendez-vous disparaît de l’agenda le lendemain de sa fin. Le texte riche est nettoyé à l’affichage (balises et attributs autorisés seulement).
- **Limites** : les actualités et rendez-vous historiques (repris de l’ancien site) ne sont pas modifiables dans le back-office ; les contenus saisis ne sont pas dans la recherche du site ni dans ses pages statiques (ils sont affichés par JavaScript) ; chaque rédacteur doit avoir un compte GitHub ; pas de circuit de validation.

## Pastilles : les pictogrammes dans le style du splash (version 3.21)

Les pictogrammes des accès rapides sous le film, de l’index « Nos domaines d’action », de la frise des sept orientations, de la page « Je veux… » et de la fenêtre d’Aube forment une seule famille, dessinée en code dans `pictos.py` (aucune image) et calquée sur les pictogrammes de l’écran d’accueil :

- **Le dessin** : une pastille blanche cerclée de rouge pêche ; dedans, un tracé au trait épais à bouts ronds (la plume du logo), cassis avec une seule partie en rouge pêche. Grille unique de 48 × 48, le dessin occupe 65 % du diamètre comme sur le splash. Trois dessins (habiter, respirer, se cultiver) et l’emblème « Économie » sont repris tels quels du splash.
- **Le mouvement** (bloc « Pastilles » de `site.css`, tout en CSS) : à l’apparition, le disque éclot et la plume écrit le dessin ; **au survol ou au focus, en boucle**, la plume retrace le dessin (une courte interruption du trait le parcourt, il ne disparaît jamais) et deux ondes partent du disque ; au repos, rien ne bouge. Animations réduites : dessin fixe.
- **Favicon** : le logo de la CCBA sur un carré blanc (`assets/img/favicon.svg`, `favicon-48.png` pour les navigateurs sans SVG, `apple-touch-icon.png` pour l’écran d’accueil des téléphones). Le logo est un mot-symbole large : à la taille d’un onglet (16 à 32 px), on reconnaît ses couleurs et sa silhouette, pas ses lettres.

## Mouvement : le vocabulaire du splash sur toutes les pages (version 3.19)

Toutes les animations des pages reprennent les gestes de l’écran d’accueil « Un trait de lumière » : même courbe (`--ease-out`, `cubic-bezier(.16,1,.3,1)`), mêmes durées, tout à plat (les bascules et inclinaisons 3D de la version 3.10 sont supprimées). Sans bibliothèque ni image ; le bloc « v3.19 — Mouvement » de `site.css` et les sections « Apparition au défilement » et « L’onde » de `site.js`.

- **Titres mot à mot** : le titre de chaque page, les titres de section et la grande phrase du pied de page montent mot par mot derrière un masque, comme « Le jour se lève ». Le titre de page est découpé à la génération (`split_words` dans `pages.py`, aucun JavaScript nécessaire) ; les autres le sont par `site.js`. Le texte complet reste dans `aria-label` : les lecteurs d’écran lisent le titre d’un seul tenant.
- **Le trait** : le filet de chaque section se trace de gauche à droite avec une pointe rouge pêche ; même geste pour les filets des cartes de rubrique et des rendez-vous, pour le bas du méga-menu et, à l’ouverture de chaque page, le long du bas de l’en-tête.
- **La découpe à 45°** (la diagonale du logo) : **le passage d’une page à l’autre** se fait par cette découpe, bordée d’un trait rouge pêche (View Transitions, navigateurs compatibles ; ailleurs, changement de page ordinaire). Les photos, elles, ne sont plus animées : la découpe image par image ralentissait l’affichage.
- **L’onde** : un anneau rouge pêche part du point touché à chaque clic sur un lien ou un bouton ; la pastille « ouvert » émet une onde ; le soleil de l’accueil en émet deux en se levant ; sur la carte en relief, **l’onde part d’Aubenas et allume les 28 communes une à une**, à vitesse constante — la séquence centrale du splash.
- **Montée à plat** : blocs, colonnes du méga-menu, rubriques du tiroir mobile, accès rapides de l’accueil et cartes de « Je veux… » montent de 16 px en cascade. Le méga-menu se déroule depuis l’en-tête ; le tiroir mobile glisse à plat.
- **Survol** : plus d’inclinaison ; un plateau clair se glisse sous la carte, une lueur rouge pêche suit le pointeur, le filet se retrace en rouge pêche.
- **Aube** : la fenêtre s’ouvre en cercle depuis le bouton, comme la révélation finale du splash ; les messages montent.
- **Cartes** : la carte en relief et la carte France Services gardent leur perspective (ce sont des graphiques, pas des effets) ; les paliers montent sans rebond, les épingles se posent avec une onde au sol.
- **Sobriété et accessibilité** : rien ne joue si l’usager demande de réduire les animations ; sans JavaScript tout est visible d’emblée ; si `site.js` n’arrive pas (réseau), la page retire la classe `js` au bout de 5 s et tout s’affiche ; à l’impression, tout est visible.

## Carte en relief réel (version 3.11)

La carte des 28 communes (accueil, page « Nos 28 communes », encart « Situer… » des 28 fiches communes) montre désormais la **géographie réelle, simplifiée**, du Bassin d’Aubenas, à la manière d’une maquette en carton découpée en courbes de niveau :

- **Données** : altitudes IGN **RGE ALTI®** (service d’altimétrie de la Géoplateforme, licence ouverte Etalab 2.0, mention « IGN – RGE ALTI® » affichée sous chaque carte), relevées une fois sur une grille de 48 × 36 points (≈ 720 m × 540 m) et enregistrées dans `data/dem/`. Calage : `data/communes_geo.csv` contient le point de référence de chaque commune renvoyé par le géocodeur IGN (ce n’est **pas** la mairie : il en est à 0,1–2 km) ; il sert à caler la carte des communes du site d’origine sur le terrain (affinité par moindres carrés, écart moyen ≈ 0,6 km).
- **Rendu** (`terrain.py`, appelé au build par `python3 site.py`) : le terrain est rééchantillonné et lissé, puis découpé en **une courbe de niveau tous les 100 m** (de moins de 200 m au sud à plus de 1 300 m au nord ; courbes maîtresses à 500 et 1 000 m) ; chaque palier est un aplat teinté (du crème au marron glacé puis au cassis) découpé à la silhouette du territoire, posé sur un socle, avec les ondes du territoire au sol. Même projection axonométrique que le reste du site (azimut −14°, inclinaison 44°), **hauteurs exagérées ×2,8** pour que les vallées se lisent. Tout est en SVG calculé au build : aucune bibliothèque, aucune image, aucun appel réseau dans le navigateur.
- **Communes** : les 28 contours sont drapés sur les paliers (ils montent et descendent avec le terrain) et restent de vrais liens : clavier, lecteur d’écran, infobulle, fiche express de l’accueil, liaison avec la liste alphabétique. Au survol ou au focus, la commune s’éclaire en rouge pêche et se soulève légèrement ; sur une fiche commune, elle est teintée en cassis.
- **Mairies et épingles à leur position réelle** : `data/mairies.csv` donne l’emplacement des 28 mairies (objets « mairie » de la BD TOPO® IGN, via le géocodeur). Chaque mairie est un point sur la carte ; l’épingle d’Aubenas est posée sur la mairie d’Aubenas, et sur une fiche commune une épingle cassis marque la mairie de la commune. Contrôle du calage : les 28 mairies tombent toutes à l’intérieur de leur commune sur la carte (`python3 terrain.py formes.json sortie.svg` l’affiche ; marge la plus faible : Saint-Sernin, ≈ 90 m du bord). Les mêmes positions servent à l’intro animée (l’étincelle de chaque commune part de sa mairie) et à la vignette des en-têtes (Aubenas).
- **Animation** : la carte apparaît à plat (carte hypsométrique), puis les paliers s’élèvent l’un après l’autre ; puis une onde part d’Aubenas et allume les communes une à une (version 3.19). Légère inclinaison sous le pointeur. Si l’usager demande de réduire les animations, la carte est directement en relief, sans mouvement.
- **Légende** : échelle des altitudes par tranches de 100 m, sous les cartes de l’accueil et de la page « Nos 28 communes ». La coloration par population de la page « Nos 28 communes » a été retirée : les chiffres de population restent dans la liste des communes et dans la fiche express.
- **Réglages** (en tête de `terrain.py`) : exagération `EX`, équidistance `LEVELS`, teintes `STOPS`, projection `AZ`/`TI`. Mettre à jour les altitudes : relancer la collecte IGN (service `elevationLine`, une requête par ligne de la grille) et remplacer `data/dem/dem.npy`.

## Assistante « Aube » — chatbot (version 3.14, maquette)

Un bouton en bas à droite de chaque page ouvre **Aube**, une assistante qui répond aux questions des usagers à partir du contenu du site. Emblème dessiné en code : la ligne de crête du territoire dans un disque (le motif de l’accueil — le film découpé par la crête et ses deux tracés — et de l’icône du site), sans visage. La crête se trace à l’arrivée ; les plans du relief glissent au survol ; les deux tracés respirent pendant qu’Aube cherche, puis le tracé blanc devient une onde qui file pendant qu’elle répond.

### Le guide d’abord, l’IA sur demande (version 3.22)
Pour **économiser les jetons**, la fenêtre d’Aube ne sollicite plus le modèle de langage par défaut :
- **À l’ouverture, le guide** : Aube propose les quatre thèmes de « Je veux… » sous forme de choix à cliquer, puis les besoins, puis les questions du parcours ; en deux ou trois choix, elle affiche la fiche préparée par les services (l’essentiel, les étapes, le contact, les pages à consulter). Aucune IA, aucun appel extérieur, aucune clé : les parcours sont lus dans `assets/data/jeveux.json`, produit par `jeveux.py` à partir de `data/jeveux.json` — les mêmes contenus que la page « Je veux… ». « Étape précédente » et « Recommencer » sont proposés à chaque étape ; le parcours est retrouvé en changeant de page (mémoire de l’onglet).
- **Sous les choix, un bouton « Poser ma question à Aube »** ouvre la discussion libre. C’est seulement là que la clé Gemini est demandée et que le modèle est appelé. Le parcours déjà suivi est joint à la première question (une ligne de contexte), pour une réponse plus courte et plus juste. « Revenir au guide » ramène aux choix ; la corbeille efface tout.
- Les liens « Poser la question à Aube » du site (page « Je veux… », recherche sans résultat) ouvrent directement la discussion libre, puisque c’est ce qu’ils annoncent.
- Coût : une question en discussion libre envoie toujours la base de connaissances (≈ 35 000 jetons) ; un parcours guidé n’en consomme aucun.

### Comment ça marche (discussion libre)
1. **Base de connaissances** (`kb.py` → `assets/data/kb.txt`, ≈ 140 Ko / 35 000 jetons, version condensée : ~450 caractères par page + coordonnées, horaires et tarifs conservés) : régénérée à chaque mise en ligne. Elle contient l’arborescence, le texte de 148 pages de contenu, les horaires en clair, les 28 communes (population, maire, altitude, jours de collecte, guichet France Services le plus proche), les 64 réponses vérifiées de « Je veux… », les annonces de la bourse, les actualités et l’agenda récents.
2. **Appel du modèle** : par défaut, le navigateur interroge directement Google Gemini avec **la clé du visiteur** (gratuite, demandée dans la fenêtre au moment d’ouvrir la discussion libre, gardée dans son navigateur). En option, un **Worker Cloudflare** (`worker/`) peut servir de relais : son adresse se règle dans `assets/data/bot.json`.
3. **Interface** (`assets/js/chatbot.js`) : bouton, panneau, réponse qui s’écrit au fil de l’eau, questions suggérées, conversation gardée le temps de l’onglet (rien n’est envoyé ailleurs, rien n’est enregistré).

### Garde-fous
- Le modèle ne répond **qu’avec la base de connaissances** et doit citer les pages utilisées (affichées en pastilles cliquables sous la réponse). Il doit dire qu’il ne sait pas plutôt que d’inventer, et renvoyer vers l’accueil de la CCBA.
- Il refuse les sujets hors CCBA, ne donne pas de conseil juridique, médical ou financier personnalisé, rappelle que l’état civil et les écoles relèvent des communes, et ne demande jamais de données personnelles.
- Un bandeau sous la conversation indique que les réponses sont générées automatiquement et peut être incomplètes.
- Origines autorisées, limitation à 40 questions par heure et par adresse IP, longueur des questions bornée.
- En cas de panne, le chatbot propose la recherche, les parcours guidés et le numéro de la CCBA.
- Accessibilité : panneau `dialog`, zone de conversation `role="log"` annoncée, fermeture par Échap avec retour du focus, Entrée pour envoyer, animations coupées en mouvement réduit, chatbot masqué à l’impression.
- Points d’entrée complémentaires : page « Je veux… », recherche sans résultat (la question est reprise) et page 404.

### Mise en service
Aube est affichée sur toutes les pages, sans rien configurer : le guide fonctionne seul, la discussion libre avec la clé du visiteur. Le Worker est facultatif (voir `worker/README.md`).

### Limites assumées (c’est une maquette)
- **La base de connaissances est envoyée à chaque question de la discussion libre** (≈ 35 000 jetons) — plus aucune en parcours guidé. Simple et fiable, mais coûteux : en production, il faudrait n’envoyer que les pages utiles (la recherche du site sait déjà les trouver) ou utiliser le cache de contexte du fournisseur.
- Limitation de débit approximative (comptée en mémoire, par isolat Cloudflare).
- Aucune question n’est journalisée : impossible, en l’état, de savoir ce que les usagers demandent ni d’améliorer les réponses.
- Une réponse fausse reste possible malgré les consignes. À évaluer sur un jeu de questions réelles avant toute mise en production, et à assortir d’une mention claire côté CCBA.
- Dépendance à un service extérieur (Google) et à un compte Cloudflare : à arbitrer au regard des exigences de souveraineté et du RGPD (les questions transitent par Google).

## Corrections et compléments (version 3.13)

### Corrections des contenus hérités (`corrections.py`, appliquées au build)
Chaque correction est déclarée avec sa raison et sa source ; le build signale celles qui ne trouvent plus leur texte (page source modifiée).
- **Liens réparés** : redirections Google (lien de la médiathèque), domaine erroné `impots-gouv.fr` → `impots.gouv.fr`, OUI.sncf → SNCF Connect, 3 délibérations de 2020 dont le lien pointait vers le titre du fichier au lieu du PDF, lien « petit guide » des marchés publics qui pointait vers un dossier du réseau interne (→ Guide entreprises 2026), lien malformé vers la grotte Chauvet retiré.
- **Textes mis à jour** : Tout’enbus dessert 11 communes et non 6 (page Mobilité, liste de 2007 ; source : toutenbus.fr) ; « Pôle emploi » → « France Travail (ex-Pôle emploi) » ; TER « Rhône-Alpes » → « Auvergne-Rhône-Alpes » ; conditions Visale harmonisées entre « Logement des jeunes » et « Garantir son loyer » (renvoi vers visale.fr) ; numéros de téléphone mal saisis (CCI, FORMAT) ; texte alternatif de l’organigramme.
- **Redirections réparées** : 4 anciennes adresses menaient à des pages inexistantes (bourse au foncier, dépôt d’annonce, page de gestion, dépôt de demande d’urbanisme) ; 5 pages parasites de l’ancien site (doublon de la page Contact, confirmation de formulaire, 2 pages vides, un essai d’intégration) sont retirées et redirigées vers la bonne page.

### Compléments
- **Bourse au foncier et à l’immobilier d’entreprise** (`bourse.py`) : elle était gérée par une extension WordPress et avait disparu. Les **34 annonces publiées** de l’export sont reprises : liste filtrable (commune, type de bien, location / vente, recherche tolérante) sur la page « Foncier et immobilier d’entreprise », une page par annonce (photos, description, surface, prix, référence, contact du service économie), anciennes adresses `/advert/…` redirigées. Une annonce expirée est masquée automatiquement. Les propriétaires proposent une annonce au service économie (courriel, téléphone) : il n’y a plus de formulaire. Location ou vente est déduite du montant (moins de 20 000 € : loyer). **À faire** : exporter à nouveau les annonces lors de la mise en production.
- **Rubriques vides** (« Contenu en cours de rédaction ») : Se loger, Gens du voyage, Politique de l’habitat, Documents d’urbanisme deviennent des sommaires des pages existantes ; liens « Voir aussi » ajoutés sur Covoiturage, Cadastre solaire et Foncier.
- **Déclaration d’accessibilité** : l’ancienne page ne contenait que « lorem ipsum ». Elle est rédigée selon le modèle RGAA (état de conformité, mesures prises, contenus non accessibles connus, contact, voies de recours). Faute d’audit, le site est déclaré **non conforme** (obligation du RGAA) ; le pied de page l’indique désormais. **À faire** : programmer un audit RGAA.
- **Ma commune** : pour Mézilhac, l’encadré indique que la collecte est assurée par le SICTOMSED ; pour Aubenas et Vals-les-Bains (absentes du tableau des collectes), il propose le numéro gratuit du service collecte.
- **Agenda vide** : liens vers la médiathèque et l’office de tourisme en plus des actualités.
- **« Je veux… »** : les informations datées portent une date de fin (Semaine Bleue 2026, planning des encombrants 2026) et disparaissent d’elles-mêmes ; la liste complète des 11 communes Tout’enbus est donnée.

### Points à faire trancher par les services
- **Transport à la demande** : la page TAD cite Fons parmi les communes « non desservies par Tout’enbus », alors que Tout’enbus (site officiel) dessert Fons. Le texte n’a pas été modifié : à confirmer (Fons est-elle bien dans le périmètre du TAD ?).
- **Relais Petite Enfance** : Saint-Didier-sous-Aubenas figure dans les listes Nord et Sud, et Saint-Sernin dans aucune (la même erreur existe sur le site actuel). Probablement Saint-Sernin au Sud : à confirmer avant de corriger.
- **Organigramme** : image d’octobre 2020 (d’après le nom du fichier), sans version texte.
- **Collectes d’Aubenas et de Vals-les-Bains** : absentes du tableau « Jours de collecte ».

## Recherche tolérante et « Je veux… » (version 3.12)

### Recherche tolérante (`CCBAFind`, en tête de `assets/js/site.js`)
Un seul moteur sert les suggestions pendant la frappe et la page de résultats. Tout se passe dans le navigateur, sur l’index statique : aucun service extérieur.
- **Mots vides ignorés** : « comment inscrire mon enfant au centre de loisirs » cherche *inscrire, enfant, centre, loisirs*.
- **Fautes de frappe** : distance d’édition 1 (2 pour les mots longs), singulier/pluriel, début de mot pendant la frappe, même racine (*inscrire / inscription*). « piscne » → « piscine », « colecte » → « collecte » ; la correction est signalée (« Orthographe corrigée… »).
- **Synonymes du quotidien** (constante `SYN`, ~150 entrées, à enrichir) : *poubelle* → collecte, ordures ménagères ; *piscine* → centre aquatique, Hippocampe ; *nounou* → assistante maternelle, Relais Petite Enfance ; *fosse septique* → assainissement non collectif ; *carte grise* → France Services… L’élargissement est indiqué.
- **Jamais de page vide** : si aucune page ne contient tous les mots, les plus proches sont proposées (« résultats approchants ») ; sans résultat, « Vouliez-vous dire… ? », le lien vers « Je veux… », le plan du site et le contact.
- **Index enrichi au build** (`searchidx.py`) : chaque page reçoit ses mots les plus caractéristiques (tf-idf) et ses mots rares, pour être trouvée par un terme présent seulement dans son texte (ex. « débroussaillement »). Les parcours et les 64 réponses de « Je veux… » sont aussi dans l’index, avec un lien direct vers la bonne étape.

### « Je veux… » (`je-veux/`, `jeveux.py`, `assets/js/jeveux.js`, `data/jeveux.json`)
Page dédiée, accessible depuis l’en-tête (« Je veux… »), l’accueil (« Pas sûr des mots ? Laissez-vous guider »), la recherche sans résultat et le plan du site.
- **4 thèmes à l’entrée, 12 besoins derrière** (version 3.16) : la page n’affiche plus douze cartes mais quatre thèmes — *me loger, construire ou rénover* ; *simplifier mon quotidien* ; *m’occuper de ma famille et de mes loisirs* ; *entreprendre ou m’engager*. Le thème choisi, une première question (« Plus précisément, je veux… ») propose ses trois besoins, chacun avec son pictogramme. Les thèmes et les besoins qu’ils réunissent se règlent dans `data/jeveux.json` (clé `groups`) ; le générateur vérifie que chaque besoin appartient à un thème et un seul.
- **Aller droit au besoin** : le champ « Ou décrivez votre besoin en quelques mots » remplace les thèmes par la liste des besoins qui correspondent (même moteur tolérant) ; un clic, ou Entrée s’il n’y en a qu’un, ouvre directement le parcours.
- **Deux ou trois questions**, puis une **réponse** : l’essentiel, les étapes s’il y en a, le contact (téléphones et courriels cliquables), le lien vers la page du site et, s’il y a lieu, vers le service en ligne cité par cette page ; « Modifier » pour revenir sur une réponse.
- **Contenus vérifiés** : chaque réponse est tirée des pages du site (`src`) ; 337 citations mot pour mot (`evidence`, non publiées) permettent de contrôler qu’aucune information n’a été inventée — à relancer quand une page source change. Points à surveiller : dates 2026 (Semaine Bleue, mise en service du TAD, planning des encombrants, offres d’emploi), incohérence de la liste des communes desservies par Tout’enbus entre deux pages, lien « petit guide » cassé sur la page Marchés publics.
- **Animations codées** (aucune bibliothèque, rien en boucle hors survol) : machine à écrire dans le titre (trois exemples puis « … »), trait et diagonale rouge pêche dessinés, cartes qui montent en cascade et pictogrammes tracés au trait (redessinés au survol), halo qui suit le pointeur ; au choix d’un besoin, le pictogramme vole jusqu’à l’en-tête du parcours (FLIP, Web Animations API) ; à chaque réponse, ondulation d’encre, le trait descend jusqu’à l’étape suivante qui bascule en place ; à l’arrivée, coche dessinée, rayon à 45° qui balaie la réponse et gerbe d’étincelles en Canvas 2D.
- **Accessibilité** : navigation au clavier (Entrée dans le champ ouvre le seul besoin trouvé), focus placé sur chaque nouvelle question ou réponse, retour arrière du navigateur (l’étape est dans l’adresse : `je-veux/#famille/0/0/1`, partageable ; les anciennes adresses du type `je-veux/#enfant/0/1` sont converties automatiquement), mouvement réduit respecté (aucune animation), page entièrement lisible sans JavaScript.

## Écran d’accueil animé « Un trait de lumière » (version 3.9)

Une introduction de **10 secondes** présente la CCBA à l’ouverture du site. Tout est dessiné en code, **logo compris** : aucune vidéo, aucune image. Le fil conducteur est le trait du logo — ligne monoligne à bouts ronds et diagonale rouge pêche à 45° — qui dessine toute l’animation jusqu’au logo lui-même.

| Temps | Scène |
|---|---|
| 0 – 2 s | **Le trait de lumière** : la diagonale du logo traverse l’écran et frappe l’horizon ; trois lignes s’en déroulent et se soulèvent en crêtes ; le soleil naît au point d’impact et se lève. « Le jour se lève sur le Bassin d’Aubenas ». |
| 2 – 4,7 s | **Le territoire** : la ligne d’horizon s’enroule en cercle autour du soleil puis prend la forme exacte du territoire ; le soleil se pose sur Aubenas ; une onde part du cœur du bassin, une étincelle file vers chaque commune et l’allume (1 100 points) ; compteur 01 → 28, noms, 39 935 habitants. |
| 4,7 – 7,5 s | **« Un territoire pour… »** grandir, habiter, entreprendre, se cultiver, respirer : chaque verbe fait éclore sur la carte un pictogramme tracé à la plume, et une onde ; « vivre ensemble » tisse le réseau des communes depuis Aubenas. |
| 7,5 – 9,1 s | **Le logo** : la carte s’efface en diagonale, le soleil remonte ; le logo s’écrit lettre à lettre à la plume, les deux N se déplient, la grande diagonale traverse le nom ; il devient net ; « Ensemble, faisons rayonner le territoire ». |
| 9,1 – 10 s | Le soleil se pose sur celui de la page d’accueil (s’il est visible à l’écran) et **s’ouvre sur le site** par un cercle qui s’agrandit ; les animations d’entrée de l’accueil démarrent à ce moment-là. |

- **Le logo en code** : `logo_strokes.py` calcule une fois pour toutes la ligne médiane de chaque forme du logo officiel (`assets/img/logo-ccba.svg`) — rastérisation, squelettisation, élagage, lissage — et son épaisseur de trait. L’animation trace ces lignes à la plume (Canvas 2D), puis affiche les formes d’origine exactes (Path2D) : le logo final est identique au fichier officiel. À relancer seulement si le logo change (`python3 logo_strokes.py`, nécessite Playwright et scikit-image).
- **Techniques** : WebGL (ciel, halo, grain et rais de lumière orientés à 45°), Canvas 2D + Path2D (crêtes, morphing ligne → cercle → territoire, points, pictogrammes, réseau, logo), typographie cinétique et découpes à 45° en Web Animations API, masque CSS pour la révélation, **bande-son générative en Web Audio** (impact, une note par commune, touches d’écriture, souffle de la diagonale, accord final) — **coupée par défaut**, bouton « Son ».
- **Quand** : une fois par session de navigation, seulement quand on arrive sur la page d’accueil depuis l’extérieur. Jamais en navigation interne, jamais sur une autre page d’entrée (un habitant qui arrive par « Jours de collecte » va droit au but), jamais pour les robots d’indexation, jamais si l’usager a demandé de **réduire les animations** dans son système.
- **Passer** : bouton « Passer l’intro » (avec anneau de progression, focalisé à l’ouverture), touche Échap, clic ou défilement : sortie en moins d’une seconde. Le reste de la page est rendu inerte pendant l’intro, puis restitué ; une description textuelle est fournie aux lecteurs d’écran.
- **Revoir** : lien « Revoir l’introduction » en pied de page (`?splash`) ; `?nosplash` l’empêche.
- **Poids** : `assets/js/splash.js` (≈ 105 Ko, ≈ 35 Ko compressé) n’est téléchargé que lorsque l’intro doit s’afficher. Il est généré par `site.py` : données (trame, communes, crêtes, silhouette et ondes du territoire, traits et formes du logo) + code source `splash_src.js`. Pour modifier l’animation, éditer `splash_src.js` (minutage : constante `TL` ; verbes : `VERBS` ; pictogrammes : `ICONS`).
- Recette : `?splash=5.2` fige l’image à 5,2 s.

## Charte graphique

- Rouge pêche `#E14248`, Cassis `#5E3A4F`, Marron glacé `#C6B09C`, fond clair crème.
- Titres en **Merlo Neue**, textes en **Arial**. Merlo Neue est une police commerciale (Typoforge Studio) : déposer les fichiers web sous licence dans `assets/fonts/` (`MerloNeue-Regular.woff2`, `MerloNeue-Bold.woff2`). En leur absence, le site utilise Merlo Neue si elle est installée sur le poste, sinon Arial.
- Logo officiel : `assets/img/logo-ccba-cadre.svg` (fichier d’origine, avec cadre blanc) et `assets/img/logo-ccba.svg` (variante recadrée sans cadre, utilisée dans l’en-tête, le pied de page et la page 404).

## Compatibilité GitHub Pages (animations, défilements, visuels)

- Aucune dépendance externe, aucun build : CSS et JS vanilla, chemins relatifs.
- Animations en CSS uniquement (apparitions, tracé des crêtes) ; le contenu reste entièrement lisible sans JavaScript.
- Vidéo d’accueil chargée seulement si l’écran est large et que l’utilisateur n’a demandé ni de réduire les animations ni d’économiser les données.
- Agenda : les événements passés sont masqués côté navigateur selon la date du jour (le site statique ne « vieillit » pas).
- Recherche : index JSON statique (`search-index.json`, 986 pages) interrogé côté navigateur.
- Formulaire de contact : ouvre la messagerie de l’usager (mailto) ; à remplacer par un service de formulaire (ex. formulaire de la plateforme de l’hébergeur final) lors de la mise en production.
- Images manquantes : chaque contenu a une composition géométrique générée en remplacement.

## Limites connues du prototype

- **Médias** : images, PDF et vidéos sont appelés depuis `www.bassin-aubenas.fr/wp-content/uploads/` (non copiés, le dépôt resterait sinon très lourd). Si l’ancien site est coupé ou bloque les appels externes, il faudra rapatrier le dossier `uploads`.
- L’export ne contient aucun événement postérieur au 30 juin 2026 : l’accueil affiche donc les « derniers rendez-vous ».
- Les contenus sont repris tels quels depuis WordPress (nettoyés des styles et codes courts) ; une relecture éditoriale reste nécessaire.
