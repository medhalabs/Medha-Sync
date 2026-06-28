from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from fastapi import HTTPException
from features.contacts.models import Contact
from features.contacts.schemas import ContactCreate, ContactUpdate
from typing import Optional


async def create_contact(db: AsyncSession, data: ContactCreate) -> Contact:
    contact = Contact(**data.model_dump())
    db.add(contact)
    await db.flush()
    await db.refresh(contact)
    return contact


async def get_contact(db: AsyncSession, contact_id: str) -> Contact:
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


async def list_contacts(
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    tag: Optional[str] = None,
    pipeline_stage_id: Optional[str] = None,
) -> tuple[list[Contact], int]:
    query = select(Contact)
    if search:
        query = query.where(
            or_(
                Contact.name.ilike(f"%{search}%"),
                Contact.phone.ilike(f"%{search}%"),
                Contact.email.ilike(f"%{search}%"),
            )
        )
    if pipeline_stage_id:
        query = query.where(Contact.pipeline_stage_id == pipeline_stage_id)
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    query = query.offset((page - 1) * size).limit(size).order_by(Contact.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all(), total


async def update_contact(db: AsyncSession, contact_id: str, data: ContactUpdate) -> Contact:
    contact = await get_contact(db, contact_id)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(contact, key, value)
    await db.flush()
    await db.refresh(contact)
    return contact


async def delete_contact(db: AsyncSession, contact_id: str) -> None:
    contact = await get_contact(db, contact_id)
    await db.delete(contact)
