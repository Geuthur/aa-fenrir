// React
import { useState } from 'react';

// Third Party
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Alert from 'react-bootstrap/Alert';
import { useTranslation } from 'react-i18next';

import { loadUserData, updateUserSettings } from '@/Api/ApiCalls';
import { queryKeys } from '@/Api/query';
import UserSettingsForm from '@/Components/Forms/UserSettingsForm';
import ErrorLoader from '@/Components/Loader/ErrorLoader';
import FetchingLoader from '@/Components/Loader/FetchingLoader';

function Settings() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: queryKeys.User,
        queryFn: loadUserData,
        refetchOnWindowFocus: false,
    });

    const mutation = useMutation({
        mutationFn: (disableNotifications: boolean) =>
            updateUserSettings({ disable_notifications: disableNotifications }),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.User });
            setErrorMessage(null);
            setSuccessMessage(result.message ?? t("Settings saved successfully."));
        },
        onError: (err: unknown) => {
            setSuccessMessage(null);
            setErrorMessage(err instanceof Error ? err.message : t("Failed to save settings."));
        },
    });

    const handleSave = (disableNotifications: boolean) => {
        mutation.mutate(disableNotifications);
    };

    return (
        <main className="mt-4">
            <section className="card" aria-labelledby="settings-heading">
                <div className="card-header bg-primary rounded">
                    <h2 id="settings-heading">{t("User Settings")}</h2>
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
                            key={String(data.user.notification)}
                            initialDisableNotifications={data.user.notification}
                            onSubmit={handleSave}
                            isPending={mutation.isPending}
                        />
                    )}
                </div>
            </section>
        </main>
    );
}

export default Settings;
