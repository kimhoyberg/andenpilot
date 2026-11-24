# Copilot på 5 minutter

En lille, frivillig læringsplatform, hvor kolleger lærer Microsoft 365 Copilot
ved at **gøre** ting – fem minutter ad gangen.

- Statisk side: ingen server, intet login, ingen tracking.
- Fremskridt og "tid sparet" gemmes kun i brugerens egen browser (localStorage).
  Du kan ikke se, hvad brugerne svarer.
- Ingen eksterne biblioteker eller skrifttyper.

## Se siden på din egen computer

Siden henter forløbene som filer, så den skal åbnes via en lille webserver
(den virker ikke, hvis du dobbeltklikker på `index.html`):

```bash
python3 -m http.server 8000
```

Åbn derefter <http://localhost:8000>.

## Læg siden på GitHub Pages

1. Gå til repoet på GitHub → **Settings** → **Pages**.
2. Under **Build and deployment** vælger du **Deploy from a branch**.
3. Vælg grenen og mappen `/ (root)`, og tryk **Save**.
4. Efter et minut eller to ligger siden på `https://<brugernavn>.github.io/<repo>/`.

## Mapperne

```
index.html              selve siden
css/style.css           design
js/                     koden (skal du normalt ikke røre)
js/komponenter/         de genbrugelige øvelser
forloeb/oversigt.json   hvilke forløb der vises på forsiden, og i hvilken rækkefølge
forloeb/<navn>.json     ét forløb pr. fil
media/                  dine skærmoptagelser
```

---

## Sådan tilføjer du et nyt forløb

Du skal kun lave **én ny fil** og tilføje **én linje**. Ingen kode.

### 1. Kopiér et eksisterende forløb

Kopiér fx `forloeb/teams-referat.json` til `forloeb/excel-overblik.json`.
Filnavnet bliver forløbets adresse, så brug kun små bogstaver, tal og
bindestreger (ingen æ, ø, å eller mellemrum).

### 2. Ret indholdet

Øverst i filen:

```json
{
  "titel": "Få overblik i et regneark",
  "varighed": 5,
  "program": "Excel",
  "trin": [ ... ]
}
```

`trin` er listen af skærme, brugeren går igennem – i den rækkefølge, de står.
Den faste skabelon er:

| # | Type        | Hvad brugeren ser |
|---|-------------|-------------------|
| 1 | `intro`     | Kort intro – én sætning |
| 2 | `video`     | Se det – lydløs skærmoptagelse i loop |
| 3 | `simulator`, `valg` (snart også `byg` og `skyder`) | Prøv det – en eller flere øvelser |
| 4 | `quiz`      | Tjek dig selv – ét spørgsmål |
| 5 | `goer-det`  | Gør det nu – opgave + kopiér prompten |
| 6 | `tid`       | Tid sparet |

Alle trin kan have en `titel` og en kort `tekst` (maks. 2–3 sætninger).
I al tekst kan du skrive `**fed**`. I Copilot-svar bliver linjer, der starter
med `- `, til punkter.

### 3. Tilføj forløbet til forsiden

Åbn `forloeb/oversigt.json` og tilføj filnavnet (uden `.json`):

```json
{
  "forloeb": [
    "teams-referat",
    "excel-overblik"
  ]
}
```

Gem, og genindlæs siden. Færdig.

> **Tip:** Får du en fejl, er der næsten altid et komma for meget eller for
> lidt i JSON-filen. Indsæt filen på <https://jsonlint.com> for at finde fejlen.

---

## Trin-typerne

### `intro`
```json
{ "type": "intro", "tekst": "Du lærer at … Det sparer dig for …" }
```

### `video` – skærmoptagelse
```json
{
  "type": "video",
  "titel": "Sådan ser det ud",
  "fil": "media/excel-overblik.mp4",
  "beskrivelse": "Hvad optagelsen skal vise (vises, indtil filen findes)."
}
```

### `simulator` – klik-simulator
`app` kan være `"teams"`, `"outlook"` eller `"word"`.
```json
{
  "type": "simulator",
  "app": "teams",
  "opgave": "Find Copilot-knappen i mødet, og klik på den.",
  "vindue": { ... indhold, se nedenfor ... },
  "prompts": [
    { "tekst": "Lav et kort referat af mødet", "svar": "**Referat**\n- Punkt 1\n- Punkt 2" }
  ],
  "faerdig": "Flot! …"
}
```
Valgfrit: `hint` (tekst ved første forkerte klik), `opgave2` (når panelet er åbnet),
`hilsen` (Copilots første linje), `fritekstSvar` (svaret, hvis brugeren skriver selv –
ellers bruges det første prompt-svar).

Indhold i `vindue`:

- **teams:** `titel`, `deltagere` (liste af fornavne), `udskrift` (liste af `{ "navn", "tid", "tekst" }`)
- **outlook:** `titel`, `fra`, `tid`, `emne`, `tekst` (liste af afsnit), evt. `indbakke` (liste af `{ "fra", "emne" }`)
- **word:** `titel` (filnavn), `overskrift`, `afsnit` (liste; et afsnit der starter med `## ` bliver en mellemrubrik)

### `valg` – vælg den bedste prompt
```json
{
  "type": "valg",
  "a": { "prompt": "Referat", "svar": "…" },
  "b": { "prompt": "Lav et kort referat i punktform …", "svar": "…" },
  "bedst": "b",
  "forklaring": "Hvorfor den ene er bedre."
}
```

### `quiz`
```json
{
  "type": "quiz",
  "spoergsmaal": "…?",
  "svar": ["Svar 1", "Svar 2", "Svar 3"],
  "rigtigt": 1,
  "forklaring": "…"
}
```
`rigtigt` tæller fra 0 – så `1` betyder det andet svar.

### `goer-det`
```json
{
  "type": "goer-det",
  "trin": ["Åbn …", "Klik på **Copilot**", "Sæt prompten ind"],
  "prompt": "Den prompt, der kopieres."
}
```

### `tid`
```json
{ "type": "tid", "normalt": 20, "medCopilot": 5, "gangePrMaaned": 4 }
```
Besparelsen (her (20 − 5) × 4 = 60 min) lægges til brugerens samlede tal på forsiden.

---

## Sådan tilføjer du en skærmoptagelse

1. Optag kort og lydløst – helst 10–20 sekunder, kun det vigtigste.
   (Windows: **Klippeværktøj** → **Optag**. Mac: **Cmd + Shift + 5**.)
2. Skjul rigtige navne, mails og kundedata, før du optager.
3. Gem som **mp4** (bedst) eller gif. Hold filen under ca. 3 MB, så den
   loader hurtigt på mobil.
4. Læg filen i mappen `media/` med **præcis** det filnavn, der står i
   forløbets `"fil"` – fx `media/teams-referat.mp4`.

Indtil filen findes, viser siden en stiplet pladsholder med filnavnet og en
beskrivelse af, hvad optagelsen skal vise.

## Nulstil eget fremskridt

Nederst på forsiden er der et **Start forfra**-link, når man har klaret mindst ét forløb.
