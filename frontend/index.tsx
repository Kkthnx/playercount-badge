import { definePlugin, Field, Toggle } from '@steambrew/client';
import { STORAGE_KEY_SHOW } from './constants';
import { UIMode } from './injection/detector';
import { disconnectObserver, setupObserver } from './injection/observer';

export default definePlugin(() => {
  console.log('[PlayerCount] plugin loaded');

  setupObserver(document, UIMode.Desktop);

  return {
    title: 'Player Count',
    icon: null,
    onDismount() {
      disconnectObserver();
    },
    content: (
      <Field label="Show live player count">
        <Toggle
          value={localStorage.getItem(STORAGE_KEY_SHOW) !== 'false'}
          onChange={(value: boolean) => {
            localStorage.setItem(STORAGE_KEY_SHOW, String(value));
            if (!value) {
              disconnectObserver();
            } else {
              setupObserver(document, UIMode.Desktop);
            }
          }}
        />
      </Field>
    ),
  };
});
