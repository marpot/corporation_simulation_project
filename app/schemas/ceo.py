from pydantic import BaseModel

class CEOBasic(BaseModel):
	name: str
	age: int
	salary: int

class CEOCreate(CEOBasic):
	pass

class CEOOut(CEOBasic):
	id: int

	class Config:
		orm_mode = True # Pozwala na konwersję obiektów sqlalchemy do danych JSON