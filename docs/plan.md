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

**Phase 3 — Contenu — 🟡 en cours**
- ✅ **Mini-jeu 2 « Gardienne du château »** : la princesse est en cage, le
  dragon tire. Contrôle par glissement direct (elle suit le doigt le long de la
  ligne), tir **télégraphié** par un anneau de visée une seconde avant la
  frappe — c'est ce qui rend le mode jouable à 6 ans. Sélecteur de mode au
  menu, i18n 6 langues, harnais de difficulté dédié, tests e2e.
- ⬜ Mini-jeu 3 « Course aux étoiles », 3 stades, mascottes, carte du royaume.

> **Écart :** un seul des deux mini-jeux prévus. Livrer le second à moitié aurait
> coûté la qualité du premier ; la trajectoire du ballon en mode gardienne est
> analytique (et non intégrée) pour garantir que le ballon atterrit *exactement*
> là où l'anneau l'a promis — un télégraphe qui ment est pire que pas de
> télégraphe.

**Phase 4 — Fête finale (2 j)**
Casse-tour, Coupe du Royaume + trophée, PWA (manifest + SW à scope
`/Pic-collage/game/`, installable), icônes, écran de fin.

**Phase 5 — Qualité (1 j)**
Tests unitaires physique/visée/score, smoke Playwright, passe perf sur mobile,
accessibilité (contrastes, `prefers-reduced-motion`, pas de flash rapide).

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
