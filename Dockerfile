# Etap 1: Budowanie aplikacji
FROM python:3.12-slim AS builder

# Instalowanie zależności systemowych potrzebnych do budowy
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie pliku z wymaganiami
COPY requirements.txt .

# Instalowanie zależności Python w katalogu tymczasowym
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Etap 2: Uruchomienie aplikacji FastAPI
FROM python:3.12-slim

# Instalowanie minimalnych zależności systemowych potrzebnych w czasie uruchomienia
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalowanie dockerize
RUN apt-get update && apt-get install -y \
    wget \
    && wget -qO- https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz | tar -C /usr/local/bin -xz

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie aplikacji
COPY . .

# Kopiowanie wcześniej zainstalowanych zależności z etapu budowania
COPY --from=builder /install /usr/local

# Uruchomienie aplikacji FastAPI z użyciem dockerize
CMD ["dockerize", "-wait", "tcp://db:5432", "-timeout", "30s", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
