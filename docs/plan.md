# 👑⚽ Plan — « Royaume Foot » : jeu 3D princesses + football

Jeu navigateur **100 % frontend**, servi depuis **`https://foot.bas.lu`**
(Dokploy + Traefik sur le VPS OVH), pensé pour des enfants de **6–7 ans**. Aucun compte, aucun serveur, aucune donnée qui sort de
l'appareil — même philosophie que le Pic Collage Maker.

**Nom proposé :** *Royaume Foot* (alt. : *Tiara Cup*, *Princess Kick*).

---

## 1. Décisions structurantes

| Question | Décision | Pourquoi |
| --- | --- | --- |
| Où ça vit ? | **Repo dédié `royaume-foot`**, servi sur `https://foot.bas.lu` | Historique, CI, issues et cycle de release propres au jeu. *(Deux étapes depuis : une première version a vécu dans `Pic-collage/game/`, puis sur GitHub Pages sous `/royaume-foot/`. Le jeu a un domaine à lui, donc `base` est `/`.)* |
| Framework 3D | **three.js 0.185** + **@react-three/fiber 9.6** (drei retiré : inutilisé) | R3F 9 est compatible React 19 (peer `react >=19 <19.3`, on est en 19.2). On garde React/TS/Vite/Tailwind/zustand déjà maîtrisés — pas de 2ᵉ stack à apprendre. |
| Physique | **Maison, arcade** (sphère vs plan/AABB, gravité + rebond + friction) | Rapier = ~1 Mo de WASM pour un besoin trivial. Un ballon arcade « qui pardonne » est *meilleur* pour des enfants qu'une simu réaliste. Rapier reste l'option B si on veut casser des tours de cubes (phase 4). |
| Assets 3D | **Zéro fichier .glb au départ** : princesses construites en primitives (cône = robe, sphère = tête, capsule = bras) en low-poly kawaii | Chargement instantané, aucun pipeline d'asset, style cohérent, palette 100 % paramétrable → la customisation devient gratuite. glTF possible plus tard sans changer l'archi. |
| Audio | Web Audio synthétisé (sifflet, « pop », étincelles) + 2–3 samples courts CC0 (foule, fanfare) | Reste léger, pas de dépendance (`howler` non nécessaire). |
| Sauvegarde | `localStorage` (progression, étoiles, tenue) | Pas de compte, conforme à la règle « rien ne quitte l'appareil ». |

> **Note :** la première implémentation vivait en sous-app dans le repo
> `Pic-collage` (`game/`, servi sur `/Pic-collage/game/`). Elle a été extraite
> ici : `base` passe de `/Pic-collage/game/` à `/royaume-foot/`, puis à `/` le
> jour où le jeu a eu son propre domaine ; le build n'a
> plus besoin de `emptyOutDir: false`, et le contournement du service worker du
> collage (`navigateFallbackDenylist`) devient inutile — deux origines de
> chemins distinctes ne peuvent plus se marcher dessus.

---

## 2. Design de jeu (le cœur du sujet)

### Règles d'or pour 6–7 ans

1. **Aucune lecture obligatoire.** Tout est icône, couleur, animation. Le texte
   existe mais n'est jamais nécessaire pour jouer.
2. **Un seul geste.** Glisser-relâcher (style lance-pierre) pour tirer. Pas de
   double stick, pas de bouton combiné, pas de timing serré.
3. **Pas d'échec.** Un tir raté = le ballon rebondit, le gardien fait coucou,
   « Encore ! ». On gagne toujours au moins 1 étoile.
4. **Récompense immédiate et exagérée.** Confettis, paillettes, ralenti sur le
   but, foule qui saute, trophée qui tourne.
5. **Sessions courtes** : 2–4 min par mini-jeu, reprise instantanée.
6. **Zones tactiles énormes** (≥ 64 px), pas de menu à plus de 2 niveaux.

### Boucle principale

```
Choisir sa princesse  →  Habiller / choisir son ballon  →  Mini-jeu
        ↑                                                     ↓
        └────────── Débloquer avec les étoiles  ←──── Étoiles + confettis
```

La **customisation est le vrai crochet** à cet âge : c'est elle qui donne envie
de rejouer, pas le score.

### Les 5 mini-jeux

