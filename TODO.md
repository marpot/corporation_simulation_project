---

### **I. Rozwój podstawowych umiejętności z programowania obiektowego (OOP)**

1. **Zrozumienie klas i obiektów:**
   - ✔️  Stwórz klasy takie jak `Employee`, `Department`, z atrybutami i metodami.
   - ❌ Stworzenie klasy `Project`  z atrybutami i metodami
   - ❌ Dodaj metody do klasy `Department`, które zarządzają pracownikami, np. `add_employee()` i `remove_employee()`. 

2. **Dziedziczenie i klasy bazowe:**
   - ✔️ Stwórz klasę `Employee`, oraz klasy `Manager` i `Ceo` dziedziczące po `Employee`. 
   - ❌ Dodaj metodę `get_role()` w klasach `Ceo`, `Manager`, `Employee`.

3. **Polimorfizm i metody wirtualne:**
   - ✔️ Polimorfizm w metodzie `get_role()` w klasach `Ceo`, `Manager`, `Employee`. 
   - ❌ Dodaj metody, które różnią się w zależności od klasy.

4. **Encapsulacja i prywatność:**
   - ✔️ Zastosowanie prywatnych atrybutów (np. `__salary` w klasie `Employee`) i metod getter/setter.
   - ❌ Wprowadź metodę `set_salary()` i `get_salary()` do klasy `Employee`.

---

### **II. Rozwój aplikacji FastAPI (Backend)**

1. **Podstawy FastAPI i HTTP Methods:**
   - ✔️ Stwórz podstawowe endpointy (POST, GET) dla zarządzania pracownikami (dodawanie, pobieranie). 
   - ❌ Rozszerz endpointy o dodatkowe metody, np. `PUT` do aktualizacji danych pracownika oraz `DELETE` do usuwania.

2. **Walidacja danych z Pydantic:**
   - ✔️ Zaimplementuj walidację danych wejściowych dla endpointów (np. wiek, pensja).
   - ❌ Użyj `Pydantic` do weryfikacji danych, by sprawdzić, czy dane są poprawne (np. wiek > 18, pensja > 0).

3. **Zarządzanie zależnościami w FastAPI:**
   - ✔️ Skorzystaj z `Depends` w FastAPI do wstrzykiwania zależności (np. baza danych). 
   - ❌ Dodaj zależności do endpointów, które wstrzykują obiekty bazy danych lub klasy pomocnicze.

4. **Tworzenie i dokumentowanie API (Swagger UI):**
   - ✔️ Skonfiguruj dokumentację API w Swagger UI.
   - ❌ Dodaj przykłady użycia do każdego z endpointów w Swagger UI.

5. **Autoryzacja i uwierzytelnianie:**
   - ❌ Stwórz prosty system logowania za pomocą JWT i zabezpiecz endpointy (np. tylko CEO może edytować pensje).

---

### **III. Rozwój zaawansowanych funkcji i integracji**

1. **Połączenie z bazą danych (SQLAlchemy/SQLite/PostgreSQL):**
   - ✔️ Połącz aplikację z bazą danych (np. PostgreSQL) w celu przechowywania danych o pracownikach.

2. **Relacje między danymi w bazie (relacje 1:N, N:M):**
   - ❌ Dodaj relację `Department` do bazy danych (relacja 1:N z `Employee`).
   - ❌ Dodaj metodę zarządzania relacją `Department` w bazie danych (np. przypisywanie pracowników do działów).

3. **Testowanie aplikacji:**
   - ❌ Napisz testy jednostkowe i integracyjne dla swoich endpointów (np. testowanie dodawania pracownika, edytowania pensji).

4. **Zarządzanie błędami i logowanie:**
   - ❌ Skonfiguruj system logowania błędów i ważnych zdarzeń aplikacji.

---

### **IV. Optymalizacja i wdrożenie aplikacji**

1. **Optymalizacja aplikacji:**
   - ❌ Dodaj mechanizm cache'owania do endpointów, które zwracają dużą liczbę danych.

2. **Wdrożenie aplikacji:**
   - ✔️ Stwórz plik Dockerfile i skonfiguruj aplikację do uruchomienia w kontenerze Docker.
   - ✔️ Skonfiguruj serwer (np. użyj Nginx jako reverse proxy i Uvicorn jako serwer aplikacji).

---

### **V. Utrzymanie i rozbudowa projektu**

1. **Rozbudowa funkcji:**
   - ❌ Dodaj nowe funkcje, jak generowanie raportów finansowych, bardziej zaawansowane mechanizmy autoryzacji.

2. **Szkolenie i dokumentacja:**
   - ❌ Przygotowanie aplikacji do używania przez innych programistów, stworzenie instrukcji instalacji i użytkowania.

---

Zaktualizowałem plan, aby uwzględnić dodanie relacji `Department` w bazie danych. Jeśli będziesz chciał coś dodać lub zmienić, daj znać!