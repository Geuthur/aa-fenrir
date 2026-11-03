# Django
from django.db import migrations, models

STATUS_RENAMES = {"pending": "outstanding", "canceled": "cancelled"}
STATUS_CHOICES = [
    ("outstanding", "Pending"),
    ("in_progress", "In Progress"),
    ("finished_issuer", "Finished Issuer"),
    ("finished_contractor", "Finished Contractor"),
    ("finished", "Finished"),
    ("cancelled", "Canceled"),
    ("rejected", "Rejected"),
    ("failed", "Failed"),
    ("deleted", "Deleted"),
    ("reversed", "Reversed"),
]


def _rename_status(apps, schema_editor, renames):
    db_alias = schema_editor.connection.alias
    contracts = apps.get_model("aafenrir", "Contract").objects.using(db_alias)
    notifications = apps.get_model(
        "aafenrir", "ContractCustomerNotification"
    ).objects.using(db_alias)

    for old_status, new_status in renames.items():
        contracts.filter(status=old_status).update(status=new_status)
        # A contract can only have one notification per status
        notified = list(
            notifications.filter(status=new_status).values_list(
                "contract_id", flat=True
            )
        )
        notifications.filter(status=old_status, contract_id__in=notified).delete()
        notifications.filter(status=old_status).update(status=new_status)


def forwards(apps, schema_editor):
    _rename_status(apps, schema_editor, STATUS_RENAMES)


def backwards(apps, schema_editor):
    _rename_status(
        apps, schema_editor, {new: old for old, new in STATUS_RENAMES.items()}
    )


class Migration(migrations.Migration):

    dependencies = [
        ("aafenrir", "0007_alter_routepreset_collateral_percent"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name="contract",
            name="status",
            field=models.CharField(
                choices=STATUS_CHOICES,
                db_index=True,
                max_length=32,
                verbose_name="Status",
            ),
        ),
        migrations.AlterField(
            model_name="contractcustomernotification",
            name="status",
            field=models.CharField(
                choices=STATUS_CHOICES,
                db_index=True,
                max_length=32,
                verbose_name="Status",
            ),
        ),
    ]