| # | Mini-jeu | Geste | Objectif | Phase |
| --- | --- | --- | --- | --- |
| 1 | **Tir au but magique** | glisser-relâcher | Marquer dans les cibles-couronnes du but ; un gentil dragon garde la cage | MVP |
| 2 | **Gardienne du château** | swipe gauche/droite | Arrêter les ballons qui arrivent | 3 |
| 3 | **Course aux étoiles** | doigt = direction | Slalom entre les portes, ramasser les étoiles | 3 |
| 4 | **Casse-tour** | glisser-relâcher | Faire tomber des tours de cubes avec le ballon | 4 |
| 5 | **Coupe du Royaume** | — | Enchaînement des 4 + remise de trophée | 4 |

### Contenu à débloquer (avec les étoiles)

- **6 princesses** : couleurs de peau, cheveux et robes variés (représentation
  inclusive dès le départ).
- **Une tenue** : un seul objet porté à la fois — ailes, capes, couronnes —
  posé sur n'importe quel personnage.
- **Ballons** : classique, licorne, arc-en-ciel, étoile, ballon-gâteau.
- **Stades** : prairie, plage, royaume des glaces, nuit étoilée. *(Quatre, pas
  cinq : le « château » listé ici au départ n'a jamais été livré, la prairie
  jouant déjà au pied du château. Voir la phase 3.)*
- **Mascotte** qui court sur le terrain : chat, licorne, dragon bébé.

---

## 3. Architecture technique

```
royaume-foot/
├── index.html
├── vite.config.ts            # base '/', PWA (vite-plugin-pwa)
└── src/
    ├── main.tsx
    ├── App.tsx               # routeur d'écrans maison (pas de react-router)
    ├── store/
    │   ├── gameStore.ts      # écran courant, mini-jeu, score, état de manche
    │   └── saveStore.ts      # étoiles, déblocages, tenue → localStorage
    ├── game/
    │   ├── physics.ts        # intégration ballon (pure, testable)
    │   ├── aim.ts            # pointer → vecteur de tir (pure, testable)
    │   ├── scoring.ts        # buts, cibles, étoiles (pure, testable)
    │   └── keeper.ts         # IA gardien : lente, ratée exprès, difficulté douce
    ├── data/                 # roster, stades, mascottes, gardiens, tenue
    ├── three/
    │   ├── Scene.tsx         # <Canvas>, lumières, dpr, caméra
    │   ├── Pitch.tsx         # terrain, but, filet, décor du stade
    │   ├── Character.tsx     # avatar procédural (princesse ou chevalier)
    │   ├── Ball.tsx          # ballon + traînée de paillettes
    │   ├── Crowd.tsx         # foule instanciée (InstancedMesh, 1 draw call)
    │   └── fx/               # confettis 3D, étincelles, « BUT ! » qui rebondit
    ├── ui/                   # HUD, boutons géants, écran de tenue (DOM + Tailwind)
    ├── audio/                # petit moteur Web Audio
    └── i18n/                 # 6 langues, mêmes clés/pattern que l'app collage
```

**Principes**

- L'**UI est en DOM/Tailwind par-dessus le `<Canvas>`**, pas en 3D : plus net,
  accessible, et bien plus simple à styler pour des gros boutons.
- La **logique de jeu est pure** (`game/*.ts`, aucun import three) → testable en
  vitest sans navigateur, comme `lib/filters.ts` côté collage.
- Le rendu 3D ne fait que **lire l'état** ; la boucle vit dans `useFrame`.
- **Toutes les unités du terrain sont des unités de design** (terrain de
  20 × 30), indépendantes de l'écran — même modèle mental que le board du collage.

### Budget performance (cible : vieil iPad / Chromebook d'école, 60 fps)

- JS initial **< 700 Ko gzip** (three ≈ 170 Ko gzip, R3F ≈ 30 Ko).
- `dpr={[1, 2]}` plafonné, `antialias` seulement si `devicePixelRatio < 2`.
- **Aucune ombre dynamique** : un « blob shadow » (disque sombre) sous le ballon
  et la princesse. C'est plus joli en cartoon et ~gratuit.
- Foule = `InstancedMesh`, décor = géométries fusionnées → **< 40 draw calls**.
- Matériaux `MeshToonMaterial` / `MeshBasicMaterial`, pas de PBR.
- ~~Chaque mini-jeu en **`lazy()` / chunk séparé**.~~ **Abandonné, mesure à
  l'appui** (2026-09-11) : le bundle entier pèse **338 ko gzip** pour un budget
  de 700, et la PWA précharge de toute façon les 18 entrées — découper n'avance
  donc rien, ni au premier chargement ni ensuite. Il n'y a aucun `lazy()` dans
  `src/`, et c'est très bien ainsi. *(Même genre de renoncement que `drei`.)*

