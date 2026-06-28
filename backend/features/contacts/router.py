from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.contacts.schemas import ContactCreate, ContactUpdate, ContactOut, ContactPage
from features.contacts.service import create_contact, get_contact, list_contacts, update_contact, delete_contact
from typing import Optional

router = APIRouter()


@router.get("", response_model=ContactPage)
async def list_contacts_route(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    tag: Optional[str] = None,
    pipeline_stage_id: Optional[str] = None,
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_contacts(db, page, size, search, tag, pipeline_stage_id)
    return ContactPage(items=items, total=total, page=page, size=size)


@router.post("", response_model=ContactOut, status_code=201)
async def create_contact_route(data: ContactCreate, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await create_contact(db, data)


@router.get("/{contact_id}", response_model=ContactOut)
async def get_contact_route(contact_id: str, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await get_contact(db, contact_id)


@router.patch("/{contact_id}", response_model=ContactOut)
async def update_contact_route(contact_id: str, data: ContactUpdate, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await update_contact(db, contact_id, data)


@router.delete("/{contact_id}", status_code=204)
async def delete_contact_route(contact_id: str, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await delete_contact(db, contact_id)
