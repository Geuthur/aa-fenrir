# Standard Library
from http import HTTPStatus

# Third Party
from ninja import NinjaAPI

# Django
from django.utils.translation import gettext as _

# Alliance Auth (External Libs)
from eve_sde.models import SolarSystem

# AA Fenrir
from aafenrir import __title__
from aafenrir.api import schema


class EveSdeApiEndpoints:
    tags = ["EVE SDE"]

    def __init__(self, api: NinjaAPI):
        @api.get(
            "eve_sde/solar-system/{eve_id}",
            response={
                HTTPStatus.OK: schema.SolarSystemSchema,
                HTTPStatus.FORBIDDEN: dict,
                HTTPStatus.NOT_FOUND: dict,
            },
            tags=self.tags,
        )
        def get_solar_system(request, eve_id: int):
            if not request.user.has_perm("aafenrir.basic_access"):
                return HTTPStatus.FORBIDDEN, {
                    "detail": _("You do not have access to this resource.")
                }

            try:
                solar_system = SolarSystem.objects.get(id=eve_id)
            except SolarSystem.DoesNotExist:
                return HTTPStatus.NOT_FOUND, {"detail": _("Solar system not found.")}

            return HTTPStatus.OK, schema.SolarSystemSchema.from_orm(solar_system)

        @api.get(
            "eve_sde/solar-systems/search/",
            response={
                HTTPStatus.OK: list[schema.SolarSystemSearchSchema],
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def search_solar_systems(request, query: str = ""):
            if not request.user.has_perm("aafenrir.basic_access"):
                return HTTPStatus.FORBIDDEN, {
                    "detail": _("You do not have access to this resource.")
                }

            if not query or len(query.strip()) < 2:
                return HTTPStatus.OK, []

            systems = (
                SolarSystem.objects.filter(name__icontains=query.strip())
                .select_related("constellation__region")
                .order_by("name")[:25]
            )

            results = []
            for s in systems:
                sec_class = "nullsec"
                if s.security_status is not None:
                    if s.security_status >= 0.45:
                        sec_class = "highsec"
                    elif s.security_status > 0.0:
                        sec_class = "lowsec"
                    elif getattr(s, "is_wh_space", False) or (
                        31_000_000 <= s.id < 32_000_000
                    ):
                        sec_class = "wh"
                    elif getattr(s, "is_triglavian_space", False):
                        sec_class = "pochven"
                    else:
                        sec_class = "nullsec"

                region_name = ""
                if s.constellation and s.constellation.region:
                    region_name = s.constellation.region.name

                results.append(
                    schema.SolarSystemSearchSchema(
                        id=s.id,
                        name=s.name,
                        security_status=round(float(s.security_status or 0.0), 2),
                        security_class=sec_class,
                        region_name=region_name,
                    )
                )
            return HTTPStatus.OK, results
