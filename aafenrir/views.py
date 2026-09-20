"""PvE Views"""

# Django
from django.contrib.auth.decorators import login_required
from django.core.handlers.wsgi import WSGIRequest
from django.shortcuts import render
from django.utils.translation import gettext_lazy as _

# Alliance Auth
from allianceauth.services.hooks import get_extension_logger

# AA Fenrir
from aafenrir import __app_name__, __title__, __version__
from aafenrir.providers import AppLogger

logger = AppLogger(get_extension_logger(__name__), __title__)


@login_required
def react_base(request: WSGIRequest, character_id=None):  #
    if character_id is None:
        character_id = request.user.profile.main_character.character_id

    context = {
        "version": __version__,
        "app_name": __app_name__,
        "character_id": character_id,
    }
    return render(request, "aafenrir/react_base.html", context=context)