---

## 4. Découpage en phases

**Phase 0 — Fondations — ✅ fait**
Scaffolding `game/`, 2ᵉ config Vite, scripts `build:game` / `dev:game`,
`tsconfig.game.json`, étapes CI, suite e2e dédiée.

**Phase 1 — MVP jouable — ✅ fait**
Terrain + but + filet + château, physique arcade, visée au *flick*, détection de
but au croisement exact de la ligne, gardien-dragon, couronnes bonus, confettis,
sons synthétisés, HUD 5 tirs / étoiles, écran de résultat.

**Phase 2 — Princesses & customisation — ✅ fait**
Avatar procédural (6 princesses), 5 ballons, écran de tenue, sauvegarde
`localStorage`, déblocage par paliers d'étoiles, animations idle / tir / joie.

> **Écarts par rapport au plan initial** (mesurés, pas devinés) :
> - `@react-three/drei` a été **retiré** — aucune de ses aides n'a servi.
> - La visée découple les axes (horizontal = direction, vertical = puissance) au
>   lieu d'utiliser l'angle du swipe : coupler les deux rendait un tir puissant
>   automatiquement imprécis, exactement l'inverse de ce qu'il faut à 6 ans.
> - L'angle max de tir est passé de 0.55 rad à 0.30 : à 0.55, **deux tirs sur
>   trois partaient hors du cadre**. C'est le harnais d'équilibrage qui l'a
>   révélé, pas la lecture du code.

**Phase 3 — Contenu — ✅ fait**
- ✅ **Mini-jeu 2 « Gardienne du château »** : la princesse est en cage, le
  dragon tire. Contrôle par glissement direct (elle suit le doigt le long de la
  ligne), tir **télégraphié** par un anneau de visée une seconde avant la
  frappe — c'est ce qui rend le mode jouable à 6 ans. Sélecteur de mode au
  menu, i18n 6 langues, harnais de difficulté dédié, tests e2e.
- ✅ **Mini-jeu 3 « Course aux étoiles »** : le personnage court, le monde
  défile vers lui, l'enfant le déplace latéralement pour ramasser des étoiles.
  Rien à éviter, rien qui punit — la difficulté est uniquement dans
  l'écartement des étoiles. Durée fixe (24 s) avec barre de temps, étoiles
  dorées qui valent double, harnais de difficulté et tests e2e.
- ✅ **4 stades** (prairie, plage, royaume des glaces, nuit étoilée) : une
  palette par stade, aucune géométrie nouvelle, déblocage par étoiles et
  sélection dans le vestiaire.
- ✅ **4 mascottes** (chat, lapin, licorne, dragonnet) : un compagnon qui suit
  le personnage avec du retard dans les trois modes, débloqué par étoiles.
- ✅ **Carte du royaume** : le choix du mini-jeu n'est plus une grille de quatre
  boutons identiques, c'est une carte — une île, un château, une route en
  pointillés, la forêt, les montagnes enneigées et la prairie aux étoiles.

  Le raisonnement est celui de la règle 1 (aucune lecture obligatoire) : quatre
  boutons roses qui ne diffèrent que par leur libellé et leur emoji ne laissent
  rien à retenir à un enfant qui ne lit pas. Sur une carte, le but est **en haut
  près du château** et les étoiles sont **en bas à gauche** — c'est une mémoire
  qu'on a déjà à six ans, celle des pièces d'une maison. On part toujours en un
  seul geste depuis le menu : la carte *est* le sélecteur, pas un écran de plus
  sur le chemin, sinon le menu passerait à trois niveaux.

  **La route suit l'ordre de la coupe** (`CUP.legs`), et c'est ce qui explique la
  Coupe du Royaume sans un mot : un tour de l'île, pas un cinquième mini-jeu. Un
  test tient les deux ordres synchronisés, et trois autres tiennent la géométrie
  — médaillons de 72 px qui ne se touchent pas, plaques de nom qui ne se
  chevauchent pas, tout ce qui dépasse resterait dans le cadre — parce que ces
  collisions-là arrivent sur un téléphone de 320 px et pas sur l'écran où on
  dessine.

  *Coût de place :* la carte prend ~320 px là où la grille en prenait ~140. Le
  vestiaire reste visible sans défiler sur un 390 × 844 (le personnage du menu
  est passé de 160 à 128 px de haut, le bouton de la coupe en version compacte),
  mais la rangée des langues est désormais sous la ligne de flottaison, avec
  l'affordance de défilement pour le dire. **Tranché au test du 2026-09-10** :
  l'enfant fait défiler le menu d'elle-même, sans qu'on le lui montre. La carte
  garde ses ~320 px et la mise en page ne bouge pas.

