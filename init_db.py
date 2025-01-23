from app.database import engine
from app.models.employee import Employee
from app.models.ceo import CEO  # Zakładając, że masz również model CEO

# Tworzenie tabel w bazie danych
Employee.__table__.create(bind=engine)
CEO.__table__.create(bind=engine)

print("Baza danych została zainicjowana!")