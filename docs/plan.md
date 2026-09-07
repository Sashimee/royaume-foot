# 👑⚽ Plan — « Royaume Foot » : jeu 3D princesses + football

Jeu navigateur **100 % frontend**, hébergé sur **GitHub Pages**, pensé pour des
enfants de **6–7 ans**. Aucun compte, aucun serveur, aucune donnée qui sort de
l'appareil — même philosophie que le Pic Collage Maker.

**Nom proposé :** *Royaume Foot* (alt. : *Tiara Cup*, *Princess Kick*).

---

## 1. Décisions structurantes

| Question | Décision | Pourquoi |
| --- | --- | --- |
| Où ça vit ? | **Repo dédié `royaume-foot`**, servi sur `https://sashimee.github.io/royaume-foot/` | Historique, CI, issues et cycle de release propres au jeu. *(Une première version a vécu dans `Pic-collage/game/` ; déplacée ici sur demande.)* |
| Framework 3D | **three.js 0.185** + **@react-three/fiber 9.6** (drei retiré : inutilisé) | R3F 9 est compatible React 19 (peer `react >=19 <19.3`, on est en 19.2). On garde React/TS/Vite/Tailwind/zustand déjà maîtrisés — pas de 2ᵉ stack à apprendre. |
| Physique | **Maison, arcade** (sphère vs plan/AABB, gravité + rebond + friction) | Rapier = ~1 Mo de WASM pour un besoin trivial. Un ballon arcade « qui pardonne » est *meilleur* pour des enfants qu'une simu réaliste. Rapier reste l'option B si on veut casser des tours de cubes (phase 4). |
| Assets 3D | **Zéro fichier .glb au départ** : princesses construites en primitives (cône = robe, sphère = tête, capsule = bras) en low-poly kawaii | Chargement instantané, aucun pipeline d'asset, style cohérent, palette 100 % paramétrable → la customisation devient gratuite. glTF possible plus tard sans changer l'archi. |
| Audio | Web Audio synthétisé (sifflet, « pop », étincelles) + 2–3 samples courts CC0 (foule, fanfare) | Reste léger, pas de dépendance (`howler` non nécessaire). |
| Sauvegarde | `localStorage` (progression, étoiles, tenue) | Pas de compte, conforme à la règle « rien ne quitte l'appareil ». |

> **Note :** la première implémentation vivait en sous-app dans le repo
> `Pic-collage` (`game/`, servi sur `/Pic-collage/game/`). Elle a été extraite
> ici : `base` passe de `/Pic-collage/game/` à `/royaume-foot/`, le build n'a
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
- **Robes / capes / couronnes / chaussures à paillettes.**
- **Ballons** : classique, licorne, arc-en-ciel, étoile, ballon-gâteau.
- **Stades** : prairie, château, plage, royaume des glaces, nuit étoilée.
- **Mascotte** qui court sur le terrain : chat, licorne, dragon bébé.

---

## 3. Architecture technique

```
game/
├── index.html                # entrée séparée
├── vite.config.ts            # base '/Pic-collage/game/', outDir '../dist/game', emptyOutDir:false
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
    ├── three/
    │   ├── Scene.tsx         # <Canvas>, lumières, dpr, caméra
    │   ├── Pitch.tsx         # terrain, but, filet, décor du stade
    │   ├── Princess.tsx      # avatar procédural paramétré par la tenue
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
- Chaque mini-jeu en **`lazy()` / chunk séparé**.

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

**Phase 3 — Contenu — 🟡 les 3 mini-jeux sont faits ; décors restants**
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
- ⬜ Carte du royaume.

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

**Phase 5 — Qualité (1 j) — ⬜ à faire**
Passe perf sur mobile réel, accessibilité (contrastes, `prefers-reduced-motion`,
pas de flash rapide), test avec un enfant de l'âge cible.

> **C'est maintenant la chose qui manque le plus.** Les phases 3ter et 4 ont
> ajouté quatre gardiens, un mini-jeu et une coupe sur un équilibrage validé par
> **une seule** session avec un enfant. La question que le plan se posait déjà —
> « qu'est-ce qui a été difficile ou pas compris ? » — vaut plus que n'importe
> quelle fonctionnalité restante, et elle vaut maintenant pour cinq façons de
> jouer au lieu de trois.

---

## 5. CI / déploiement

Un seul job Pages, deux builds :

```yaml
- run: npm run build        # app collage  → dist/
- run: npm run build:game   # jeu          → dist/game/  (emptyOutDir: false)
- uses: actions/upload-pages-artifact@v3
  with: { path: ./dist }
```

`build:game` = `vite build -c game/vite.config.ts`. Le `tsc -b` global couvre le
sous-projet via une référence dans `tsconfig.json`. Rien à changer pour l'app
collage ; en cas de souci sur le jeu, on retire une ligne du workflow.

**Attention** : le service worker de l'app collage a pour scope `/Pic-collage/`
et englobe donc `/game/`. On exclut explicitement `game/` de ses `globPatterns`
avant d'ajouter le SW du jeu (phase 4), sinon les deux se marchent dessus.

---

## 6. Risques & garde-fous

| Risque | Parade |
| --- | --- |
| three.js alourdit le site collage | Entrées et bundles séparés — le collage n'importe jamais three. Vérifié via `npm run analyze`. |
| 60 fps pas tenus sur vieux matériel | Budget draw calls fixé dès la phase 1 ; test sur throttling CPU 4× à chaque phase. |
| Trop difficile pour un enfant de 6 ans | Gardien volontairement lent, but large, aide à la visée (aimant léger vers la cage), aucun échec. Test réel avec un enfant après la phase 2. |
| Le jeu casse la prod du collage | Développement sur branche dédiée, `main` reste déployable ; les 2 builds sont indépendants. |
| Contenu 3D chronophage | Tout procédural, pas de modélisation. Un personnage = ~40 lignes de JSX. |

---

## 7. Dépendances ajoutées (jeu uniquement)

```
three@^0.185          @react-three/fiber@^9.6      @react-three/drei@^10.7
@types/three (dev)
```

Réutilisées depuis la racine : react 19, zustand, tailwind v4, vite-plugin-pwa,
canvas-confetti, vitest, playwright. **Aucun appel réseau**, conformément aux
conventions du projet.
