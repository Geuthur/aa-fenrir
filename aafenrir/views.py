"""PvE Views"""

# Django
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.handlers.wsgi import WSGIRequest
from django.shortcuts import redirect, render
from django.utils.translation import gettext_lazy as _

# Alliance Auth
from allianceauth.authentication.models import CharacterOwnership
from esi.decorators import token_required

# AA Fenrir
from aafenrir import __app_name__, __version__
from aafenrir.constants import MIN_PLAYER_CORPORATION_ID
from aafenrir.models import ContractHandler, EveEntity, General
from aafenrir.tasks import update_freight


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


@login_required
@user_passes_test(General.has_management_access, login_url="aafenrir:index")
@token_required(scopes=ContractHandler.get_esi_scopes())
def add_contract_handler(request: WSGIRequest, token):
    """Add or update the contract handler of the token character's corporation."""
    ownership = (
        CharacterOwnership.objects.select_related("character")
        .filter(user=request.user, character__character_id=token.character_id)
        .first()
    )
    if ownership is None:
        messages.error(request, _("This character does not belong to your account."))
        return redirect("aafenrir:index")

    character = ownership.character
    if character.corporation_id < MIN_PLAYER_CORPORATION_ID:
        messages.error(request, _("NPC corporations can not be added."))
        return redirect("aafenrir:index")

    organization, __ = EveEntity.objects.get_or_create(
        eve_id=character.corporation_id,
        defaults={"category": "corporation", "name": character.corporation_name},
    )
    ContractHandler.objects.update_or_create(
        organization=organization, defaults={"character": ownership}
    )
    update_freight.apply_async(args=[character.corporation_id])

    messages.success(
        request,
        _("%(corporation)s successfully added or updated.")
        % {"corporation": character.corporation_name},
    )
    return redirect("aafenrir:index")
