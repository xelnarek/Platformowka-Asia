# Karta projektu — ASIA: EPOKA MIAŻDŻENIA

## Kierunek

Mobilna, pozioma platformówka 2D inspirowana energią klasycznych gier przygodowych w stylu *Prehistorik*, ale z własnym światem, bohaterką, humorem i mechaniką walki. Priorytetem jest czytelna, responsywna rozgrywka na ekranie dotykowym. Wersja przeglądarkowa ma działać bez konta i bez połączenia z serwerem.

**Filary projektu**
1. Sterowanie reaguje natychmiast i nie walczy z graczem.
2. Skok i miażdżenie są satysfakcjonujące dzięki wyraźnemu przygotowaniu, uderzeniu, fali i reakcji otoczenia.
3. Każdy poziom nagradza eksplorację: znajdźki, skróty, ukryte pomieszczenia i małe żarty środowiskowe.
4. Każdy biom ma inne kolory, dekoracje, pułapki i zachowania przeciwników.
5. Humor wynika z animacji i sytuacji, a nie z długich dialogów.

## Bohaterka i zestaw ruchów

Asia: zwinna, odważna bohaterka o kreskówkowej, rozpoznawalnej sylwetce. Docelowa grafika powinna zachować jej charakterystyczny wygląd, ale używać spójnych proporcji i stylizacji pasującej do świata gry.

- **Ruch:** przyspieszanie, hamowanie, kontrola kierunku w powietrzu.
- **Skok:** podstawowy skok z czytelnym łukiem i przewidywalnym lądowaniem.
- **Miażdżenie:** z powietrza szybkie zejście w dół, uderzenie, fala obszarowa, kruszenie wybranych obiektów.
- **Taran:** krótki ruch poziomy z czasem odnowienia; rozbija słabe przeszkody i może przerwać atak.
- **Atak:** patelnia do walki wręcz, ograniczona liczba mocnych uderzeń maczugą oraz kościany bumerang wracający do bohaterki po rzucie.
- **Upadek w przepaść:** przywraca bohaterkę bezpośrednio do ostatniego aktywowanego punktu kontrolnego; stan ruchu zostaje wyzerowany, aby uniknąć ponownego wpadnięcia.
- **Atak:** patelnia do walki wręcz, ograniczona liczba mocnych uderzeń maczugą oraz kościany bumerang wracający do bohaterki.
- **Rozwój:** ulepszenia zasięgu fali, siły kruszenia i parametrów tarana. Ulepszenia nie mogą odbierać wyzwania.

Miażdżenie nie może pokonywać każdego przeciwnika jednym kliknięciem. Ciężcy wrogowie i bossowie mają czytelne okna ataku oraz wymagają odpowiedniego timingu.

## Kampania docelowa — 30 poziomów

Każda kraina zawiera pięć poziomów eksploracyjnych i szósty poziom z bossem.

### I. Dolina Paproci
1. Pobudka pod paprocią — nauka ruchu i skoku.
2. Most, który nie wytrzymał — szczeliny i ruchome platformy.
3. Głód małego tyranozaura — pierwsze starcia i zbieranie bursztynu.
4. Jaskinia Głupich Ech — ukryte przejścia.
5. Bagienny skrót — próba umiejętności i sekretna ścieżka.
6. Trzaskacz — boss uczący timingu miażdżenia.

### II. Jaskinie Echa
7. Wejście bez wyjścia — kryształowe korytarze.
8. Nietoperzy koncert — przeciwnicy powietrzni.
9. Most z korzeni — platformy nad przepaścią.
10. Komnata odbić — fałszywe ściany i zagadki.
11. Stare wyrobisko — kruszenie skał i skróty.
12. Król Głazów — boss odporny na zwykłe ataki.

### III. Bagna Bąbelków
13. Kładka z grzybów — sprężyste powierzchnie.
14. Woda, która bulgocze — ruchome zagrożenia.
15. Wielki komar — szybki przeciwnik i uniki.
16. Zielona mgła — krótkie sekcje z ograniczoną widocznością.
17. Dom pod korzeniem — sekrety i ukryte skarby.
18. Błotny Bulgot — boss zmieniający ukształtowanie areny.

### IV. Kanion Kości
19. Szkieletowy trakt — wąskie platformy i wiatr.
20. Kościany dźwig — sekwencje ruchomych mechanizmów.
21. Stado małych łobuzów — kontrola grup przeciwników.
22. Pękająca półka — szybkie decyzje i spadające głazy.
23. Oko kanionu — większa sekcja eksploracyjna.
24. Strażnik Czaszki — boss z atakami obszarowymi.

