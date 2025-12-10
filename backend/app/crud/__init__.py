"""CRUD operations for Critvue"""

from app.crud.base import BaseRepository
from app.crud.review import review_crud

__all__ = ["BaseRepository", "review_crud"]
