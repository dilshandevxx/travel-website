// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: Entry route: sends the user to the welcome screen
// TODO: Redirect logged-in users straight to the tabs

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/welcome" />;
}