> **Écart :** un seul des deux mini-jeux prévus. Livrer le second à moitié aurait
> coûté la qualité du premier ; la trajectoire du ballon en mode gardienne est
> analytique (et non intégrée) pour garantir que le ballon atterrit *exactement*
> là où l'anneau l'a promis — un télégraphe qui ment est pire que pas de
> télégraphe.

**Phase 3bis — Personnages & direction artistique — ✅ fait**

- ✅ **Chevaliers jouables.** *(fait)* 4 chevaliers (Lancelot, Zaïd, Mei, Bran),
  union discriminée `Princess | Knight` dans le roster, composant `Character`
  qui dispatche, rig d'animation partagé, un chevalier gratuit dès le départ,
  sauvegarde migrée sans perte. Le libellé du vestiaire devient « Qui joue ? ».
  Cahier des charges initial : Ouvrir le roster à un second type de personnage :
  aujourd'hui `data/roster.ts` ne décrit que des princesses (peau, cheveux,
  robe, couronne) et `three/Princess.tsx` code cette anatomie en dur. Il faut
  un champ `kind: 'princess' | 'knight'` et un composant `Knight.tsx` frère,
  avec ses propres pièces (heaume à plumet, plastron, cape, épée au fourreau,
  bouclier aux couleurs du royaume). Le reste — vestiaire, déblocages,
  animations idle / tir / joie, les deux mini-jeux — doit continuer à marcher
  sans le savoir : c'est le test de la bonne abstraction.
  *Attention :* la garde-robe et le menu affichent le personnage via
  `<Princess showcase>` ; ce point d'entrée devient générique.

- ✅ **Dragon refait.** *(fait)* Cou et tête distincts, museau arrondi, grands
  yeux amicaux avec reflet, cornes balayées, oreilles-membranes, ailes en
  éventail (secteurs de cercle) avec doigts, pattes à trois orteils, plaques
  ventrales, épines dorsales, queue segmentée à pointe. Au passage, le composant
  s'appelle désormais `Dragon.tsx` et non plus `Keeper.tsx` : il joue le gardien
  *et* le tireur, le nommer d'après un seul de ses rôles induisait en erreur.
  *Pour mémoire, l'état d'avant :* une grosse sphère verte, des ailes-galets et
  un museau en cône — sans cou, sans silhouette, illisible dès qu'il s'éloignait.

**Phase 3ter — Retours du terrain — ✅ fait**

> 🎉 **Un enfant a testé le jeu et l'adore.** C'est la première validation
> réelle : jusqu'ici tout l'équilibrage reposait sur des harnais qui *simulent*
> un enfant. Tout ce qui suit vient de cette session ou du retour d'Alex.
> *(À creuser au prochain test : qu'est-ce qui a été difficile ou pas compris ?
> « ça marche » est un bon signal, « voilà où elle a bloqué » en est un
> meilleur.)*

- ✅ **Quatre gardiens, dont une licorne.** *(fait)* `data/keepers.ts` +
  `three/Keeper.tsx` qui aiguille vers un composant par espèce — Braise (dragon,
  libre), Étoile (licorne, ⭐7), Plume (griffon, ⭐13), Flocon (yéti, ⭐20). Ni le
  mode tir ni le mode gardienne ne savent quelle espèce ils ont reçue. La
  mécanique idle partagée est dans `three/keeperRig.ts`, le visage dans
  `three/KeeperParts.tsx` — partagé exprès : ces yeux-là sont ce qui fait lire le
  gardien comme un ami plutôt que comme un obstacle, et la règle 3 s'appuie
  dessus. Onglet 🧤 au vestiaire, avec aperçu 3D du gardien choisi (c'est la
  seule chose qu'on choisit sans jamais la voir de près : en jeu, elle est au
  bout du terrain).
