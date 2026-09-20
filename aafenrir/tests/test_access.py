"""Template for a TestView class."""

# Standard Library
from http import HTTPStatus

# Django
from django.urls import reverse

# AA Fenrir
from aafenrir import views
from aafenrir.tests import AuthTestCase


class TestViews(AuthTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()

    # def test_index(self):
    #    """
    #    Test should render index view.
    #    """
    #    # given
    #    request = self.factory.get(reverse("example:index"))
    #    request.user = self.user
    #    # when
    #    response = views.index(request)
    #    # then
    #    self.assertEqual(response.status_code, HTTPStatus.OK)
    #    self.assertContains(response, "Example")
