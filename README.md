# Appliance Service Desk

## Struktura bazy danych

- `users` - dane o użytkownikach.  
- `reports` - dane o zgłoszeniach.  

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

| Metoda      | Endpoint            | Opis       |
| -------------- | -------------------- | --------------- |
| POST    | /login          | Logowanie (login, password)     |
| GET   | /reports | Lista wszystkich zgłoszeń |
| GET   | /reports/userId | Zgłoszenia danego użytkownika |
