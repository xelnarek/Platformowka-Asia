# ASIA: EPOKA MIAŻDŻENIA

Mobilna platformówka 2D w klimacie klasycznych przygodowych platformówek. Bohaterką jest Asia, a jej charakterystyczną umiejętnością jest **miażdżenie** — skok zakończony uderzeniem w ziemię, falą uderzeniową i niszczeniem kruchych przeszkód.

## Uruchomienie

Projekt nie wymaga bundlera ani bibliotek zewnętrznych.

- Otwórz `index.html` w przeglądarce.
- Aby uruchomić wersję instalowalną i offline, opublikuj repozytorium przez GitHub Pages: **Settings → Pages → Deploy from a branch → main → /(root)**.
- Po pierwszym otwarciu online Service Worker zapisze podstawowe pliki aplikacji w pamięci podręcznej.

## Sterowanie

| Akcja | Telefon | Klawiatura |
|---|---|---|
| Ruch | ◀ / ▶ | A / D lub strzałki |
| Skok | przycisk SKOK | Spacja / ↑ |
| Miażdżenie | przycisk MIAŻDŻ | X / ↓ |
| Taran | przycisk TARAN | Z / Shift |
| Pauza | przycisk Ⅱ | Escape |

Na telefonie zalecana jest orientacja pozioma. Sterowanie dotykowe ma osobne przyciski kierunku i akcji.

## Zawartość prototypu

- 3 grywalne poziomy pierwszego rozdziału: Dolina Paproci, Jaskinie Echa i Bagna Bąbelków.
- Sekwencyjne odblokowywanie poziomów i mapa postępu.
- Bursztyny, fragmenty skamielin i złote jajo na każdym poziomie.
- Rozbijane skały, ukryte przejścia oraz trzy osobne easter eggi: dinozaur naśladowca, komnata 8-bit i kapibarska mafia.
- Przeciwnicy patrolujący planszę oraz boss każdego poziomu.
- Skok, taran i miażdżenie z falą uderzeniową.
- Automatyczny zapis ukończonych poziomów, sekretów i odnalezionych easter eggów w localStorage.
- Podstawowe efekty dźwiękowe generowane lokalnie przez Web Audio.
- Skalowanie canvas, dotykowe sterowanie i klawiatura.
- Pamięć podręczna Service Worker do ponownego uruchamiania offline.

## Architektura

- `index.html` — semantyczna struktura ekranów i HUD.
- `styles.css` — responsywny interfejs, ekrany menu, mapa, pauza i kontrolery dotykowe.
- `game.js` — silnik Canvas 2D, fizyka gracza, kolizje, przeciwnicy, poziomy, znajdźki, bossowie i zapis.
- `manifest.webmanifest` — konfiguracja aplikacji instalowalnej.
- `sw.js` — cache aplikacji do trybu offline.
- `icon.svg` — ikona aplikacji.

## Zakres i uczciwy status

To pierwszy grywalny wycinek (vertical slice), a nie ukończona kampania 30 poziomów. Obecne trzy poziomy służą sprawdzeniu sterowania, fizyki, czytelności i pętli rozgrywki przed rozbudową kolejnych krain. Grafika postaci i świata jest na tym etapie rysowana proceduralnie w Canvas/CSS; docelowe ręcznie przygotowane sprite'y i pełne animacje są kolejnym etapem.

## Następne etapy

1. Testy na urządzeniach o różnych proporcjach i wydajności.
2. Dopracowanie kolizji, checkpointów, pułapek i zachowania bossów.
3. Oryginalne sprite'y Asi, przeciwników i animacje klatkowe.
4. Rozbudowa do pięciu krain i docelowo 30 poziomów.
5. Więcej sekretów, zagadek, strojów, encyklopedia i dodatkowe wyzwania.
