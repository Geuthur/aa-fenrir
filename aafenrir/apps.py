"""App Configuration"""

# Django
from django.apps import AppConfig

# AA Fenrir
from aafenrir import __version__


class AAFenrirConfig(AppConfig):
    """App Config"""

    default_auto_field = "django.db.models.AutoField"
    name = "aafenrir"
    label = "aafenrir"
    verbose_name = f"AA Fenrir v{__version__}"
