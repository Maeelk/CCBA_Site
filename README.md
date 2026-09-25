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

## Direction artistique « Relief » (version 3)

- **Papier clair, couleur en accents** : fond presque blanc, aucun aplat coloré de fond ; le rouge pêche est réservé au soleil, aux repères et aux états actifs, le cassis aux titres et aux boutons, le marron glacé aux filets et aux courbes de niveau.
- **Motif signature dessiné en code** : des courbes de niveau (topographie du bassin) calculées en temps réel en WebGL dans l’accueil et les en-têtes de page, avec un soleil rouge pêche qui forme une « colline » autour de laquelle les lignes se resserrent et se réchauffent. Sur l’accueil, les lignes réagissent doucement au pointeur.
- **Film du territoire en boucle** : le clip de 30 secondes est présenté en bandeau panoramique découpé par une ligne de crête (`assets/img/crete-masque.svg`), le soleil se couche derrière au défilement. Bouton pause/lecture accessible.
- **Mise en page éditoriale** : grands titres serrés, sections numérotées 01 → 07 sous un filet cassis, actualités en mise en page magazine, agenda à grands chiffres, domaines d’action en index typographique, orientations du projet de territoire en chiffres détourés.
- **Carte du territoire en ondes** : contour du bassin calculé à partir des 28 communes, entouré d’ondes concentriques qui s’allument tour à tour.
- **Photos des fiches communes** découpées par la même ligne de crête ; pied de page clair signé par deux lignes de crête tracées à l’apparition.
- Toujours présents : chiffres clés animés, badge « Accueil ouvert / fermé », fiches communes structurées, carte choroplèthe, sommaire et barre de progression, transitions de page.

### Sobriété et accessibilité des animations

- Animation WebGL limitée à ~20 images/s, suspendue hors écran et onglet masqué, résolution plafonnée ; une seule image fixe si l’usager a demandé de réduire les animations ; motif SVG statique si WebGL est indisponible ou JavaScript désactivé.
- Film : lecture automatique uniquement sur écran large, hors mode économie de données et hors connexion lente ; sinon, l’usager lance le film lui-même. Pause automatique hors écran.
- **À prévoir** : le clip actuel pèse 46 Mo (1920 × 500). Une version compressée (≈ 5 Mo, 1280 × 334, H.264) déposée dans `assets/video/` puis référencée dans `site.py` (constante `VIDEO`) allégerait fortement la page et ne dépendrait plus de l’ancien site.

## Charte graphique

- Rouge pêche `#E14248`, Cassis `#5E3A4F`, Marron glacé `#C6B09C`, fond clair crème.
- Titres en **Merlo Neue**, textes en **Arial**. Merlo Neue est une police commerciale (Typoforge Studio) : déposer les fichiers web sous licence dans `assets/fonts/` (`MerloNeue-Regular.woff2`, `MerloNeue-Bold.woff2`). En leur absence, le site utilise Merlo Neue si elle est installée sur le poste, sinon Arial.
- Logo officiel : `assets/img/logo-ccba-cadre.svg` (fichier d’origine, avec cadre blanc) et `assets/img/logo-ccba.svg` (variante recadrée sans cadre, utilisée dans l’en-tête, le pied de page et la page 404).

## Compatibilité GitHub Pages (animations, défilements, visuels)

- Aucune dépendance externe, aucun build : CSS et JS vanilla, chemins relatifs.
- Animations en CSS (apparitions au défilement, tracé des crêtes, ondes de la carte) et en WebGL (courbes de niveau) ; le contenu reste entièrement lisible sans JavaScript.
- Carrousel « Projet de territoire » en *scroll-snap* natif, sans lecture automatique.
- Vidéo d’accueil chargée seulement si l’écran est large et que l’utilisateur n’a demandé ni de réduire les animations ni d’économiser les données.
- Agenda : les événements passés sont masqués côté navigateur selon la date du jour (le site statique ne « vieillit » pas).
- Recherche : index JSON statique (`search-index.json`, 986 pages) interrogé côté navigateur.
- Formulaire de contact : ouvre la messagerie de l’usager (mailto) ; à remplacer par un service de formulaire (ex. formulaire de la plateforme de l’hébergeur final) lors de la mise en production.
- Images manquantes : chaque visuel a un motif de courbes de niveau en remplacement.

## Limites connues du prototype

- **Médias** : images, PDF et vidéos sont appelés depuis `www.bassin-aubenas.fr/wp-content/uploads/` (non copiés, le dépôt resterait sinon très lourd). Si l’ancien site est coupé ou bloque les appels externes, il faudra rapatrier le dossier `uploads`.
- L’export ne contient aucun événement postérieur au 30 juin 2026 : l’accueil affiche donc les « derniers rendez-vous ».
- Les contenus sont repris tels quels depuis WordPress (nettoyés des styles et codes courts) ; une relecture éditoriale reste nécessaire.
