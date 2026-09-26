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
- **Territoire en trame de points** (`assets/img/territoire-points.svg`) dans les en-têtes de page : un point par maille, taille selon la population de la commune, Aubenas signalée en rouge pêche.
- **France Services, ouvert aujourd’hui ?** (page France Services) : les 5 guichets sur la carte en points, état d’ouverture en direct, frise horaire 8h–18h, jours cliquables pour consulter les horaires d’un autre jour, adresse et téléphone. Sur l’accueil, le bouton France Services de la barre d’accès rapides indique en direct le nombre de guichets ouverts ou l’heure de réouverture. Horaires saisis dans `site.py` (constante `FS`) : à tenir à jour. Ce composant (`hours_list()` dans `site.py`) est générique : il est réutilisé tel quel, avec sa propre frise horaire (adaptée à l’amplitude du lieu), sur la piscine, la médiathèque et l’accueil du siège — voir « Horaires complétés » ci-dessous.
- **Visuels génératifs** (`cover.py`) : chaque contenu sans image reçoit une composition géométrique unique (tuiles, cercles, rayures) aux couleurs de la charte, calculée à partir de son titre. Elle sert aussi de repli si une photo distante ne se charge pas.
- **Barre d’accès rapides** posée sur le bas du film : collecte, urbanisme, France Services, marchés publics, communes, contact.
- **Les 7 orientations du projet de territoire** en panneaux dépliants (un ouvert à la fois, titres verticaux, visuel génératif, texte complet) ; accordéon sur mobile ; navigation au clavier par les flèches.
- **Territoire** : chiffres clés (28 communes, habitants, 75 élus) et **fiche express** de la commune survolée ou parcourue au clavier sur la carte (population, part du bassin, maire, lien vers la fiche).
- Page rythmée : en-têtes de section compacts, bande légèrement teintée pour les orientations, actualités en magazine, agenda à grands chiffres, domaines d’action en index avec sous-rubriques cliquables.

### Sobriété

- Aucune animation continue : seules des apparitions ponctuelles (titres, tracé des crêtes) ; tout est désactivé si l’usager réduit les animations.
- Film : lecture automatique uniquement sur écran large, hors mode économie de données ; pause hors écran et onglet masqué.
- **À prévoir** : le clip pèse 46 Mo (1920 × 500). Une version compressée (≈ 5 Mo) déposée dans `assets/video/` et référencée dans `site.py` (constante `VIDEO`) allégerait la page.

## Fonctionnalités de service (version 3.7)

- **Ma commune** (accueil et page « Jours de collecte ») : l’usager choisit sa commune une fois ; le choix est mémorisé **sur son appareil uniquement** (stockage local du navigateur, aucun compte, aucun suivi). Le site affiche alors les **prochaines collectes** (ordures ménagères, emballages recyclables) avec leur date réelle, en tenant compte des semaines paires / impaires (numéro de semaine ISO), le **guichet France Services le plus proche** avec son état d’ouverture en direct, et propose d’**ajouter les collectes à son agenda** (fichier .ics récurrent, rappel la veille à 19h pour sortir les bacs). Sur la page des jours de collecte, la ligne de la commune est surlignée. Données extraites automatiquement du tableau de la page « Jours de collecte » : Aubenas, Mézilhac et Vals-les-Bains n’y figurent pas (renvoi vers la page).
- **Recherche instantanée** : suggestions pendant la frappe (liste accessible au clavier, flèches + Entrée), lien « Tous les résultats » ; touche **/** pour rechercher depuis n’importe quelle page.
- **Événements** : « Ajouter à mon agenda » (.ics) et « Partager » (partage natif du téléphone, sinon copie du lien) ; « Partager » aussi sur les actualités.
- **Écouter la page** : lecture à voix haute des pages longues par la synthèse vocale du navigateur, paragraphe par paragraphe, avec surlignage du passage lu ; pause, reprise, arrêt. Message explicite si l’appareil ne dispose pas de voix française.
- **Horaires complétés** : le composant « ouvert aujourd’hui ? » de France Services (jours cliquables, frise en direct) a été généralisé (`hours_list()` dans `site.py`) et posé sur les équipements qui n’avaient pas encore leurs horaires :
  - **Centre Aquatique l’Hippocampe** : horaires grand public en période scolaire (source : `lhippocampe-aqua.fr` et annuaires spécialisés, recoupés) ; une remarque signale que les horaires changent pendant les vacances scolaires et l’été.
  - **Médiathèque Intercommunale Jean Ferrat** : horaires actuels (mar.–sam.), avec fermeture le lundi, le dimanche et les jours fériés (source : `mediatheque.bassin-aubenas.fr`).
  - **Accueil du siège de la CCBA** (page « Organisation et pôles » et page Contact) : horaires officiels du lundi au vendredi, 9h–12h et 14h–17h30 (la valeur précédente, 8h30, était erronée et a été corrigée partout — accueil, en-tête et page Contact). Les autres pôles (technique, aménagement) n’ont pas d’horaires de guichet publiés : leurs adresses restent en simple texte.
  - Ces trois lieux n’ayant qu’une seule adresse, le composant s’affiche sans la carte en points (variante à une seule ligne, sans numéro de guichet).

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
