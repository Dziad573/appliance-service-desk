# Lokalne środowisko development – Appliance Service Desk

## Co zawiera ta wersja

- Ten sam frontend i backend co w projekcie.
- Lokalną bazę SQLite (`backend/data/development.sqlite`).
- Moduł magazynowy: marki, katalog urządzeń/części, magazyny i stany.
- Formularz reklamacji z wyborem urządzenia z katalogu lub zgłoszeniem urządzenia spoza katalogu.
- Automatyczne tworzenie schematu lokalnej bazy przy starcie backendu.
- Skrypt danych demonstracyjnych.

Lokalna baza nie łączy się z Azure i nie zużywa zasobów Azure SQL.

## Wymagania

- Node.js LTS (zalecane Node 20 lub nowszy).
- npm.

## Pierwsze uruchomienie – Windows

1. Rozpakuj cały projekt.
2. Otwórz terminal w katalogu `backend` i wykonaj `npm install`.
3. Otwórz drugi terminal w katalogu `frontend` i wykonaj `npm install`.
4. Opcjonalnie, w katalogu `backend`, wykonaj `npm run seed:local` – utworzy konta testowe, przykładowe marki, urządzenia, części, magazyny i początkowe stany.
5. Wróć do katalogu głównego i uruchom `start.bat`.
6. Otwórz `http://localhost:3000`.

Można też uruchomić backend i frontend osobno: `npm start` w `backend` oraz `npm start` w `frontend`.

## Konta demonstracyjne

| Rola | Login | Hasło |
|---|---|---|
| Administrator | `admin` | `admin123` |
| Klient | `customer` | `customer123` |

Konta i dane demonstracyjne są przeznaczone wyłącznie do lokalnego developmentu. Nie używaj tych haseł w środowisku współdzielonym ani produkcyjnym.

## Lokalna baza

Domyślnie backend wybiera SQLite, gdy `DB_DIALECT` nie jest ustawione. Plik bazy powstaje w `backend/data/development.sqlite`. Katalog `backend/data` jest ignorowany przez Git.

Opcjonalnie skopiuj `backend/.env.example` do `backend/.env`. Domyślne ustawienie to:

```env
DB_DIALECT=sqlite
```

Aby rozpocząć od czystej lokalnej bazy, zatrzymaj backend i usuń `backend/data/development.sqlite`. Następny start utworzy pusty schemat. Ponowne wykonanie `npm run seed:local` doda dane demonstracyjne.

## Przełączenie na Azure SQL

1. Zrób kopię zapasową produkcyjnej bazy.
2. Wykonaj `database/inventory-migration.sql` na docelowej bazie Azure SQL. Skrypt dodaje tabele magazynowe oraz kolumny `item_id` i `custom_device` do `reports`.
3. Skopiuj `backend/.env.example` do `backend/.env` i ustaw `DB_DIALECT=mssql` oraz `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` i odpowiednie opcje TLS.
4. Uruchom backend ponownie.

**Ważne:** backend wykonuje `sequelize.sync()` wyłącznie dla SQLite. Nie wykonuje automatycznego `sync` ani `alter` na Azure. Zmiany schematu produkcyjnego należy wprowadzać kontrolowanymi migracjami SQL.

Nie ma automatycznej synchronizacji danych pomiędzy SQLite i Azure. Dane testowe pozostają lokalne.

## Uwagi

- Moduł magazynowy jest częścią tej samej aplikacji, a nie osobną wersją.
- Ceny zakupu i sprzedaży są zapisane na pozycjach katalogowych jako dane dostępne do wykorzystania przez moduł wycen.
- Endpointy magazynowe wymagają dalszego zabezpieczenia autoryzacją backendową przed udostępnieniem aplikacji poza lokalnym środowiskiem. Samo ukrycie widoku w React nie jest zabezpieczeniem API.
