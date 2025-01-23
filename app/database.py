from databases import Database
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging
from dotenv import load_dotenv
from app import base


Base = declarative_base()

# Load environment variables
load_dotenv()

# Get DATABASE_URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

# Add logging to verify DATABASE_URL
logging.basicConfig(level=logging.INFO)
logging.info(f"DATABASE_URL: {DATABASE_URL}")

# Create database engine
engine = create_engine(DATABASE_URL)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Database instance
database = Database(DATABASE_URL)

# Function to connect to the database
async def connect():
    await database.connect()
    create_tables()
    logging.info("Database connected")

# Function to disconnect from the database
async def disconnect():
    await database.disconnect()
    logging.info("Database disconnected")

# Create tables in the database
def create_tables():
    Base.metadata.create_all(engine)
