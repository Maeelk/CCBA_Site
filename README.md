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

## Nouveautés de la version 2

- **Identité illustrée propre au territoire** : six paysages génératifs (crêtes, rivière, soleil rouge pêche) déclinés dans la charte, servis en local (`assets/img/paysage-*.svg`, quelques Ko chacun). Ils habillent le hero, les en-têtes de page (arche paysagère par rubrique), les cartes sans photo, et le pied de page (silhouette de crêtes). Les photos du site, quand elles se chargent, viennent se poser par-dessus en fondu.
- **Chiffres clés animés** sur l’accueil : 28 communes, 39 935 habitants (somme des chiffres INSEE des fiches communales), 75 élus, 5 espaces France Services.
- **Badge horaires** dans le hero : « Accueil ouvert / fermé » calculé dans le navigateur à l’heure de Paris (jours fériés non gérés).
- **Fiches communes structurées** : bloc Habitants (part dans le bassin), Maire, coordonnées de la mairie extraits automatiquement du contenu existant.
- **Carte des communes** : population affichée dans la liste, bouton « Colorer selon la population » (carte choroplèthe en 5 classes avec légende), infobulles.
- **Sommaire « Sur cette page »** sur les pages longues (≥ 3 intertitres), avec section active surlignée, et **barre de progression de lecture**.
- **Transitions de page** fluides (API View Transitions, navigateurs compatibles), désactivées si l’usager réduit les animations.

## Charte graphique

- Rouge pêche `#E14248`, Cassis `#5E3A4F`, Marron glacé `#C6B09C`, fond clair crème.
- Titres en **Merlo Neue**, textes en **Arial**. Merlo Neue est une police commerciale (Typoforge Studio) : déposer les fichiers web sous licence dans `assets/fonts/` (`MerloNeue-Regular.woff2`, `MerloNeue-Bold.woff2`). En leur absence, le site utilise Merlo Neue si elle est installée sur le poste, sinon Arial.
- Le logo `assets/img/logo-ccba.svg` est un **logo provisoire** : le remplacer par le logo officiel (même nom de fichier) ainsi que `logo-ccba-blanc.svg` (version pour fond cassis).

## Compatibilité GitHub Pages (animations, défilements, visuels)

- Aucune dépendance externe, aucun build : CSS et JS vanilla, chemins relatifs.
- Animations en CSS (apparition au défilement via `IntersectionObserver`, tracé des courbes du hero) ; le contenu reste visible sans JavaScript.
- Carrousel « Projet de territoire » en *scroll-snap* natif, sans lecture automatique.
- Vidéo d’accueil chargée seulement si l’utilisateur n’a pas demandé de réduire les animations ni d’économiser les données ; source mobile distincte.
- Agenda : les événements passés sont masqués côté navigateur selon la date du jour (le site statique ne « vieillit » pas).
- Recherche : index JSON statique (`search-index.json`, 986 pages) interrogé côté navigateur.
- Formulaire de contact : ouvre la messagerie de l’usager (mailto) ; à remplacer par un service de formulaire (ex. formulaire de la plateforme de l’hébergeur final) lors de la mise en production.
- Images manquantes : chaque visuel a un motif de remplacement aux couleurs de la charte.

## Limites connues du prototype

- **Médias** : images, PDF et vidéos sont appelés depuis `www.bassin-aubenas.fr/wp-content/uploads/` (non copiés, le dépôt resterait sinon très lourd). Si l’ancien site est coupé ou bloque les appels externes, il faudra rapatrier le dossier `uploads`.
- L’export ne contient aucun événement postérieur au 30 juin 2026 : l’accueil affiche donc les « derniers rendez-vous ».
- Les contenus sont repris tels quels depuis WordPress (nettoyés des styles et codes courts) ; une relecture éditoriale reste nécessaire.
