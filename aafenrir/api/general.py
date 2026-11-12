# Standard Library
from http import HTTPStatus

# Third Party
from ninja import NinjaAPI

# Django
from django.urls import reverse
from django.utils.translation import gettext as _

# AA Fenrir
from aafenrir import __title__
from aafenrir.api import schema
from aafenrir.app_settings import AA_FENRIR_MAX_COLLATERAL, AA_FENRIR_MAX_VOLUME
from aafenrir.helpers.eveonline import get_character_portrait_url
from aafenrir.managers.general import GeneralManager
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
            if GeneralManager.has_management_access(request.user):
                right_menu.append(
                    schema.MenuLink(name=_("Route Admin"), link="/routes/admin/")
                )
                right_menu.append(
                    schema.MenuLink(
                        name=_("Add Company"),
                        link=reverse("aafenrir:add_contract_handler"),
                        is_external=True,
                    )
                )

            if GeneralManager.has_admin_access(request.user):
                right_menu.append(
                    schema.MenuLink(name=_("Administration"), link="/administration/")
                )

            return schema.MenuSchema(
                left_links=left_menu,
                right_links=right_menu,
            )

        @api.get(
            "user/",
            response={
                HTTPStatus.OK: schema.UserData,
                HTTPStatus.FORBIDDEN: schema.ErrorSchema,
            },
            tags=self.tags,
        )
        def get_user(request):
            if not GeneralManager.has_basic_access(request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            try:
                character_id = request.user.profile.main_character.character_id
                character_name = request.user.profile.main_character.character_name
                corporation_id = request.user.profile.main_character.corporation_id
                corporation_name = request.user.profile.main_character.corporation_name
                alliance_id = request.user.profile.main_character.alliance_id
                alliance_name = request.user.profile.main_character.alliance_name
            except AttributeError:
                character_id = 0
                character_name = ""
                corporation_id = 0
                corporation_name = ""
                alliance_id = None
                alliance_name = None

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
                corporation_id=corporation_id,
                corporation_name=corporation_name,
                alliance_id=alliance_id,
                alliance_name=alliance_name,
                portrait=portrait_url,
                is_admin=request.user.is_superuser,
                notification=settings.disable_notifications,
                quick_select_presets=settings.quick_select_presets or [],
                has_manage_access=GeneralManager.has_management_access(request.user),
                has_admin_access=GeneralManager.has_admin_access(request.user),
                calculator_max_volume=AA_FENRIR_MAX_VOLUME,
                calculator_max_collateral=AA_FENRIR_MAX_COLLATERAL,
            )

        @api.get(
            "settings/",
            response={
                HTTPStatus.OK: schema.UserSettingsSchema,
                HTTPStatus.FORBIDDEN: schema.ErrorSchema,
            },
            tags=self.tags,
            summary="Get current user's settings",
        )
        def get_user_settings(request):
            if not GeneralManager.has_basic_access(request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            settings = UserSettings.objects.get_or_create(user=request.user)[0]
            return HTTPStatus.OK, schema.UserSettingsSchema(
                disable_notifications=settings.disable_notifications,
                quick_select_presets=settings.quick_select_presets or [],
            )

        @api.put(
            "settings/",
            response={
                HTTPStatus.OK: schema.UserSettingsSchema,
                HTTPStatus.FORBIDDEN: schema.ErrorSchema,
            },
            tags=self.tags,
            summary="Update current user's settings",
        )
        def update_user_settings(request, payload: schema.UserSettingsUpdateRequest):
            if not GeneralManager.has_basic_access(request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            settings = UserSettings.objects.get_or_create(user=request.user)[0]
            update_fields = []
            if payload.disable_notifications is not None:
                settings.disable_notifications = payload.disable_notifications
                update_fields.append("disable_notifications")
            if payload.quick_select_presets is not None:
                settings.quick_select_presets = payload.quick_select_presets[:5]
                update_fields.append("quick_select_presets")
            if update_fields:
                settings.save(update_fields=update_fields)

            return HTTPStatus.OK, schema.UserSettingsSchema(
                disable_notifications=settings.disable_notifications,
                quick_select_presets=settings.quick_select_presets or [],
            )
