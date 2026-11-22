// React
import { useState } from 'react';

// Third Party
import { ErrorLoader, FetchingLoader, useUserSettings } from "aa-geuthur-react";
import Alert from 'react-bootstrap/Alert';
import { useTranslation } from 'react-i18next';

// AA Fenrir
import type { UserSettingsSchema, UserSettingsUpdateRequest } from "@/Api/schema";
import UserSettingsForm from '@/Components/Forms/UserSettingsForm';

function Settings() {
    const { t } = useTranslation();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Loads the settings and saves them optimistically (rollback on error)
    const { data, isLoading, isError, error, updateMutation } = useUserSettings<UserSettingsSchema, UserSettingsUpdateRequest>();

    const handleSave = (disableNotifications: boolean) => {
        updateMutation.mutate(
            { disable_notifications: disableNotifications },
            {
                onSuccess: () => {
                    setErrorMessage(null);
                    setSuccessMessage(t("Settings saved successfully."));
                },
                onError: (err: unknown) => {
                    setSuccessMessage(null);
                    setErrorMessage(err instanceof Error ? err.message : t("Failed to save settings."));
                },
            },
        );
    };

    return (
        <main className="mt-4">
            <section className="card" aria-labelledby="settings-heading">
                <div className="card-header bg-primary rounded">
                    <h2 id="settings-heading" className="fs-6 fw-normal">{t("User Settings")}</h2>
                </div>
                <div className="card-body">
                    {successMessage && (
                        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
                            {successMessage}
                        </Alert>
                    )}

                    {errorMessage && (
                        <Alert variant="danger" onClose={() => setErrorMessage(null)} dismissible>
                            {errorMessage}
                        </Alert>
                    )}

                    {isLoading && <FetchingLoader message={t("Loading user settings...")} />}

                    {isError && (
                        <ErrorLoader
                            title={t("Error")}
                            message={error instanceof Error ? error.message : t("Failed to load user settings.")}
                        />
                    )}

                    {!isLoading && !isError && data && (
                        <UserSettingsForm
                            key={String(data.disable_notifications)}
                            initialDisableNotifications={data.disable_notifications}
                            onSubmit={handleSave}
                            isPending={updateMutation.isPending}
                        />
                    )}
                </div>
            </section>
        </main>
    );
}

export default Settings;
