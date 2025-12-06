"""Populate usernames for existing users who don't have one"""
import asyncio
import sys
sys.path.insert(0, '/home/user/Critvue/backend')

from sqlalchemy import select
from app.db.session import async_session_maker
from app.models.user import User
from app.crud.profile import generate_unique_username


async def populate_usernames():
    """Find all users without usernames and generate one from their email"""
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(User.username.is_(None))
        )
        users = result.scalars().all()

        print(f"Found {len(users)} users without usernames")

        for user in users:
            username = await generate_unique_username(db, user.email)
            user.username = username
            print(f"  {user.email} -> {username}")
            # Commit after each to ensure uniqueness checks work
            await db.commit()

        print("Done!")


if __name__ == "__main__":
    asyncio.run(populate_usernames())
