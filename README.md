# Appliance Service Desk

## Struktura bazy danych

- `users` - dane o użytkownikach (rola, login, hasło).
- `reports` - dane o zgłoszeniach reklamacyjnych i serwisowych.
- `comments` - komentarze do zgłoszeń (z obsługą wątków/odpowiedzi).
- `report_status_history` - historia zmian statusów oraz akcji (wstrzymania/wznowienia) zgłoszeń.

## Technologie

- **Node.js** + **Express** - serwer, API REST.  
- **React** - frontend.  
- **MSSQL** - silnik bazy danych.

## Uruchomienie projektu

1. **Baza danych**  
   - Zaloguj się do bazy

2. **Backend**  
   - Przejdź do katalogu `backend`  
   - Zainstaluj npm: `npm install`  
   - Uruchom serwer: `node index.js` (domyślnie na `http://localhost:3001`)  

3. **Frontend**  
   - Przejdź do katalogu `frontend`  
   - Zainstaluj npm: `npm install`  
   - Uruchom frontend: `npm start` (domyślnie na `http://localhost:3000`)
  
## REST API - dostępne endpointy

| Metoda | Endpoint | Opis |
| :--- | :--- | :--- |
| **GET** | `/` | Sprawdzenie działania API ("USWB działa") |
| **POST** | `/login` | Logowanie użytkownika (login, password) |
| **POST** | `/register` | Rejestracja nowego użytkownika |
| **GET** | `/reports` | Lista wszystkich zgłoszeń |
| **POST** | `/reports` | Tworzenie nowego zgłoszenia |
| **GET** | `/reports/:userId` | Zgłoszenia danego użytkownika |
| **GET** | `/report/:reportId` lub `/reports/detail/:reportId` | Pobieranie pojedynczego zgłoszenia po ID |
| **GET** | `/reports/:reportId/status-history` | Historia statusów danej reklamacji |
| **PATCH** | `/reports/:reportId/status` | Zmiana statusu reklamacji |
| **POST** | `/reports/:reportId/pause` | Wstrzymanie procesu reklamacji |
| **POST** | `/reports/:reportId/resume` | Wznowienie procesu reklamacji |
| **PATCH** | `/reports/:reportId/service-notes` | Edycja danych serwisowych (diagnoza / rezultat naprawy) |
| **GET** | `/reports/:reportId/comments` | Pobieranie komentarzy do zgłoszenia |
| **POST** | `/reports/:reportId/comments` | Dodawanie nowego komentarza (lub odpowiedzi) |
