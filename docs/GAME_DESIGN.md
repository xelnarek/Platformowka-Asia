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

Rodzaje przeciwników powinny różnić się ruchem i reakcją na umiejętności, a nie tylko kolorem. Trafienia powodują wyraźny odrzut, błysk i krótkie ogłuszenie przeciwnika, jeśli przeżyje cios. Przeciwnik naziemny może patrolować lub skakać; powietrzny wymusza obserwację i zmianę pozycji; ciężki przeciwnik wymaga przerwania osłony albo ataku z góry. Szarżujący wróg i boss zapowiadają atak czytelnym sygnałem; ostrzeżenie bossa wskazuje również kierunek fali przy ziemi, którą można ominąć skokiem.

Bossowie mają różne wzorce ataków: Trzaskacz wysyła falę przy ziemi, Król Głazów wystrzeliwuje wachlarz odłamków, a Błotny Bulgot wyrzuca trzy łuki bąbelków. Każdy wzorzec otrzymuje osobny sygnał ostrzegawczy i czytelny efekt trafienia.

Każdy boss:
- ma własną sylwetkę i zestaw animacji,
- pokazuje czytelne przygotowanie ataku,
- ma ograniczoną liczbę punktów życia,
- reaguje na trafienia i zmianę fazy,
- pozostawia nagrodę i otwiera wyjście.

## Intro i oprawa wizualna

Start gry zawiera krótkie, pomijalne intro z lokalną ilustracją, animacją kamery, światłem i stopniowym pojawianiem się tytułu. Efekty respektują ustawienie ograniczenia animacji i nie blokują wejścia do gry dłużej niż kilka sekund.

Warstwy atmosfery, parallaxu, materiałów platform, poświat znajdziek i detali biomów są renderowane bez zewnętrznych bibliotek. Pozostajemy przy lekkim silniku Canvas 2D, dopóki migracja do większego frameworka nie przyniesie mierzalnej korzyści bez pogorszenia trybu offline i płynności.

## Mobile UX

- Docelowa orientacja: pozioma.
- Duże przyciski kierunkowe i akcji; możliwa regulacja ich rozmiaru i przezroczystości.
- Po wejściu/wyjściu z pełnego ekranu kontrolki dotykowe resetują przechwycony wskaźnik, a rozmiar canvasu i układ sterowania przeliczają się ponownie.
- Podstawowy atak ma czytelny, szerszy zasięg; hitbox i animacja zamachu muszą mieć tę samą długość. Kierunek zamachu zostaje zapamiętany w momencie naciśnięcia ataku, a animacje postaci mają osobne pozy dla patelni i maczugi.
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


## Aktualizacja zachowania przeciwników i animacji — v18

- Nietoperz zapowiada nurkowanie krótkim sygnałem wizualnym i dźwiękowym. Tor nurkowania jest wspólny dla rysowania oraz hitboxa, więc trafienie odpowiada temu, co gracz widzi.
- Plujak zatrzymuje się, ustawia w stronę bohaterki i zapowiada pocisk przed wystrzałem. Kieruje pocisk w miejsce, w którym Asia była w chwili ostrzeżenia, dzięki czemu ruch i skok pozwalają uniknąć trafienia.
- Asia otrzymuje delikatne rozciągnięcie podczas wznoszenia, pochylony profil w szarży oraz krótkie ściśnięcie po mocniejszym lądowaniu. Transformacja jest zakotwiczona przy stopach, aby nie przesuwać postaci po platformie.
- Taran zadaje obrażenia przeciwnikowi tylko raz na jedno użycie. Przeciwnicy opancerzeni wymagają dwóch trafień taranem zamiast znikać natychmiast.
- Po utracie ostatniego serca respawn czyści aktywne stany ataku, miażdżenia i tarana.
- Efekty trafień przeciwników powietrznych pojawiają się przy ich rzeczywistym hitboxie, a nie przy ziemi.


## Aktualizacja AI przeciwników i faz bossów — v19

- Hopper otrzymuje własny cykl: przygotowanie, wyskok z ruchem poziomym i powrót do patrolu. Wskaźnik przygotowania jest widoczny, a hitbox używa tej samej wysokości co rysowana postać.
- Faza druga bossów rozpoczyna się przy połowie zdrowia. Zmiana jest jednorazowa, wyraźnie sygnalizowana i zwiększa tempo kolejnych ataków oraz prędkość pocisków, nie skracając czasu ostrzeżenia.
- Aura oraz podpis FAZA II pomagają rozpoznać zmianę zachowania bossa.