- ✅ **Le dragon refait, une troisième fois.** *(fait)* Le reproche n'était pas
  la proportion mais la **valeur** : tout son corps était du même vert, donc à
  vingt-cinq unités il redevenait une tache. Il a maintenant un cou en S qui
  dégage la tête des épaules, une mâchoire sous le museau, une bande ventrale
  claire contre un dos plus sombre, et les ailes ouvertes plutôt que pendantes —
  c'est cette pose-là qui le fait lire comme un **gardien** et non comme un décor
  planté dans la cage.

  **La vraie correction est ailleurs** : il n'est plus le seul. Une bonne partie
  de « le dragon n'est pas bon » était « il n'y a que lui ».
- ✅ **Remise à zéro des étoiles.** *(fait)* Modale de confirmation plein
  écran — l'option sûre est le gros bouton vert, la destructive est discrète.
  Cahier des charges initial :
- ⬜ ~~**Remise à zéro des étoiles.**~~ Pouvoir tout recommencer depuis 0 —
  redécouvrir les déblocages est une partie du plaisir. Doit être protégé par
  une confirmation : c'est destructif, et à 6 ans on appuie partout.
- ✅ **Passe UI/UX du vestiaire.** *(fait)* Onglets personnages / ballons /
  terrains / amis, princesses et chevaliers en sections séparées, et une
  affordance de défilement (dégradé + flèche) qui disparaît en bas de liste.
  Cahier des charges initial :
- ⬜ ~~**Passe UI/UX du vestiaire :**~~
  - **on ne voit pas qu'on peut faire défiler** la liste des skins — il faut une
    affordance (dégradé de bord, flèche, ou une mise en page qui ne coupe pas
    une rangée au milieu) ;
  - **séparer princesses et chevaliers** en deux sections distinctes ;
  - **des onglets** (personnages / ballons / terrains / amis) plutôt qu'une
    seule longue colonne.
- ✅ **10 ballons, redessinés.** *(fait)* Classique, cœurs, fleurs, étoiles,
  bulles, arc-en-ciel, licorne, pastèque, galaxie, gâteau — texture 512 px au
  lieu de 256, motifs cantonnés à la bande centrale (aux pôles la sphère les
  écrase en bouillie).

**Phase 4 — Fête finale — ✅ fait**

- ✅ **Casse-tours** (`tower`). Trois tours de quatre cubes, le même geste que le
  tir : rien de nouveau à expliquer. Règles pures dans `game/towerGame.ts`,
  scène dans `three/TowerMatch.tsx`.

  Deux décisions que les tests ont tranchées, pas le clavier. **La cascade** :
  toucher le bas d'une tour fait tomber toute la tour, parce que c'est ce que
  fait toute pile de cubes qu'un enfant a déjà poussée. Et **le bloc touché est
  celui dont on est à la hauteur**, pas tous ceux qu'on chevauche : le ballon est
  presque aussi large qu'un cube, donc un test de chevauchement strict attrapait
  toujours celui du dessous — viser le sommet d'une tour la faisait tomber
  entière et rendait la visée sans objet. Un test le dit maintenant.

  Un second bug est tombé au même endroit : `justKnocked` survivait à l'appel
  suivant quand rien n'était touché, ce qui aurait fait rejouer l'effet de chute
  à chaque image.

- ✅ **Coupe du Royaume** (`game/cup.ts`). Les quatre épreuves à la suite, puis
  le trophée. **Ce n'est pas un cinquième mini-jeu** : chaque manche est une
  manche ordinaire, la coupe décide seulement de ce qui arrive quand elle finit.
  Bandeau de progression en bas (🥅🧤⭐🧱), bonus de 2 étoiles pour finir, 3 de
  plus pour un sans-faute. Aucune façon d'échouer : une manche ratée rapporte son
  étoile plancher et avance quand même. Quitter abandonne la coupe, ce qui coûte
  le bonus et garde les étoiles déjà acquises.

- ✅ **Écran de fin** (`ui/TrophyScreen.tsx`). Une à trois coupes selon les
  manches, mais **le texte ne varie pas** : arriver au bout est l'exploit, et
  l'écran le dit quel qu'ait été le score.

