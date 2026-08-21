import { clearTokens } from '@/utils/tokens';
import { clearProfileData } from '@/utils/profile';
import { navigationRef } from '@/navigation/navigationRef';

// Flag to prevent redundant logout sequences from multiple concurrent triggers
let isLoggingOut = false;

export async function handleUnauthorized() {
    if (isLoggingOut) {
        return;
    }
    isLoggingOut = true;

    try {
        // Clear stored tokens and profile data
        await clearTokens();
        await clearProfileData();

        // Reset navigation to the Welcome screen
        if (navigationRef.isReady()) {
            navigationRef.resetRoot({
                index: 0,
                routes: [{ name: 'Welcome' }],
            });
        }
    } finally {
        // Reset the flag after a short delay to allow navigation to settle
        setTimeout(() => {
            isLoggingOut = false;
        }, 1000);
    }
}
