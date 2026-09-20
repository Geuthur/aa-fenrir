# Third Party
from ninja import NinjaAPI
from ninja.security import django_auth

# Django
from django.conf import settings

# AA Fenrir
from aafenrir import __title__
from aafenrir.api import contract, eve_sde, general

api = NinjaAPI(
    title="AA Fenrir API",
    version="0.5.0",
    urls_namespace="aafenrir:api",
    auth=django_auth,
    openapi_url=settings.DEBUG and "/openapi.json" or "",
)


def setup(ninja_api):
    general.GeneralApiEndpoints(ninja_api)
    contract.ContractApiEndpoints(ninja_api)
    eve_sde.EveSdeApiEndpoints(ninja_api)


# Initialize API endpoints
setup(api)
