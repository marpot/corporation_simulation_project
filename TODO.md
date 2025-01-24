

### **I. Rozwój podstawowych umiejętności z programowania obiektowego (OOP)**

1. **Zrozumienie klas i obiektów:**
   - ✔️ Stwórz klasy takie jak `Employee`, `Department`, z atrybutami i metodami.
   - ✔️ Dodaj metodę `add_employee()` i `remove_employee()` w klasie `Department`, aby zarządzać pracownikami.
   - ❌ Stwórz klasę `Project` z odpowiednimi atrybutami i metodami, umożliwiającą przypisywanie pracowników do projektów (to będzie rozszerzenie później, zależne od rozwoju aplikacji).

2. **Dziedziczenie i klasy bazowe:**
   - ✔️ Stwórz klasę `Employee` oraz klasy `Manager` i `Ceo` z relacjami pomiędzy nimi
   - ❌ Zaimplementuj metodę `get_role()` w każdej klasie (`Ceo`, `Manager`, `Employee`), aby zwracała odpowiednią rolę.
   
3. **Polimorfizm i metody wirtualne:**
   - ✔️ Zaimplementuj polimorfizm w metodzie `get_role()` w klasach `Ceo`, `Manager`, `Employee`.
   - ❌ Dodaj dodatkowe metody specyficzne dla każdej klasy, np. `set_salary()` w `Employee`, aby różne role miały możliwość modyfikacji pensji.

4. **Encapsulacja i prywatność:**
   - ✔️ Zastosuj prywatne atrybuty, takie jak `__salary` w klasie `Employee`, i metody getter/setter.
   - ✔️ Wprowadź metodę `set_salary()` i `get_salary()` do klasy `Employee` (możliwość edycji pensji w zależności od roli).

---

### **II. Rozwój aplikacji FastAPI (Backend)**

1. **Podstawy FastAPI i HTTP Methods:**
   - ✔️ Stwórz podstawowe endpointy (POST, GET) dla zarządzania pracownikami (dodawanie, pobieranie).
   - ✔️ Zaimplementuj metodę `PUT` do aktualizacji danych pracownika (np. zmiana pensji, wieku).
   - ✔️ Dodaj metodę `DELETE` do usuwania pracowników.

2. **Walidacja danych z Pydantic:**
   - ✔️ Zaimplementuj walidację danych wejściowych przy pomocy Pydantic (np. wiek > 18, pensja > 0, walidacja `department_id`).
   - ✔️ Użyj `Pydantic` do weryfikacji danych wejściowych w endpointach (np. walidacja unikalności `id` lub sprawdzenie poprawności `ceo_id`).

3. **Zarządzanie zależnościami w FastAPI:**
   - ✔️ Skorzystaj z `Depends` w FastAPI do wstrzykiwania zależności, np. bazy danych i zarządzania danymi.
   - ❌ Dodaj wstrzykiwanie zależności, które wstrzykują obiekty bazy danych i pomocnicze funkcje (np. do obsługi relacji między tabelami).

4. **Tworzenie i dokumentowanie API (Swagger UI):**
   - ✔️ Skonfiguruj dokumentację API w Swagger UI (automatyczne generowanie dokumentacji).
   - ✔️ Dodaj przykłady użycia do każdego z endpointów (np. przykładowy JSON dla `POST` do dodania pracownika).

5. **Autoryzacja i uwierzytelnianie:**
   - ❌ Dodaj system logowania z JWT (np. tylko CEO może edytować pensje lub zmieniać dane działów).
   - ❌ Stwórz middleware do zabezpieczania endpointów (np. tylko managerowie mogą dodawać pracowników do działu).

---

### **III. Rozwój zaawansowanych funkcji i integracji**

1. **Połączenie z bazą danych (SQLAlchemy/SQLite/PostgreSQL):**
   - ✔️ Połącz aplikację z bazą danych (np. PostgreSQL), aby przechowywać dane o pracownikach, działach, pensjach.
   - ✔️ Zaimplementuj relację 1:N (jedno `Department` może mieć wielu `Employees`).

2. **Relacje między danymi w bazie (relacje 1:N, N:M):**
   - ✔️ Dodaj relację `Department` do bazy danych (relacja 1:N z `Employee`).
   - ✔️ Implementacja metod w klasie `Department`, które pozwolą na przypisywanie pracowników do działów (np. `add_employee_to_department()`).
   - ❌ Rozważ dodanie relacji N:M, np. przypisanie pracowników do projektów w przyszłości.

3. **Testowanie aplikacji:**
   - ❌ Napisz testy jednostkowe i integracyjne dla endpointów (np. testowanie dodawania pracownika, edytowania pensji).
   - ❌ Skorzystaj z frameworku testowego (np. pytest) do testowania endpointów i poprawności danych.

4. **Zarządzanie błędami i logowanie:**
   - ✔️ Dodaj system logowania błędów (np. logowanie błędów 400, 404, 500).
   - ✔️ Użyj FastAPI’s exception handlers do obsługi błędów (np. błędy walidacji danych).

---

### **IV. Optymalizacja i wdrożenie aplikacji**

1. **Optymalizacja aplikacji:**
   - ✔️ Zoptymalizuj zapytania do bazy danych (np. użyj `select_related` dla zagnieżdżonych danych).
   - ❌ Zaimplementuj mechanizm cache'owania dla endpointów, które zwracają duże ilości danych, np. listy pracowników.

2. **Wdrożenie aplikacji:**
   - ✔️ Skonfiguruj plik `Dockerfile` i uruchom aplikację w kontenerze Docker.
   - ✔️ Skonfiguruj serwer (np. Nginx jako reverse proxy i Uvicorn jako serwer aplikacji).
   - ❌ Użyj narzędzi do monitorowania aplikacji, takich jak Prometheus lub Grafana.

---

### **V. Utrzymanie i rozbudowa projektu**

1. **Rozbudowa funkcji:**
   - ❌ Dodaj dodatkowe funkcjonalności, takie jak generowanie raportów (np. raporty płacowe).
   - ❌ Ulepsz system autoryzacji, aby umożliwić bardziej zaawansowane role użytkowników.

2. **Szkolenie i dokumentacja:**
   - ✔️ Przygotuj szczegółową dokumentację dla programistów oraz użytkowników aplikacji.
   - ✔️ Stwórz instrukcję instalacji i uruchomienia aplikacji (np. w pliku `README.md`).

---

### **Podsumowanie optymalizacji:**
1. Skupiłem się na realizacji najważniejszych funkcji, takich jak poprawne zarządzanie relacjami w bazie danych oraz optymalizacja endpointów.
2. Doprecyzowałem plan rozwoju aplikacji o dodatkowe funkcje, jak np. mechanizm logowania czy system cache'owania.
3. Zapewnienie dobrej dokumentacji dla programistów i użytkowników pomoże w utrzymaniu i dalszym rozwoju aplikacji.

---