- ✅ **PWA installable.** `vite-plugin-pwa`, tout le jeu préchargé (`three` fait
  725 ko, donc plafond relevé — sans quoi un jeu installé s'ouvre sur un canvas
  vide dans le bus). Icônes 192/512/maskable/apple-touch engendrées par
  `scripts/generate-icons.mjs`, **sans aucune dépendance** : un rasteriseur pour
  cinq formes plates est plus court que l'argument pour ajouter `sharp`. Le
  `sw.js` est explicitement non-caché par nginx — un service worker gardé fige un
  enfant sur la version qu'il a installée et plus aucun déploiement ne l'atteint.

**Phase 5 — Qualité — ✅ fait**

- ✅ **Contrastes, mesurés et non calculés.** `scripts/quality-bench.mjs` relit
  les **pixels rendus** (la capture est redessinée dans un canvas de la page),
  parce que cette interface est faite de dégradés, de plaques translucides et
  d'une scène 3D qui transparaît sous le HUD — un calcul sur les couleurs CSS
  ne voit rien de tout cela.

  Il a trouvé ce qu'un calcul aurait manqué : **le prix d'un objet verrouillé
  était illisible**. La carte entière était atténuée (`opacity-60`), prix
  compris, et la pastille translucide dépendait du fond — 7:1 à hauteur des
  princesses, **1,05:1** arrivé au dernier chevalier, plus bas sur le même
  dégradé. Or ce prix est exactement ce qu'un enfant doit pouvoir lire : c'est
  ce pour quoi il joue. Désormais seul l'emblème s'atténue, et la pastille est
  **opaque**. Les six écrans passent AA.

- ✅ **Cibles tactiles.** La rangée des langues était à 56 px, sous la règle 4
  du projet (64 px), depuis toujours. Corrigée. Le banc la vérifie.

- ✅ **`prefers-reduced-motion` atteint enfin la 3D.** `src/index.css` le
  respectait pour le DOM ; toute la moitié 3D l'ignorait — respiration au repos,
  battements d'ailes, saut de la mascotte, foule de 132 spectateurs, et le
  tourne-disque du vestiaire qui ne s'arrête jamais. `three/reducedMotion.ts`,
  branché dans les deux rigs, la mascotte et la foule.

  **Le mouvement de jeu n'est PAS réduit** : un ballon qui ne vole pas n'est pas
  un jeu de foot plus doux, c'est un jeu cassé. Ce qui s'arrête est ce qui est là
  pour le charme. Mesuré : le menu passe de 2,35 % à **0 %** de pixels qui
  bougent par seconde ; sur le terrain il reste 2 %, et c'est la patrouille du
  gardien — celle que l'enfant chronomètre. Deux tests e2e le tiennent, dont un
  garde-fou qui échoue si la mesure renvoyait zéro pour de mauvaises raisons.

- ✅ **Pas de flash rapide.** Mesuré pendant une célébration (confettis, cri,
  foule) : la luminance moyenne reste entre 0,567 et 0,575, **zéro** variation
  au-delà de 10 %. La limite WCAG est de trois par seconde.

- ✅ **Les draw calls restent au-dessus du budget, et c'est acté.** Le budget
  de la phase 1 dit **moins de 40** ; la réalité mesurée était de **157** en
  mode tir. La ligne du budget supposait « décor = géométries fusionnées » —
  ce qui n'a jamais été fait.

  Deux instanciations sûres (23 créneaux du rempart identiques, 8 fenêtres de
  tour identiques) ont ramené à **140 / 124 / 84 / 72** selon le mode. C'était
  −17 partout, et rien n'a changé à l'écran — vérifié sur les quatre stades.

  **Mesure du 2026-09-10** (`scripts/quality-bench.mjs`) : **149** en tir,
  **134** en gardienne, **84** en course, **72** en casse-tours — plus 21 au
  menu et 33 au vestiaire, tous deux dans le budget. Les deux modes qui montrent
  un gardien de près ont donc repris ce que le dragon refait leur avait coûté,
  sciemment : la silhouette lisible à vingt-cinq unités valait ces draw calls-là.
  Les deux autres n'ont pas bougé.

  **Le reste n'a pas été fait, et volontairement.** Le gros du compte, ce sont
  les personnages et les gardiens : des dizaines de primitives par corps, dans
  des groupes qui s'animent, donc pas fusionnables sans refondre les rigs. Sur
  du vrai matériel 149 draw calls ne se voient pas ; sur cette machine il n'y a
  **pas de GPU** (rastérisation logicielle), donc le gain serait invérifiable.
  Optimiser à l'aveugle un chiffre qu'on ne peut pas mesurer, en touchant ce qui
  casse le plus visiblement, est le meilleur moyen d'introduire une régression
  pour rien.

  **Tranché le 2026-09-11 : l'appareil réel a validé la perf.** Le budget « moins
  de 40 » n'a jamais été une fin en soi — c'était un indicateur indirect pour
  « 60 fps sur un Chromebook d'école », et c'est cette question-là qui vient
  d'obtenir sa réponse, directement. Le compte reste donc au-dessus du chiffre
  écrit en phase 1, et ce n'est plus un problème à résoudre : c'est le chiffre
  qui était le mauvais instrument. `quality-bench.mjs` continue de le mesurer,
  comme garde-fou contre une dérive brutale, pas comme un seuil à tenir.

