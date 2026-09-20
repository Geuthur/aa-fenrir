# Django
from django import forms
from django.utils.translation import gettext as _

# AA Fenrir
from aafenrir.models.general import UserSettings


class UserSettingsForm(forms.ModelForm):
    class Meta:
        model = UserSettings
        fields = ["disable_notifications"]
        labels = {
            "disable_notifications": _("Disable Notifications"),
        }
        help_texts = {
            "disable_notifications": _(
                "Check this box to disable notifications for expired belt timers."
            ),
        }
