"""App URLs"""

# Django
# pylint: disable=unused-import
from django.urls import path, re_path

# AA Fenrir
from aafenrir import views

# pylint: disable=unused-import
from aafenrir.api import api

app_name: str = "aafenrir"  # pylint: disable=invalid-name

urlpatterns = [
    # Use this part if you use frontend via React
    # -- Catch-all / React Frontend Routing
    path("", views.react_base, name="index"),
    re_path(r"^(?P<character_id>\d+)/", views.react_base, name="react_base"),
    re_path(r"^(?!api/).*$", views.react_base, name="react_base"),
    # -- API System
    re_path(r"^api/", api.urls),
]
