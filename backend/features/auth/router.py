from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id, decode_token
from core.rate_limit import limiter, LIMITS
from features.auth.schemas import UserCreate, UserLogin, UserOut, TokenOut, RefreshRequest
from features.auth.service import register_user, authenticate_user, get_user_by_id
from core.security import create_access_token, create_refresh_token

router = APIRouter()


@router.post("/register", response_model=UserOut)
@limiter.limit(LIMITS["auth_register"])
async def register(request: Request, data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register_user(db, data)


@router.post("/login", response_model=TokenOut)
@limiter.limit(LIMITS["auth_login"])
async def login(request: Request, data: UserLogin, db: AsyncSession = Depends(get_db)):
    user, access_token, refresh_token = await authenticate_user(db, data)
    return TokenOut(access_token=access_token, refresh_token=refresh_token, user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenOut)
@limiter.limit(LIMITS["auth_refresh"])
async def refresh(request: Request, data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    user = await get_user_by_id(db, payload["sub"])
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    return TokenOut(access_token=access_token, refresh_token=refresh_token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await get_user_by_id(db, user_id)
