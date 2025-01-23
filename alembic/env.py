import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.database import Base  # Upewnij się, że importujesz Base z właściwego miejsca
from app.models.employee import Employee  # Importuj swoje modele
from app.models.ceo import Ceo  # Importuj swoje modele
from dotenv import load_dotenv

load_dotenv()

config = context.config

# Ustawienie URL bazy danych na podstawie zmiennej środowiskowej lub wartości domyślnej
database_url = os.getenv('DATABASE_URL', 'postgresql://corporation_user:321meme321@db:5432/corporation_db')
config.set_main_option('sqlalchemy.url', database_url)

if not database_url:
    raise ValueError("DATABASE_URL nie została ustawiona w pliku .env")

# Skonfiguruj logowanie na podstawie pliku ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Ustawienie metadata dla autogeneracji
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Uruchom migracje w trybie 'offline'."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Uruchom migracje w trybie 'online'."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
