"""Tests for the access to the React page."""

# Standard Library
from http import HTTPStatus

# Third Party
from evesde_factory.allianceauth import UserFactory

# Django
from django.conf import settings
from django.shortcuts import resolve_url
from django.urls import resolve, reverse

# AA Fenrir
from aafenrir import urls, views
from aafenrir.auth_hooks import FenrirMenuItem
from aafenrir.tests import AuthTestCase
from aafenrir.tests.testdata.factory import UserMainFactory

ROOT_ID = "aa-fenrir-root"


class TestViewAccess(AuthTestCase):
    """The React page requires login and basic_access on every path."""

    # Paths the page routes serve: index, frontend routes, and paths with a
    # leading number (formerly a separate route with `character_id`).
    PAGE_PATHS = ["", "queue/", "routes/admin/", "123/", "123/settings/", "123"]

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.base_url = reverse("aafenrir:index")

    def test_react_base_should_render_view(self):
        # given
        request = self.factory.get(self.base_url)
        request.user = self.user
        # when
        response = views.react_base(request)
        # then
        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertContains(response, ROOT_ID)
        self.assertNotIn("character_id", response.content.decode())

    def test_react_base_should_return_page_with_basic_access(self):
        self.client.force_login(self.user)
        for path in self.PAGE_PATHS:
            with self.subTest(path=path):
                response = self.client.get(f"{self.base_url}{path}")
                self.assertEqual(response.status_code, HTTPStatus.OK)
                self.assertContains(response, ROOT_ID)

    def test_react_base_should_redirect_unauthenticated_user_to_login(self):
        for path in self.PAGE_PATHS:
            with self.subTest(path=path):
                response = self.client.get(f"{self.base_url}{path}")
                self.assertEqual(response.status_code, HTTPStatus.FOUND)
                self.assertIn(resolve_url(settings.LOGIN_URL), response.url)

    def test_react_base_should_not_return_page_without_basic_access(self):
        """Other permissions of the app do not open the page either."""
        for permissions in (
            [],
            ["aafenrir.manage_access"],
            ["aafenrir.full_access"],
        ):
            user = UserMainFactory(permissions__=permissions)
            self.assertFalse(user.has_perm("aafenrir.basic_access"))
            self.client.force_login(user)
            for path in self.PAGE_PATHS:
                with self.subTest(permissions=permissions, path=path):
                    response = self.client.get(f"{self.base_url}{path}")
                    self.assertEqual(response.status_code, HTTPStatus.FOUND)
                    self.assertIn(resolve_url(settings.LOGIN_URL), response.url)
                    self.assertNotIn(ROOT_ID.encode(), response.content)

    def test_react_base_should_not_return_page_for_other_methods_without_access(self):
        self.client.force_login(UserMainFactory(permissions__=[]))
        for method in ("post", "put", "head", "options"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(f"{self.base_url}123/")
                self.assertEqual(response.status_code, HTTPStatus.FOUND)

    def test_react_base_should_not_fail_for_user_without_main_character(self):
        """The view itself no longer needs a main character."""
        # given
        user = UserFactory(permissions=["aafenrir.basic_access"])
        self.assertIsNone(user.profile.main_character)
        request = self.factory.get(self.base_url)
        request.user = user
        # when
        response = views.react_base(request)
        # then
        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertContains(response, ROOT_ID)

    def test_react_base_should_redirect_user_without_main_character(self):
        """Alliance Auth wraps all app urls with `main_character_required`."""
        # given
        user = UserFactory(permissions=["aafenrir.basic_access"])
        self.client.force_login(user)
        for path in self.PAGE_PATHS:
            with self.subTest(path=path):
                # when
                response = self.client.get(f"{self.base_url}{path}")
                # then
                self.assertEqual(response.status_code, HTTPStatus.FOUND)
                self.assertNotIn(ROOT_ID.encode(), response.content)

    def test_react_base_should_serve_all_page_routes(self):
        """Every route except the handler and the API resolves to the protected view, without arguments."""
        for path in self.PAGE_PATHS:
            with self.subTest(path=path):
                match = resolve(f"{self.base_url}{path}")
                self.assertEqual(match.url_name, "react_base" if path else "index")
                self.assertEqual(match.kwargs, {})
        self.assertNotIn(
            resolve(f"{self.base_url}api/menu/").url_name, ("index", "react_base")
        )
        self.assertEqual(
            resolve(f"{self.base_url}handler/add/").url_name, "add_contract_handler"
        )
        # Alliance Auth wraps each callback, so compare by name
        page_views = {
            pattern.callback.__name__
            for pattern in urls.urlpatterns
            if getattr(pattern, "name", None) in ("index", "react_base")
        }
        self.assertSetEqual(page_views, {views.react_base.__name__})
        self.assertListEqual(
            [getattr(pattern, "name", None) for pattern in urls.urlpatterns],
            ["add_contract_handler", "index", "react_base", None],
        )


class TestMenuHook(AuthTestCase):
    """The menu entry follows the same permission as the page."""

    def _render(self, user) -> str:
        request = self.factory.get(reverse("aafenrir:index"))
        request.user = user
        return FenrirMenuItem().render(request)

    def test_should_show_menu_entry_with_basic_access(self):
        self.assertIn(reverse("aafenrir:index"), self._render(self.user))

    def test_should_hide_menu_entry_without_basic_access(self):
        self.assertEqual(self._render(UserMainFactory(permissions__=[])), "")
