import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, test } from 'vitest';
import { appTheme } from '../../app/theme/theme';
import { StatePanel } from './StatePanel';

describe('StatePanel', () => {
  test('renders loading state as a polite status with a progress indicator', () => {
    renderStatePanel(<StatePanel state="loading" message="Загружаем проекты..." />);

    expect(screen.getByRole('status')).toHaveTextContent('Загружаем проекты...');
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  test('renders error state with alert semantics', () => {
    renderStatePanel(<StatePanel state="error" message="Не удалось загрузить проекты." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить проекты.');
  });

  test('renders empty state as a polite status with optional detail', () => {
    renderStatePanel(
      <StatePanel
        state="empty"
        message="Проекты не найдены"
        detail="Измените фильтры или создайте новый проект."
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Проекты не найдены');
    expect(screen.getByText('Измените фильтры или создайте новый проект.')).toBeVisible();
  });
});

function renderStatePanel(node: ReactElement) {
  return render(<ThemeProvider theme={appTheme}>{node}</ThemeProvider>);
}
