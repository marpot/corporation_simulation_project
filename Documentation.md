# Dokumentacja projektu

## Wstęp

Ten projekt jest aplikacją **FastAPI**, która zarządza pracownikami, CEO, departamentami i menedżerami. 
Aplikacja umożliwia:
- dodawanie,
- listowanie,
- pobieranie danych o pracownikach, CEO, departamentach i menedżerach.

---

## Struktura projektu

Projekt składa się z następujących folderów i plików:

- **`alembic.ini`**: plik konfiguracyjny dla Alembic, narzędzia do zarządzania migracjami bazy danych.
- **`app/`**: folder zawierający aplikację FastAPI.
  - **`main.py`**: plik główny aplikacji FastAPI.
  - **`database.py`**: plik konfiguracyjny dla bazy danych.
  - **`base.py`**: plik zawierający bazową klasę dla modeli bazy danych.
  - **`controllers/`**: folder zawierający kontrolery aplikacji.
    - **`employee_controller.py`**: plik kontrolera dla pracowników.
  - **`models/`**: folder zawierający modele bazy danych.
    - **`employee.py`**: plik modelu pracownika.
    - **`ceo.py`**: plik modelu CEO.
    - **`department.py`**: plik modelu departamentu.
    - **`manager.py`**: plik modelu menedżera.
    - **`__init__.py`**: plik inicjalizacyjny dla folderu models.
  - **`schemas/`**: folder zawierający schematy danych.
    - **`__init__.py`**: plik inicjalizacyjny dla folderu schemas.
    - **`ceo.py`**: plik schematu CEO.
    - **`department.py`**: plik schematu departamentu.
    - **`employee.py`**: plik schematu pracownika.
    - **`manager.py`**: plik schematu menedżera.
  - **`services/`**: folder zawierający usługi aplikacji.
    - **`employee_service.py`**: plik usługi dla pracowników.

---

## Modele bazy danych

Aplikacja używa następujących modeli bazy danych:

- **Employee**: model pracownika.
- **CEO**: model CEO.
- **Department**: model departamentu.
- **Manager**: model menedżera.

---

## Schematy danych

Aplikacja używa następujących schematów danych:

### CEO:
- **`CEOBasic`**: schemat podstawowy dla CEO.
- **`CEOCreate`**: schemat tworzenia CEO.
- **`CEOOut`**: schemat wyjściowy dla CEO.

### Department:
- **`DepartmentBase`**: schemat podstawowy dla departamentu.
- **`DepartmentCreate`**: schemat tworzenia departamentu.
- **`Department`**: schemat wyjściowy dla departamentu.

### Employee:
- **`EmployeeBase`**: schemat podstawowy dla pracownika.
- **`EmployeeCreate`**: schemat tworzenia pracownika.
- **`EmployeeOut`**: schemat wyjściowy dla pracownika.

### Manager:
- **`ManagerBase`**: schemat podstawowy dla menedżera.
- **`ManagerCreate`**: schemat tworzenia menedżera.
- **`ManagerOut`**: schemat wyjściowy dla menedżera.

---

## Usługi

Aplikacja używa następujących usług:

- **`EmployeeService`**: usługa dla pracowników.

---

## Kontrolery

Aplikacja używa następujących kontrolerów:

- **`EmployeeController`**: kontroler dla pracowników.

---

## API

Aplikacja oferuje następujące API:

### Pracownicy:
- **POST** `/employees`: dodaje nowego pracownika.
- **GET** `/employees`: zwraca listę wszystkich pracowników.
- **GET** `/employees/{id}`: zwraca szczegóły pracownika o podanym ID.

### CEO:
- **POST** `/ceos`: dodaje nowego CEO.
- **GET** `/ceos`: zwraca listę wszystkich CEO.
- **GET** `/ceos/{id}`: zwraca szczegóły CEO o podanym ID.

### Departamenty:
- **POST** `/departments`: dodaje nowy departament.
- **GET** `/departments`: zwraca listę wszystkich departamentów.
- **GET** `/departments/{id}`: zwraca szczegóły departamentu o podanym ID.

### Menedżerowie:
- **POST** `/managers`: dodaje nowego menedżera.
- **GET** `/managers`: zwraca listę wszystkich menedżerów.
- **GET** `/managers/{id}`: zwraca szczegóły menedżera o podanym ID.

---
