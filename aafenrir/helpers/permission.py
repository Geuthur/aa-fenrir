# Alliance Auth
from allianceauth.authentication.models import User


def get_manage_permissions(user: User) -> bool:
    """
    Check if the user has manage permissions.

    Args:
        user (User): The user to check permissions for.

    Returns:
        bool: True if the user has manage permissions, False otherwise.
    """
    if user.has_perm("aafenrir.manage_access") or user.has_perm("aafenrir.full_access"):
        return True
    return False