## Aktualizacja interfejsu i oprawy — v20

- Menu główne otrzymuje bardziej uporządkowaną hierarchię: czytelny tytuł, wyraźne akcje, spokojniejsze statystyki profilu oraz spójne obramowania i światło.
- Karty rozdziałów pokazują numer rozdziału, biom, nazwę etapu, krótki opis, status dostępności i strażnika. Stan ukończenia, dostępności i blokady jest rozróżniony tekstem oraz stylem.
- HUD rozgrywki i kontrolki korzystają z jednego systemu powierzchni, obramowań i kontrastu; ustawienia i panele pauzy są stylistycznie spójne z menu.
- Układ mapy, menu i HUD ma osobne punkty dostosowania na telefonach, wąskich ekranach oraz w poziomym trybie gry. Zachowano istniejące zachowanie kontrolek, zapis postępu i silnik Canvas 2D.
- Zmieniono nazwę pamięci podręcznej Service Workera na v20, aby przeglądarka pobrała nowy interfejs po wdrożeniu.


## Aktualizacja oprawy postaci i biomów — v21

- Arkusz Asi zachowuje osiem pozycji wymaganych przez silnik (bez zmian indeksów): bezczynność, dwa kroki biegu, skok, miażdżenie, trafienie oraz dwa ataki. Nowy rysunek ma spójne kontury, wielowarstwowe cieniowanie, materiał ubrania, czytelniejszą twarz, włosy, pas i chustę.
- Widoczną postać nieznacznie powiększono i dodano delikatny cień, nie zmieniając hitboxów ani fizyki ruchu.
- Panoramy Doliny Paproci, Jaskiń Echa i Bagien Bąbelków otrzymały szersze, bogatsze kompozycje z mocniejszą głębią i odrębną paletą. Dłuższe płótna pozwalają zachować parallax podczas większej części poziomu.
- Podłoże i platformy mają osobne materiały dla każdego biomu; cienie kontaktowe poprawiają osadzenie przeciwników, a pełzające stworzenia otrzymały ruch nóg.
- Cache offline podniesiono do v21. Mechanika walki, hitboxy, fizyka i rozmiar logicznego świata pozostają bez zmian.


## Gameplay i nagrody za eksplorację — v22

Inspiracją są sprawdzone rozwiązania klasycznych platformówek pokroju Prehistorik 2: eksploracja zamiast presji licznika jedzenia, sekrety odkrywane uderzeniem, nagrody za pokonanych przeciwników, zapas jedzenia, różne bronie i satysfakcjonujące serie trafień. Wdrożono własną wersję tych pomysłów w istniejącym świecie Asi:

- Ukryte skrytki w każdym z trzech poziomów dają nagrody po uderzeniu w odpowiedni fragment podłoża albo po trafieniu falą miażdżenia. Odkryte skrytki są zapamiętywane lokalnie, więc nie można farmić ich przy każdym powtórzeniu etapu.
- Pokonani przeciwnicy zostawiają fragmenty skamielin; co trzeci może upuścić jedzenie. Boss po pokonaniu rozsypuje większy zestaw kości i przekąskę.
- Zebranie sześciu fragmentów kości przywraca serce. Jedzenie leczy, a przy pełnym zdrowiu zamienia się w bursztyn.
- Szybkie pokonywanie kolejnych przeciwników buduje serię do pięciu eliminacji i zapewnia dodatkowy bursztyn. Seria wygasa po krótkiej przerwie.
- Atak można przytrzymać, aby powtarzać zamachy. Strzałki góra/dół kierują ciosem; na dotyku gra automatycznie podnosi broń przy pobliskim nietoperzu.
- Zachowano brak obowiązkowego limitu zebranego jedzenia i brak presji zegara. Jedzenie jest nagrodą za eksplorację i ryzyko, a nie blokadą przejścia etapu.
- Zapis gry został rozszerzony kompatybilnie o listę odkrytych skrytek. Poprzednie zapisy nadal są poprawnie odczytywane.