- ✅ **Passe perf sur mobile réel.** *(validée par Alex le 2026-09-11)* Le jeu
  tourne bien sur l'appareil réel. C'était le dernier point ouvert du plan, et
  le seul que cette machine ne pouvait pas trancher : elle n'a pas de GPU, donc
  toute mesure de temps d'image y était une fiction.

  *Non consigné :* l'appareil exact et les images par seconde mesurées. Si la
  question se repose un jour — après un ajout coûteux en géométrie — c'est le
  chiffre qu'il faudra reprendre, pas celui des draw calls.

- ✅ **Test avec un enfant de l'âge cible.** *(fait, 2026-09-10)* Deuxième
  session, cette fois après les quatre gardiens, Casse-tours, la coupe et la
  carte. Les quatre hypothèses que le plan avait posées tiennent :
  - **Casse-tours se joue sans explication.** Le pari était que le geste du tir
    se transfère tel quel ; il se transfère, du premier coup et sans aide.
    C'était le seul mini-jeu que personne n'avait jamais essayé.
  - **La coupe va au bout.** Les quatre épreuves d'affilée jusqu'au trophée :
    la longueur n'est pas un problème à six ans, `CUP.legs` reste à quatre.
  - **La carte est un vrai sélecteur.** Elle est allée droit au jeu qu'elle
    voulait, sans qu'on lui lise les noms — c'est précisément ce que la carte
    achète, et c'est ce qui justifie sa place à l'écran.
  - **L'affordance de défilement suffit.** Elle fait défiler le menu seule ; le
    dégradé et la flèche se voient. Aucune des retouches envisagées (rétrécir
    le titre, supprimer « On joue à quoi ? ») n'est nécessaire.

  **Ce qui n'a pas été observé cette fois**, à reprendre au prochain test :
  reconnaît-elle les **gardiens** à vingt-cinq unités (« c'est qui, dans les
  buts ? »), trouve-t-elle **l'onglet 🧤** maintenant qu'il y en a cinq, et
  toujours la question qui vaut le plus — **où a-t-elle bloqué ?**

> **La phase 5 est close depuis le 2026-09-11.** L'accessibilité est mesurée,
> l'équilibrage a deux sessions réelles derrière lui — dont une qui couvrait les
> cinq façons de jouer — et la perf a été validée sur un vrai appareil, le seul
> point que cette machine ne pouvait pas trancher.
>
> Il ne reste donc aucune phase ouverte. Ce qui viendra ensuite viendra du
> terrain : les questions du prochain test avec l'enfant sont plus haut.

**Phase 6 — La tenue — ✅ fait**

Le plan promettait « robes / capes / couronnes / chaussures à paillettes » et
rien n'avait été livré : la couronne et la cape étaient des *couleurs* sur
l'entrée du roster, pas des objets qu'on choisit. `data/accessories.ts` et
`three/Accessory.tsx` comblent le trou — huit objets, plus la case vide.

- **Un seul emplacement, pas un par partie du corps.** Chaque emplacement de
  plus est une décision de plus entre l'enfant et le terrain. L'objet porte
  donc son propre `mount` (`head` ou `back`) et le personnage le lit.
- **L'objet *remplace* ce que le personnage porte déjà à cet endroit** : la
  couronne de la princesse, le plumet du chevalier, sa cape. Une règle, deux
  types de personnage, et surtout **rien n'est ajouté à l'union discriminée** —
  une princesse ne peut toujours pas recevoir de plumet.
