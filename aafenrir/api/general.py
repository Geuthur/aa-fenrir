# Standard Library
import json
from http import HTTPStatus

# Third Party
from ninja import NinjaAPI

# Django
from django.urls import reverse
from django.utils.translation import gettext as _

# AA Fenrir
from aafenrir import __title__, forms
from aafenrir.api import schema
from aafenrir.helpers.eveonline import get_character_portrait_url
from aafenrir.models.general import UserSettings


class GeneralApiEndpoints:
    tags = ["General"]

    def __init__(self, api: NinjaAPI):
        @api.get(
            "menu/",
            response={
                HTTPStatus.OK: schema.MenuSchema,
            },
            tags=self.tags,
        )
        # pylint: disable=unused-argument
        def get_menu(request):
            left_menu: list[schema.MenuLink] = []
            left_menu.append(schema.MenuLink(name=_("Calculator"), link="/calculator/"))
            left_menu.append(schema.MenuLink(name=_("Contracts Queue"), link="/queue/"))
            left_menu.append(schema.MenuLink(name=_("Settings"), link="/settings/"))

            right_menu: list[schema.MenuLink] = []
            if request.user.has_perm("aafenrir.manage_access"):
                right_menu.append(
                    schema.MenuLink(name=_("Route Admin"), link="/routes/admin/")
                )
                right_menu.append(
                    schema.MenuLink(
                        name=_("Add Company"),
                        link=reverse("voicesofwar:add_freight"),
                        is_external=True,
                    )
                )

            return schema.MenuSchema(
                left_links=left_menu,
                right_links=right_menu,
            )

        @api.get(
            "user/",
            response={
                HTTPStatus.OK: schema.UserData,
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def get_user(request):
            if not request.user.has_perm("aafenrir.basic_access"):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            try:
                character_id = request.user.profile.main_character.character_id
                character_name = request.user.profile.main_character.character_name
            except AttributeError:
                character_id = 0
                character_name = ""

            settings = UserSettings.objects.get_or_create(user=request.user)[0]

            portrait_url = (
                get_character_portrait_url(
                    character_id=character_id,
                    character_name=character_name,
                    as_html=False,
                )
                if character_id
                else None
            )

            return schema.UserData(
                user_id=request.user.id,
                character_id=character_id,
                character_name=character_name,
                portrait=portrait_url,
                notification=settings.disable_notifications,
                quick_select_presets=settings.quick_select_presets or [],
                has_manage_access=request.user.has_perm("aafenrir.manage_access"),
            )

        @api.post(
            "modify/user/settings/",
            response={
                HTTPStatus.OK: dict,
                HTTPStatus.BAD_REQUEST: dict,
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def modify_user_settings(request):
            if not request.user.has_perm("aafenrir.basic_access"):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            settings = UserSettings.objects.get_or_create(user=request.user)[0]

            if "quick_select_presets" in request.POST:
                try:
                    raw = json.loads(request.POST.get("quick_select_presets"))
                    if isinstance(raw, list):
                        settings.quick_select_presets = [int(x) for x in raw[:5]]
                        settings.save()
                except (ValueError, TypeError, json.JSONDecodeError):
                    pass

            if "disable_notifications" in request.POST:
                form = forms.UserSettingsForm(data=request.POST, instance=settings)
                if form.is_valid():
                    form.save()
                else:
                    msg = _(
                        "Invalid input data. Please check the format and try again."
                    )
                    return HTTPStatus.BAD_REQUEST, {"success": False, "message": msg}

            return HTTPStatus.OK, {
                "success": True,
                "message": str(_("User settings updated successfully.")),
            }
