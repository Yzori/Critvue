"""Database session management"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool, QueuePool
from app.core.config import settings

# Determine if we're using SQLite (for development) or PostgreSQL (for production)
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Create async engine with optimized connection pooling
if is_sqlite:
    # SQLite configuration (NullPool - no connection pooling)
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DATABASE_ECHO,
        future=True,
        poolclass=NullPool,
        connect_args={"timeout": 30},
    )
else:
    # PostgreSQL configuration (QueuePool - with connection pooling)
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DATABASE_ECHO,
        future=True,
        poolclass=QueuePool,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_timeout=settings.DATABASE_POOL_TIMEOUT,
        pool_recycle=settings.DATABASE_POOL_RECYCLE,
        pool_pre_ping=settings.DATABASE_POOL_PRE_PING,
        connect_args={
            "server_settings": {
                "application_name": settings.PROJECT_NAME,
            },
            "command_timeout": 60,
        },
    )

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database session
    Usage: db: AsyncSession = Depends(get_db)
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_db() -> None:
    """
    Close database engine and dispose of connection pool
    Should be called on application shutdown
    """
    await engine.dispose()
