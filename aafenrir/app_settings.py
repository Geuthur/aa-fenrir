"""
App Settings
"""

# Django
from django.conf import settings

# Set Naming on Auth Hook
AA_FENRIR_APP_NAME = getattr(settings, "AA_FENRIR_APP_NAME", "AA Fenrir")

# Task Settings
# Global timeout for tasks in seconds to reduce task accumulation during outages.
AA_FENRIR_TASKS_TIME_LIMIT = getattr(
    settings, "AA_FENRIR_TASKS_TIME_LIMIT", 1200
)  # 20 minutes

# Maximum Number of Objects processed per run of DJANGO Batch Method
# Controls how many database records are inserted in a single batch operation.
# If you encounter "Got a packet bigger than 'max_allowed_packet' bytes" errors,
# reduce this value (e.g., to 250 or 100).
# Can be increased for better performance if your MySQL max_allowed_packet setting
# is configured higher (default is usually 16-64MB).
AA_FENRIR_BULK_BATCH_SIZE = getattr(settings, "AA_FENRIR_BULK_BATCH_SIZE", 500)
