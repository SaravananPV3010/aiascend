"""
DynamoDB client singleton and table bootstrap helpers.

Tables
------
pillmate_users
  PK  user_id  (String)

pillmate_medications
  PK  user_id       (String)
  SK  medication_id (String)
  GSI: medication_id-index → PK medication_id (for direct lookup)

pillmate_prescriptions
  PK  user_id         (String)
  SK  prescription_id (String)
"""

import boto3
from botocore.exceptions import ClientError

from config import settings

# ── Boto3 resource ─────────────────────────────────────────────────────────────
_kwargs: dict = {
    "region_name": settings.AWS_REGION,
}
if settings.AWS_ACCESS_KEY_ID:
    _kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
if settings.AWS_SECRET_ACCESS_KEY:
    _kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
if settings.DYNAMODB_ENDPOINT_URL:
    # Allows pointing at DynamoDB Local during development
    _kwargs["endpoint_url"] = settings.DYNAMODB_ENDPOINT_URL

dynamodb = boto3.resource("dynamodb", **_kwargs)


# ── Table helpers ──────────────────────────────────────────────────────────────
def get_users_table():
    return dynamodb.Table(settings.USERS_TABLE)


def get_medications_table():
    return dynamodb.Table(settings.MEDICATIONS_TABLE)


def get_prescriptions_table():
    return dynamodb.Table(settings.PRESCRIPTIONS_TABLE)


# ── Bootstrap (idempotent) ─────────────────────────────────────────────────────
def create_tables_if_not_exist() -> None:
    """
    Creates DynamoDB tables if they don't already exist.
    Safe to call on every startup — it's a no-op when tables exist.
    """
    client = boto3.client(
        "dynamodb",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
    )

    existing = {t for t in client.list_tables()["TableNames"]}

    # ── pillmate_users ─────────────────────────────────────────────────────────
    if settings.USERS_TABLE not in existing:
        client.create_table(
            TableName=settings.USERS_TABLE,
            AttributeDefinitions=[
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "email", "AttributeType": "S"},
            ],
            KeySchema=[{"AttributeName": "user_id", "KeyType": "HASH"}],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "email-index",
                    "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                    "BillingMode": "PAY_PER_REQUEST",
                }
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        print(f"[DynamoDB] Created table: {settings.USERS_TABLE}")

    # ── pillmate_medications ───────────────────────────────────────────────────
    if settings.MEDICATIONS_TABLE not in existing:
        client.create_table(
            TableName=settings.MEDICATIONS_TABLE,
            AttributeDefinitions=[
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "medication_id", "AttributeType": "S"},
            ],
            KeySchema=[
                {"AttributeName": "user_id", "KeyType": "HASH"},
                {"AttributeName": "medication_id", "KeyType": "RANGE"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        print(f"[DynamoDB] Created table: {settings.MEDICATIONS_TABLE}")

    # ── pillmate_prescriptions ─────────────────────────────────────────────────
    if settings.PRESCRIPTIONS_TABLE not in existing:
        client.create_table(
            TableName=settings.PRESCRIPTIONS_TABLE,
            AttributeDefinitions=[
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "prescription_id", "AttributeType": "S"},
            ],
            KeySchema=[
                {"AttributeName": "user_id", "KeyType": "HASH"},
                {"AttributeName": "prescription_id", "KeyType": "RANGE"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        print(f"[DynamoDB] Created table: {settings.PRESCRIPTIONS_TABLE}")
