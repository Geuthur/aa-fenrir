"""App URLs"""

# Django
from django.urls import path, re_path

# Alliance Auth
from allianceauth.authentication.decorators import decorate_url_patterns

# AA Fenrir
from aafenrir import views
from aafenrir.api import api
from aafenrir.api.auth import basic_access_required

app_name: str = "aafenrir"  # pylint: disable=invalid-name

# Every URL of the API (endpoints, schema and docs) requires `basic_access`
api_patterns, api_app_name, api_namespace = api.urls
api_patterns = decorate_url_patterns(
    (api_patterns, api_app_name), basic_access_required
)[0]

urlpatterns = [
    # -- Contract Handler, must stay in front of the React catch-all
    path("handler/add/", views.add_contract_handler, name="add_contract_handler"),
    # -- React Frontend, all other routes are handled by the router
    path("", views.react_base, name="index"),
    re_path(r"^(?!api/).*$", views.react_base, name="react_base"),
    # -- API System
    re_path(r"^api/", (api_patterns, api_app_name, api_namespace)),
]