- **Pas un sixième onglet.** Six onglets sur un téléphone de 320 px font 41 px
  chacun, sous la règle des 64 px, et personne n'a encore vérifié qu'un enfant
  trouve le cinquième. C'est une troisième section de l'onglet 👑, là où se
  trouve déjà celui qui va le porter.
- **La carte ne montre qu'un emoji**, comme les ballons : le nom d'un objet
  n'est pas un nom propre, et une chaîne non traduite dans six langues est pire
  que pas de nom du tout.
- **Les paliers vont jusqu'à 31 étoiles**, au-delà de l'ancien sommet du jeu
  (22, le ballon-gâteau) : un enfant qui a tout débloqué n'a plus rien à aller
  chercher, et la règle 5 fait du vestiaire la boucle de récompense.

Chaque forme a été **jugée sur une capture, pas sur le code**, depuis les deux
vues qui comptent — le tourne-disque du vestiaire et le point de penalty. La
première version était illisible : tous les objets de tête étaient trop petits
pour se distinguer de la couronne d'origine, et les ailes de dragon
disparaissaient derrière le torse. Deux erreurs n'auraient pas pu être vues
autrement : le secteur sombre au milieu de l'aile de dragon se lisait comme un
*trou*, et l'étoile du diadème pointait vers le but — c'est-à-dire à l'opposé
de la caméra pendant toute la partie.

*Coût :* de **0 à +8 draw calls** selon l'objet, mesuré. Les ailes coûtent 8 ;
le diadème et le chapeau coûtent **zéro**, parce qu'ils remplacent la couronne
qu'ils occupent.

---

## 5. CI / déploiement

**Dokploy sur `dok.seil.pro`** construit l'image depuis ce dépôt et **Traefik**
route `foot.bas.lu` vers elle. `compose.deploy.yaml` décrit la stack ; le
Dockerfile lance le typecheck **et les tests unitaires**, donc un jeu de règles
rouge ne peut pas devenir un conteneur qui tourne. La suite e2e tourne en CI et
pas là : elle a besoin d'un navigateur que l'image de production ne transporte
volontairement pas.

**Un push sur `main` déclenche un déploiement.** `autoDeploy` est actif, le
webhook GitHub de Dokploy ouvre un build dans les secondes qui suivent ; le
bouton Deploy ne sert que si le webhook reste muet. Ne pas faire les deux : on
empile un second build sur le premier.

**`sw.js` ne doit jamais être mis en cache** — `nginx.conf` le dit
explicitement. Un service worker gardé fige un enfant sur la version qu'il a
installée, et plus aucun déploiement ne l'atteint.

> *Historique :* le jeu a d'abord été publié par un job GitHub Pages à deux
> builds, aux côtés de l'app collage, dont le service worker avait pour scope
> `/Pic-collage/` et englobait `/game/`. Deux origines distinctes puis un
> domaine dédié ont supprimé le problème et le workflow avec.

---

## 6. Risques & garde-fous

| Risque | Parade |
| --- | --- |
| ~~three.js alourdit le site collage~~ | **Caduc.** Le jeu a son propre dépôt et son propre domaine depuis l'extraction ; il n'y a plus de site collage à alourdir, et le script `npm run analyze` que citait cette ligne n'existe plus. |
| 60 fps pas tenus sur vieux matériel | Budget draw calls fixé dès la phase 1 ; test sur throttling CPU 4× à chaque phase. |
| Trop difficile pour un enfant de 6 ans | Gardien volontairement lent, but large, aide à la visée (aimant léger vers la cage), aucun échec. Test réel avec un enfant après la phase 2. |
| Le jeu casse la prod du collage | Développement sur branche dédiée, `main` reste déployable ; les 2 builds sont indépendants. |
| Contenu 3D chronophage | Tout procédural, pas de modélisation. Un personnage = ~40 lignes de JSX. |

---

## 7. Dépendances ajoutées (jeu uniquement)

```
three@^0.185          @react-three/fiber@^9.6      @types/three (dev)
```

`@react-three/drei` figurait ici au départ et a été **retiré** : aucune de ses
aides n'a servi.

Réutilisées depuis la racine : react 19, zustand, tailwind v4, vite-plugin-pwa,
canvas-confetti, vitest, playwright. **Aucun appel réseau**, conformément aux
conventions du projet.