### V. Wulkan Wielkiego Kła
25. Gorące powitanie — lawa i gejzery.
26. Rury pradawnych — mechanizmy i przełączniki.
27. Kuźnia pod ziemią — trudniejsi przeciwnicy i kruszenie.
28. Ostatnia przeprawa — połączenie poznanych mechanik.
29. Serce wulkanu — finałowe przygotowanie.
30. Wielki Kieł — finał kampanii i sekretne zakończenie.

Powyższa lista jest planem docelowym. W repozytorium zaimplementowane są obecnie pierwsze trzy poziomy jako grywalny wycinek; pozostałe pozycje nie są jeszcze gotowe.

## Znajdźki i sekrety

- **Bursztyn:** podstawowa waluta do odblokowywania kosmetyki i dodatków.
- **Fragmenty skamielin:** kolekcja z wpisami w encyklopedii.
- **Złote jajo:** rzadki przedmiot, docelowo komplet prowadzi do sekretnej krainy.
- **Runy:** artefakty do rozwoju umiejętności.
- **Ukryte przejścia:** wymagają obserwacji, miażdżenia lub znalezienia przełącznika.
- **Easter eggi:** małe scenki, postacie i lokacje niezwiązane bezpośrednio z główną trasą.

W aktualnym wycinku znajdują się trzy specjalne spotkania: dinozaur naśladowca, komnata 8-bit oraz kapibarska mafia. Odkrycia są zapisywane lokalnie.

## Przeciwnicy i bossowie

Rodzaje przeciwników powinny różnić się ruchem i reakcją na umiejętności, a nie tylko kolorem. Przeciwnik naziemny może patrolować lub skakać; powietrzny wymusza obserwację i zmianę pozycji; ciężki przeciwnik wymaga przerwania osłony albo ataku z góry. Szarżujący wróg i boss zapowiadają atak czytelnym sygnałem; ostrzeżenie bossa wskazuje również kierunek fali przy ziemi, którą można ominąć skokiem.

Każdy boss:
- ma własną sylwetkę i zestaw animacji,
- pokazuje czytelne przygotowanie ataku,
- ma ograniczoną liczbę punktów życia,
- reaguje na trafienia i zmianę fazy,
- pozostawia nagrodę i otwiera wyjście.

## Mobile UX

- Docelowa orientacja: pozioma.
- Duże przyciski kierunkowe i akcji; możliwa regulacja ich rozmiaru i przezroczystości.
- Lewa/prawa ręka: docelowo alternatywne rozmieszczenie kontrolek.
- Pauza jednym dotknięciem; po powrocie z aplikacji gra nie rusza bez zgody.
- HUD pokazuje tylko serca, bursztyny i skamieliny; reszta informacji jest kontekstowa.
- Obsługa różnych proporcji ekranu, wycięć i bezpiecznych obszarów.
- Wydajność: cel 60 FPS, ograniczone cząsteczki, skalowanie efektów i brak ciężkich zależności.

## Zapis i prywatność

Postęp jest przechowywany w `localStorage` na urządzeniu. Prototyp nie wysyła danych na serwer. Usunięcie danych witryny może skasować zapis; w dalszym etapie należy dodać eksport/import zapisu albo synchronizację opcjonalną.

## Kryteria akceptacji prototypu

- Można ukończyć każdy z trzech dostępnych poziomów.
- Gracz nie przechodzi przez zwykłe platformy i nie blokuje się na rozbijalnych skałach.
- Miażdżenie działa z powietrza, zadaje obrażenia i wywołuje efekt po lądowaniu.
- Upadek w szczelinę nie zawiesza gry i przywraca gracza w bezpiecznym miejscu.
- Boss wymaga aktywnego pokonania; samo dojście do wyjścia nie kończy poziomu.
- Znajdźki, sekretne odkrycia i ukończone poziomy są zapisywane.
- Sterowanie dotykowe działa w poziomie, a klawiatura pozostaje dostępna do testów.
- Wczytanie aplikacji po pierwszej wizycie może odbyć się z pamięci podręcznej offline.

## Kolejność dalszych prac

1. Testy fizyki i kolizji na rzeczywistym telefonie.
2. Korekty trudności, tempa przeciwników, bossów i pułapek.
3. Oryginalne sprite'y oraz animacje klatkowe Asi, wrogów i efektów.
4. Ulepszenia umiejętności, stroje, encyklopedia i system wyników.
5. Rozbudowa kampanii do 5 krain / 30 poziomów.
