# Django
import django.db.models.deletion
from django.db import migrations, models


def remove_duplicate_settings(apps, schema_editor):
    """Keep only the newest settings row per user and drop rows without user."""
    db_alias = schema_editor.connection.alias
    user_settings = apps.get_model("aafenrir", "UserSettings").objects.using(db_alias)

    user_settings.filter(user__isnull=True).delete()

    newest_ids = (
        user_settings.values("user_id")
        .annotate(newest_id=models.Max("id"))
        .values_list("newest_id", flat=True)
    )
    user_settings.exclude(id__in=list(newest_ids)).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("aafenrir", "0008_contract_status_esi_values"),
    ]

    operations = [
        migrations.RunPython(remove_duplicate_settings, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="usersettings",
            name="user",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="+",
                to="authentication.user",
            ),
        ),
    ]
