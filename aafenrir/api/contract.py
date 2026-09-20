# Standard Library
from http import HTTPStatus

# Third Party
from ninja import NinjaAPI

# Django
from django.core.handlers.wsgi import WSGIRequest
from django.db import models
from django.utils.translation import gettext as _

# Alliance Auth (External Libs)
from eve_sde.models import SolarSystem

# AA Fenrir
from aafenrir import __title__
from aafenrir.api import schema
from aafenrir.helpers.permission import get_manage_permissions
from aafenrir.models import Contract, ContractHandler, RoutePreset, RouteSystem


class ContractApiEndpoints:
    tags = ["Contracts"]

    # pylint: disable=too-many-statements
    def __init__(self, api: NinjaAPI):
        @api.get(
            "contract/handlers/",
            response={
                HTTPStatus.OK: list[schema.ContractHandlerSchema],
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def get_contract_handlers(request: WSGIRequest):
            if not request.user.has_perm("aafenrir.basic_access"):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            handlers = ContractHandler.objects.select_related("organization").all()
            return HTTPStatus.OK, [
                schema.ContractHandlerSchema(
                    id=h.organization_id,
                    name=str(h.organization.name),
                )
                for h in handlers
            ]

        @api.get(
            "contract/presets/",
            response={
                HTTPStatus.OK: list[schema.RoutePresetSchema],
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def get_route_presets(request: WSGIRequest):
            if not request.user.has_perm("aafenrir.basic_access"):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            presets = (
                RoutePreset.objects.select_related(
                    "origin_system",
                    "destination_system",
                    "assign_corp",
                    "assign_corp__organization",
                )
                .prefetch_related("cyno_waypoints")
                .all()
            )

            results = []
            for p in presets:
                results.append(
                    schema.RoutePresetSchema(
                        id=p.id,
                        name=p.name,
                        origin_system=p.origin_system.name if p.origin_system else "",
                        origin_system_id=p.origin_system_id,
                        origin_station=p.origin_system_station or "",
                        destination_system=(
                            p.destination_system.name if p.destination_system else ""
                        ),
                        destination_system_id=p.destination_system_id,
                        destination_station=p.destination_system_station or "",
                        service_type=p.service_type,
                        max_volume=p.max_volume,
                        max_collateral=p.max_collateral,
                        base_fee=p.base_fee,
                        fee_per_m3=p.fee_per_m3,
                        fee_per_ly=float(p.fee_per_ly),
                        fee_per_ly_or_jump=float(p.fee_per_ly),
                        fee_per_lyorjump=float(p.fee_per_ly),
                        collateral_percent=(
                            float(p.collateral_percent) / 100.0
                            if p.collateral_percent >= 1
                            else float(p.collateral_percent)
                        ),
                        min_reward=p.min_reward,
                        estimated_time=p.estimated_time,
                        estimated_days=(
                            round(p.estimated_time / (24 * 60), 1)
                            if p.estimated_time > 60
                            else max(1.0, float(p.estimated_time))
                        ),
                        is_cyno_route=p.is_cyno_route,
                        cyno_waypoints=[w.name for w in p.cyno_waypoints.all()],
                        cyno_waypoint_ids=[w.id for w in p.cyno_waypoints.all()],
                        danger_level=(
                            p.get_danger_level_display()
                            if hasattr(p, "get_danger_level_display")
                            else p.danger_level
                        ),
                        description="",
                        has_alliance_subsidy=bool(
                            getattr(p, "has_alliance_subsidy", True)
                        ),
                        assign_corp_id=p.assign_corp_id,
                        assign_corp_name=(
                            str(p.assign_corp.organization.name)
                            if p.assign_corp and p.assign_corp.organization
                            else ""
                        ),
                        expiration_days=p.expiration_days,
                        days_to_complete=p.days_to_complete,
                    )
                )
            return HTTPStatus.OK, results

        @api.get(
            "contract/preset/{preset_id}/",
            response={
                HTTPStatus.OK: schema.RoutePresetSchema,
                HTTPStatus.NOT_FOUND: dict,
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def get_route_preset(request: WSGIRequest, preset_id: int):
            if not request.user.has_perm("aafenrir.basic_access"):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            try:
                p = (
                    RoutePreset.objects.select_related(
                        "origin_system",
                        "destination_system",
                        "assign_corp",
                        "assign_corp__organization",
                    )
                    .prefetch_related("cyno_waypoints")
                    .get(id=preset_id)
                )
            except RoutePreset.DoesNotExist:
                return HTTPStatus.NOT_FOUND, {"detail": _("Route preset not found.")}

            return HTTPStatus.OK, schema.RoutePresetSchema(
                id=p.id,
                name=p.name,
                origin_system=p.origin_system.name if p.origin_system else "",
                origin_system_id=p.origin_system_id,
                origin_station=p.origin_system_station or "",
                destination_system=(
                    p.destination_system.name if p.destination_system else ""
                ),
                destination_system_id=p.destination_system_id,
                destination_station=p.destination_system_station or "",
                service_type=p.service_type,
                max_volume=p.max_volume,
                max_collateral=p.max_collateral,
                base_fee=p.base_fee,
                fee_per_m3=p.fee_per_m3,
                fee_per_ly=float(p.fee_per_ly),
                fee_per_ly_or_jump=float(p.fee_per_ly),
                fee_per_lyorjump=float(p.fee_per_ly),
                collateral_percent=(
                    float(p.collateral_percent) / 100.0
                    if p.collateral_percent >= 1
                    else float(p.collateral_percent)
                ),
                min_reward=p.min_reward,
                estimated_time=p.estimated_time,
                estimated_days=(
                    round(p.estimated_time / (24 * 60), 1)
                    if p.estimated_time > 60
                    else max(1.0, float(p.estimated_time))
                ),
                is_cyno_route=p.is_cyno_route,
                cyno_waypoints=[w.name for w in p.cyno_waypoints.all()],
                cyno_waypoint_ids=[w.id for w in p.cyno_waypoints.all()],
                danger_level=(
                    p.get_danger_level_display()
                    if hasattr(p, "get_danger_level_display")
                    else p.danger_level
                ),
                description="",
                has_alliance_subsidy=bool(getattr(p, "has_alliance_subsidy", True)),
                assign_corp_id=p.assign_corp_id,
                assign_corp_name=(
                    str(p.assign_corp.organization.name)
                    if p.assign_corp and p.assign_corp.organization
                    else ""
                ),
                expiration_days=p.expiration_days,
                days_to_complete=p.days_to_complete,
            )

        @api.post(
            "contract/presets/",
            response={
                HTTPStatus.CREATED: schema.RoutePresetSchema,
                HTTPStatus.BAD_REQUEST: dict,
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def create_route_preset(
            request: WSGIRequest, data: schema.CreateRoutePresetSchema
        ):
            if not get_manage_permissions(user=request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            if not data.origin_system_id or not data.destination_system_id:
                return HTTPStatus.BAD_REQUEST, {
                    "error": _("Origin and destination systems are required.")
                }

            try:
                origin_sys = SolarSystem.objects.get(id=data.origin_system_id)
                dest_sys = SolarSystem.objects.get(id=data.destination_system_id)
            except SolarSystem.DoesNotExist:
                return HTTPStatus.BAD_REQUEST, {"error": _("Solar system not found.")}

            preset = RoutePreset.objects.create(
                name=data.name,
                origin_system=origin_sys,
                origin_system_station=data.origin_system_station or "",
                destination_system=dest_sys,
                destination_system_station=data.destination_system_station or "",
                service_type=data.service_type or "jumpfreighter",
                max_volume=data.max_volume if data.max_volume is not None else 0,
                max_collateral=(
                    data.max_collateral if data.max_collateral is not None else 0
                ),
                base_fee=data.base_fee if data.base_fee is not None else 5_000_000,
                fee_per_m3=data.fee_per_m3 if data.fee_per_m3 is not None else 0,
                fee_per_ly=data.fee_per_ly if data.fee_per_ly is not None else 0,
                collateral_percent=(
                    data.collateral_percent
                    if data.collateral_percent is not None
                    else 0
                ),
                min_reward=data.min_reward if data.min_reward is not None else 0,
                estimated_time=(
                    data.estimated_time if data.estimated_time is not None else 0
                ),
                is_cyno_route=bool(data.is_cyno_route),
                danger_level=data.danger_level or "safe",
                has_alliance_subsidy=(
                    bool(data.has_alliance_subsidy)
                    if data.has_alliance_subsidy is not None
                    else True
                ),
                assign_corp=(
                    ContractHandler.objects.filter(
                        organization_id=data.assign_corp_id
                    ).first()
                    if data.assign_corp_id
                    else None
                ),
                expiration_days=(
                    data.expiration_days if data.expiration_days is not None else 7
                ),
                days_to_complete=(
                    data.days_to_complete if data.days_to_complete is not None else 3
                ),
            )

            if data.cyno_waypoint_ids:
                waypoints = SolarSystem.objects.filter(id__in=data.cyno_waypoint_ids)
                preset.cyno_waypoints.set(waypoints)

            return HTTPStatus.CREATED, schema.RoutePresetSchema(
                id=preset.id,
                name=preset.name,
                origin_system=preset.origin_system.name if preset.origin_system else "",
                origin_system_id=preset.origin_system_id,
                origin_station=preset.origin_system_station or "",
                destination_system=(
                    preset.destination_system.name if preset.destination_system else ""
                ),
                destination_system_id=preset.destination_system_id,
                destination_station=preset.destination_system_station or "",
                service_type=preset.service_type,
                max_volume=preset.max_volume,
                max_collateral=preset.max_collateral,
                base_fee=preset.base_fee,
                fee_per_m3=preset.fee_per_m3,
                fee_per_ly=float(preset.fee_per_ly),
                fee_per_ly_or_jump=float(preset.fee_per_ly),
                fee_per_lyorjump=float(preset.fee_per_ly),
                collateral_percent=(
                    float(preset.collateral_percent) / 100.0
                    if preset.collateral_percent >= 1
                    else float(preset.collateral_percent)
                ),
                min_reward=preset.min_reward,
                estimated_time=preset.estimated_time,
                estimated_days=(
                    round(preset.estimated_time / (24 * 60), 1)
                    if preset.estimated_time > 60
                    else max(1.0, float(preset.estimated_time))
                ),
                is_cyno_route=preset.is_cyno_route,
                cyno_waypoints=[w.name for w in preset.cyno_waypoints.all()],
                cyno_waypoint_ids=[w.id for w in preset.cyno_waypoints.all()],
                danger_level=(
                    preset.get_danger_level_display()
                    if hasattr(preset, "get_danger_level_display")
                    else preset.danger_level
                ),
                description="",
                has_alliance_subsidy=bool(
                    getattr(preset, "has_alliance_subsidy", True)
                ),
                assign_corp_id=preset.assign_corp_id,
                assign_corp_name=(
                    str(preset.assign_corp.organization.name)
                    if preset.assign_corp and preset.assign_corp.organization
                    else ""
                ),
                expiration_days=preset.expiration_days,
                days_to_complete=preset.days_to_complete,
            )

        @api.put(
            "contract/preset/{preset_id}/",
            response={
                HTTPStatus.OK: schema.RoutePresetSchema,
                HTTPStatus.BAD_REQUEST: dict,
                HTTPStatus.NOT_FOUND: dict,
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def update_route_preset(
            request: WSGIRequest,
            preset_id: int,
            data: schema.CreateRoutePresetSchema,
        ):
            if not get_manage_permissions(user=request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            try:
                preset = RoutePreset.objects.get(id=preset_id)
            except RoutePreset.DoesNotExist:
                return HTTPStatus.NOT_FOUND, {"detail": _("Route preset not found.")}

            if not data.origin_system_id or not data.destination_system_id:
                return HTTPStatus.BAD_REQUEST, {
                    "error": _("Origin and destination systems are required.")
                }

            try:
                origin_sys = SolarSystem.objects.get(id=data.origin_system_id)
                dest_sys = SolarSystem.objects.get(id=data.destination_system_id)
            except SolarSystem.DoesNotExist:
                return HTTPStatus.BAD_REQUEST, {"error": _("Solar system not found.")}

            preset.name = data.name
            preset.origin_system = origin_sys
            preset.origin_system_station = data.origin_system_station or ""
            preset.destination_system = dest_sys
            preset.destination_system_station = data.destination_system_station or ""
            preset.service_type = data.service_type or "jumpfreighter"
            preset.max_volume = data.max_volume if data.max_volume is not None else 0
            preset.max_collateral = (
                data.max_collateral if data.max_collateral is not None else 0
            )
            preset.base_fee = data.base_fee if data.base_fee is not None else 5_000_000
            preset.fee_per_m3 = data.fee_per_m3 if data.fee_per_m3 is not None else 0
            preset.fee_per_ly = data.fee_per_ly if data.fee_per_ly is not None else 0
            preset.collateral_percent = (
                data.collateral_percent if data.collateral_percent is not None else 0
            )
            preset.min_reward = data.min_reward if data.min_reward is not None else 0
            preset.estimated_time = (
                data.estimated_time if data.estimated_time is not None else 0
            )
            preset.is_cyno_route = bool(data.is_cyno_route)
            preset.danger_level = data.danger_level or "safe"
            if data.has_alliance_subsidy is not None:
                preset.has_alliance_subsidy = bool(data.has_alliance_subsidy)

            if data.assign_corp_id is not None:
                if data.assign_corp_id == 0:
                    preset.assign_corp = None
                else:
                    preset.assign_corp = ContractHandler.objects.filter(
                        organization_id=data.assign_corp_id
                    ).first()

            if data.expiration_days is not None:
                preset.expiration_days = data.expiration_days
            if data.days_to_complete is not None:
                preset.days_to_complete = data.days_to_complete

            preset.save()

            if data.cyno_waypoint_ids is not None:
                waypoints = SolarSystem.objects.filter(id__in=data.cyno_waypoint_ids)
                preset.cyno_waypoints.set(waypoints)

            return HTTPStatus.OK, schema.RoutePresetSchema(
                id=preset.id,
                name=preset.name,
                origin_system=preset.origin_system.name if preset.origin_system else "",
                origin_system_id=preset.origin_system_id,
                origin_station=preset.origin_system_station or "",
                destination_system=(
                    preset.destination_system.name if preset.destination_system else ""
                ),
                destination_system_id=preset.destination_system_id,
                destination_station=preset.destination_system_station or "",
                service_type=preset.service_type,
                max_volume=preset.max_volume,
                max_collateral=preset.max_collateral,
                base_fee=preset.base_fee,
                fee_per_m3=preset.fee_per_m3,
                fee_per_ly=float(preset.fee_per_ly),
                fee_per_ly_or_jump=float(preset.fee_per_ly),
                fee_per_lyorjump=float(preset.fee_per_ly),
                collateral_percent=(
                    float(preset.collateral_percent) / 100.0
                    if preset.collateral_percent >= 1
                    else float(preset.collateral_percent)
                ),
                min_reward=preset.min_reward,
                estimated_time=preset.estimated_time,
                estimated_days=(
                    round(preset.estimated_time / (24 * 60), 1)
                    if preset.estimated_time > 60
                    else max(1.0, float(preset.estimated_time))
                ),
                is_cyno_route=preset.is_cyno_route,
                cyno_waypoints=[w.name for w in preset.cyno_waypoints.all()],
                cyno_waypoint_ids=[w.id for w in preset.cyno_waypoints.all()],
                danger_level=(
                    preset.get_danger_level_display()
                    if hasattr(preset, "get_danger_level_display")
                    else preset.danger_level
                ),
                description="",
                has_alliance_subsidy=bool(
                    getattr(preset, "has_alliance_subsidy", True)
                ),
                assign_corp_id=preset.assign_corp_id,
                assign_corp_name=(
                    str(preset.assign_corp.organization.name)
                    if preset.assign_corp and preset.assign_corp.organization
                    else ""
                ),
                expiration_days=preset.expiration_days,
                days_to_complete=preset.days_to_complete,
            )

        @api.delete(
            "contract/preset/{preset_id}/",
            response={
                HTTPStatus.OK: dict,
                HTTPStatus.NOT_FOUND: dict,
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def delete_route_preset(request: WSGIRequest, preset_id: int):
            if not get_manage_permissions(user=request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            try:
                preset = RoutePreset.objects.get(id=preset_id)
            except RoutePreset.DoesNotExist:
                return HTTPStatus.NOT_FOUND, {"detail": _("Route preset not found.")}

            preset.delete()
            return HTTPStatus.OK, {
                "success": True,
                "message": str(_("Route preset deleted successfully.")),
            }

        @api.get(
            "contract/systems/",
            response={
                HTTPStatus.OK: list[schema.RouteSystemSchema],
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def get_route_systems(request: WSGIRequest):
            if not request.user.has_perm("aafenrir.basic_access"):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            route_systems = RouteSystem.objects.select_related(
                "system__constellation__region"
            ).order_by("system__name")

            results = []
            # pylint: disable=duplicate-code
            for rs in route_systems:
                s = rs.system
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
                    schema.RouteSystemSchema(
                        id=rs.id,
                        system_id=s.id,
                        name=s.name,
                        security_status=round(float(s.security_status or 0.0), 2),
                        security_class=sec_class,
                        region_name=region_name,
                        x=float(s.x or 0.0),
                        y=float(s.y or 0.0),
                        z=float(s.z or 0.0),
                    )
                )
            return HTTPStatus.OK, results

        @api.post(
            "contract/systems/",
            response={
                HTTPStatus.CREATED: schema.RouteSystemSchema,
                HTTPStatus.BAD_REQUEST: dict,
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def add_route_system(request: WSGIRequest, data: schema.AddRouteSystemSchema):
            if not get_manage_permissions(user=request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            try:
                solar_system = SolarSystem.objects.select_related(
                    "constellation__region"
                ).get(id=data.system_id)
            except SolarSystem.DoesNotExist:
                return HTTPStatus.BAD_REQUEST, {"error": _("Solar system not found.")}

            route_system = RouteSystem.objects.get_or_create(system=solar_system)[0]

            sec_class = "nullsec"
            if solar_system.security_status is not None:
                if solar_system.security_status >= 0.45:
                    sec_class = "highsec"
                elif solar_system.security_status > 0.0:
                    sec_class = "lowsec"
                elif getattr(solar_system, "is_wh_space", False) or (
                    31_000_000 <= solar_system.id < 32_000_000
                ):
                    sec_class = "wh"
                elif getattr(solar_system, "is_triglavian_space", False):
                    sec_class = "pochven"
                else:
                    sec_class = "nullsec"

            region_name = ""
            if solar_system.constellation and solar_system.constellation.region:
                region_name = solar_system.constellation.region.name

            return HTTPStatus.CREATED, schema.RouteSystemSchema(
                id=route_system.id,
                system_id=solar_system.id,
                name=solar_system.name,
                security_status=round(float(solar_system.security_status or 0.0), 2),
                security_class=sec_class,
                region_name=region_name,
                x=float(solar_system.x or 0.0),
                y=float(solar_system.y or 0.0),
                z=float(solar_system.z or 0.0),
            )

        @api.delete(
            "contract/system/{system_id}/",
            response={
                HTTPStatus.OK: dict,
                HTTPStatus.NOT_FOUND: dict,
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def delete_route_system(request: WSGIRequest, system_id: int):
            if not get_manage_permissions(user=request.user):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            deleted_count = RouteSystem.objects.filter(
                models.Q(id=system_id) | models.Q(system_id=system_id)
            ).delete()[0]

            if deleted_count == 0:
                return HTTPStatus.NOT_FOUND, {"detail": _("Route system not found.")}

            return HTTPStatus.OK, {
                "success": True,
                "message": str(_("Route system removed successfully.")),
            }

        @api.get(
            "contract/queue/",
            response={
                HTTPStatus.OK: list[schema.ContractSchema],
                HTTPStatus.FORBIDDEN: dict,
            },
            tags=self.tags,
        )
        def get_contract_queue(request: WSGIRequest):
            if not request.user.has_perm("aafenrir.basic_access"):
                return HTTPStatus.FORBIDDEN, {"error": _("Permission Denied.")}

            contracts = Contract.objects.all().order_by("-date_issued")

            results = []
            for c in contracts:
                try:
                    start_loc_name = (
                        c.start_location.name if c.start_location else _("Unknown")
                    )
                    start_loc_solar_system = (
                        c.start_location.solar_system_name
                        if c.start_location
                        else _("Unknown")
                    )
                except models.ObjectDoesNotExist:
                    start_loc_name = _("Unknown")
                    start_loc_solar_system = _("Unknown")

                try:
                    end_loc_name = (
                        c.end_location.name if c.end_location else _("Unknown")
                    )
                    end_loc_solar_system = (
                        c.end_location.solar_system_name
                        if c.end_location
                        else _("Unknown")
                    )
                except models.ObjectDoesNotExist:
                    end_loc_name = _("Unknown")
                    end_loc_solar_system = _("Unknown")

                try:
                    issuer_corp_name = (
                        c.issuer_corporation.corporation_name
                        if c.issuer_corporation
                        else ""
                    )
                    issuer_corp_ticker = (
                        c.issuer_corporation.corporation_ticker
                        if c.issuer_corporation
                        else ""
                    )
                except models.ObjectDoesNotExist:
                    issuer_corp_name = ""
                    issuer_corp_ticker = ""

                results.append(
                    schema.ContractSchema(
                        id=c.id,
                        contract_id=c.contract_id,
                        title=c.title or "",
                        status=c.status,
                        status_display=(
                            c.get_status_display()
                            if hasattr(c, "get_status_display")
                            else c.status
                        ),
                        issuer_name=c.issuer_name or "",
                        issuer_corporation_name=issuer_corp_name,
                        issuer_corporation_ticker=issuer_corp_ticker,
                        start_location_name=start_loc_name,
                        start_location_solar_system=start_loc_solar_system,
                        end_location_name=end_loc_name,
                        end_location_solar_system=end_loc_solar_system,
                        volume=float(c.volume or 0.0),
                        collateral=float(c.collateral or 0.0),
                        reward=float(c.reward or 0.0),
                        date_issued=c.date_issued,
                        date_expired=c.date_expired,
                        date_accepted=c.date_accepted,
                        date_completed=c.date_completed,
                        days_to_complete=c.days_to_complete or 0,
                        acceptor_name=c.acceptor_name,
                        for_corporation=bool(c.for_corporation),
                    )
                )
            return HTTPStatus.OK, results
