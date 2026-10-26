# Standard Library
from http import HTTPStatus

# Third Party
from ninja import NinjaAPI

# Django
from django.core.handlers.wsgi import WSGIRequest
from django.utils.translation import gettext as _

# AA Fenrir
from aafenrir import tasks
from aafenrir.api import schema
from aafenrir.api.helpers.administration import (
    get_handler,
    handler_detail,
    list_handlers,
)
from aafenrir.models.general import General


class AdministrationApiEndpoints:
    tags = ["Administration"]

    def __init__(self, api: NinjaAPI):
        @api.get(
            "administration/handlers/",
            response={
                HTTPStatus.OK: list[schema.AdministrationHandlerSchema],
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def list_administration_handlers(request: WSGIRequest):
            if not General.has_admin_access(request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            return HTTPStatus.OK, list_handlers()

        @api.get(
            "administration/handlers/{corporation_id}/",
            response={
                HTTPStatus.OK: schema.AdministrationHandlerDetailSchema,
                HTTPStatus.FORBIDDEN: dict,
                HTTPStatus.NOT_FOUND: dict,
            },
            tags=self.tags,
        )
        def get_administration_handler(request: WSGIRequest, corporation_id: int):
            if not General.has_admin_access(request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            handler = get_handler(corporation_id)
            if handler is None:
                return HTTPStatus.NOT_FOUND, {"error": _("Handler not found.")}

            return HTTPStatus.OK, handler_detail(handler)

        @api.post(
            "administration/handlers/{corporation_id}/update/",
            response={
                HTTPStatus.OK: dict,
                HTTPStatus.FORBIDDEN: dict,
                HTTPStatus.NOT_FOUND: dict,
            },
            tags=self.tags,
        )
        def update_administration_handler(
            request: WSGIRequest, corporation_id: int, force_refresh: bool = False
        ):
            if not General.has_admin_access(request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            if force_refresh and not request.user.is_superuser:
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            handler = get_handler(corporation_id)
            if handler is None:
                return HTTPStatus.NOT_FOUND, {"error": _("Handler not found.")}

            tasks.update_freight.apply_async(
                args=[handler.organization_id],
                kwargs={"force_refresh": force_refresh},
            )
            return HTTPStatus.OK, {
                "success": True,
                "message": _("Update for %(name)s queued.")
                % {"name": handler.organization.name},
            }

        @api.delete(
            "administration/handlers/{corporation_id}/",
            response={
                HTTPStatus.OK: dict,
                HTTPStatus.FORBIDDEN: dict,
                HTTPStatus.NOT_FOUND: dict,
            },
            tags=self.tags,
        )
        def delete_administration_handler(request: WSGIRequest, corporation_id: int):
            if not General.has_admin_access(request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            handler = get_handler(corporation_id)
            if handler is None:
                return HTTPStatus.NOT_FOUND, {"error": _("Handler not found.")}

            name = handler.organization.name
            handler.delete()
            return HTTPStatus.OK, {
                "success": True,
                "message": _("Handler %(name)s deleted.") % {"name": name},
            }

        @api.post(
            "administration/update/",
            response={
                HTTPStatus.OK: dict,
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def update_administration_all(
            request: WSGIRequest, force_refresh: bool = False
        ):
            if not request.user.is_superuser:
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            tasks.aafenrir_task.apply_async(kwargs={"force_refresh": force_refresh})
            return HTTPStatus.OK, {
                "success": True,
                "message": _("Update for all handlers queued."),
            }
