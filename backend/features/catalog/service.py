from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from features.catalog.models import CatalogItem
from features.catalog.schemas import CatalogItemCreate, CatalogItemUpdate


async def get_menu_tree(db: AsyncSession) -> list[CatalogItem]:
    result = await db.execute(
        select(CatalogItem)
        .where(CatalogItem.is_active == True, CatalogItem.parent_id == None)
        .order_by(CatalogItem.position)
    )
    return result.scalars().all()


async def get_catalog_item(db: AsyncSession, item_id: str) -> CatalogItem | None:
    result = await db.execute(select(CatalogItem).where(CatalogItem.id == item_id, CatalogItem.is_active == True))
    return result.scalar_one_or_none()


async def list_catalog_items(db: AsyncSession, parent_id: str = None) -> list[CatalogItem]:
    query = select(CatalogItem)
    if parent_id:
        query = query.where(CatalogItem.parent_id == parent_id)
    result = await db.execute(query.order_by(CatalogItem.position))
    return result.scalars().all()


async def create_catalog_item(db: AsyncSession, data: CatalogItemCreate) -> CatalogItem:
    item = CatalogItem(**data.model_dump())
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def update_catalog_item(db: AsyncSession, item_id: str, data: CatalogItemUpdate) -> CatalogItem:
    result = await db.execute(select(CatalogItem).where(CatalogItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    await db.flush()
    await db.refresh(item)
    return item


async def delete_catalog_item(db: AsyncSession, item_id: str):
    result = await db.execute(select(CatalogItem).where(CatalogItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    await db.delete(item)
