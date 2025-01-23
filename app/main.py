from fastapi import FastAPI
from app import database
from app.controllers.employee_controller import router as employee_router
import uvicorn

app = FastAPI()

@app.on_event("startup")
async def startup():
	await database.connect()

@app.on_event("shutdown")
async def shutdown():
	await database.disconnect()

app.include_router(employee_router)

if __name__ == '__main__':
	uvicorn.run
